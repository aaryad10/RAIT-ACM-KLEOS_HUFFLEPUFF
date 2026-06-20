/**
 * CaptureGuide.jsx — Guided eye-photo capture for jaundice screening signal.
 */
import { useEffect, useRef, useState, useCallback } from "react";
import { segmentSclera } from "../vision/scleraSegmentation";

const CAPTURE_STRINGS = {
  hi: {
    title: "आँख की जाँच",
    subtitle: "पीलिया स्क्रीनिंग संकेत",
    alignEye: "आँख को अंडाकार घेरे में रखें",
    tooFar: "कैमरा पास लाएं",
    tooDark: "रोशनी कम है",
    eyeNotDetected: "आँख नहीं दिख रही",
    holdSteady: "अच्छा — स्थिर रखें",
    capture: "फोटो लें",
    retake: "फिर से लें",
    processing: "जाँच हो रही है...",
    confirm: "उपयोग करें",
    cameraError: "कैमरा शुरू नहीं हो सका",
    disclaimer: "यह केवल एक स्क्रीनिंग संकेत है, निदान नहीं।",
    skip: "छोड़ें",
    uploadPhoto: "फोटो अपलोड करें",
    uploadHint: "आँख को फोटो के बीच में रखें, नज़दीक से",
    uploadNotFound: "फोटो में आँख का सफेद भाग नहीं मिला",
  },
  mr: {
    title: "डोळ्याची तपासणी",
    subtitle: "कावीळ स्क्रीनिंग संकेत",
    alignEye: "डोळा अंडाकृती वर्तुळात ठेवा",
    tooFar: "कॅमेरा जवळ आणा",
    tooDark: "प्रकाश कमी आहे",
    eyeNotDetected: "डोळा दिसत नाही",
    holdSteady: "चांगले — स्थिर ठेवा",
    capture: "फोटो घ्या",
    retake: "पुन्हा घ्या",
    processing: "तपासणी सुरू आहे...",
    confirm: "वापरा",
    cameraError: "कॅमेरा सुरू झाला नाही",
    disclaimer: "हा फक्त एक स्क्रीनिंग संकेत आहे, निदान नाही.",
    skip: "वगळा",
    uploadPhoto: "फोटो अपलोड करा",
    uploadHint: "डोळा फोटोच्या मध्यभागी, जवळून ठेवा",
    uploadNotFound: "फोटोत डोळ्याचा पांढरा भाग सापडला नाही",
  },
  en: {
    title: "Eye Screening",
    subtitle: "Jaundice screening signal",
    alignEye: "Align eye within the oval",
    tooFar: "Move camera closer",
    tooDark: "Lighting too low",
    eyeNotDetected: "Eye not detected",
    holdSteady: "Good — hold steady",
    capture: "Capture",
    retake: "Retake",
    processing: "Analyzing...",
    confirm: "Use this",
    cameraError: "Could not start camera",
    disclaimer: "Screening signal only, not a diagnosis.",
    skip: "Skip",
    uploadPhoto: "Upload Photo",
    uploadHint: "Keep the eye centered and close-up in the photo",
    uploadNotFound: "No eye-white region found in photo",
  },
};

const GUIDE_WIDTH_RATIO = 0.55;
const GUIDE_HEIGHT_RATIO = 0.32;
const LIVE_CHECK_INTERVAL_MS = 600;
const MAX_UPLOAD_DIM = 1000;

const s = {
  page: { minHeight: "100vh", background: "#0a0f1e", display: "flex", flexDirection: "column" },
  topBar: {
    padding: "20px 24px", borderBottom: "1px solid #1f2937",
    display: "flex", alignItems: "center", gap: "12px",
  },
  backBtn: {
    background: "none", border: "1px solid #374151", color: "#9ca3af",
    borderRadius: "8px", padding: "6px 12px", cursor: "pointer", fontSize: "14px",
  },
  cameraWrap: {
    position: "relative", flex: 1, background: "#000",
    display: "flex", alignItems: "center", justifyContent: "center",
    overflow: "hidden", minHeight: "320px",
  },
  video: { width: "100%", height: "100%", objectFit: "cover" },
  canvas: { display: "none" },
  overlay: {
    position: "absolute", inset: 0,
    display: "flex", alignItems: "center", justifyContent: "center",
    pointerEvents: "none",
  },
  guideOval: (statusColor) => ({
    width: `${GUIDE_WIDTH_RATIO * 100}%`,
    height: `${GUIDE_HEIGHT_RATIO * 100}%`,
    border: `3px solid ${statusColor}`,
    borderRadius: "50%",
    boxShadow: `0 0 0 9999px rgba(0,0,0,0.45)`,
    transition: "border-color 0.2s",
  }),
  feedbackBadge: (statusColor) => ({
    position: "absolute", bottom: "20px", left: "50%", transform: "translateX(-50%)",
    background: "#000000cc", border: `1px solid ${statusColor}`, borderRadius: "20px",
    padding: "8px 18px", fontSize: "14px", fontWeight: "600", color: statusColor,
    whiteSpace: "nowrap",
  }),
  bottomBar: { padding: "20px 24px 32px", display: "flex", flexDirection: "column", gap: "12px" },
  captureBtn: (enabled) => ({
    width: "100%", padding: "16px", borderRadius: "14px",
    background: enabled ? "#3b82f6" : "#1f2937",
    color: enabled ? "white" : "#6b7280",
    border: "none", fontSize: "17px", fontWeight: "700",
    cursor: enabled ? "pointer" : "not-allowed",
  }),
  skipBtn: {
    width: "100%", padding: "12px", borderRadius: "12px",
    background: "none", color: "#6b7280", border: "1px solid #1f2937",
    fontSize: "14px", cursor: "pointer",
  },
  uploadBtn: {
    width: "100%", padding: "14px", borderRadius: "12px",
    background: "#111827", color: "#60a5fa", border: "1px solid #3b82f655",
    fontSize: "15px", fontWeight: "600", cursor: "pointer",
  },
  hiddenFileInput: { display: "none" },
  resultWrap: { padding: "24px", display: "flex", flexDirection: "column", gap: "16px" },
  resultImg: { width: "100%", borderRadius: "14px", border: "1px solid #1f2937" },
  resultStat: {
    background: "#111827", borderRadius: "12px", padding: "14px 16px",
    display: "flex", justifyContent: "space-between", fontSize: "14px",
  },
  disclaimer: {
    fontSize: "12px", color: "#6b7280", textAlign: "center",
    lineHeight: "1.5", padding: "0 8px",
  },
  errorBanner: {
    background: "#450a0a", border: "1px solid #ef444466", borderRadius: "10px",
    padding: "14px 16px", color: "#fca5a5", fontSize: "14px", margin: "16px 24px",
  },
  infoBanner: {
    background: "#1e3a5f", border: "1px solid #3b82f666", borderRadius: "10px",
    padding: "14px 16px", color: "#93c5fd", fontSize: "14px", margin: "0",
  },
};

export default function CaptureGuide({ langKey = "hi", onCapture, onBack, onSkip }) {
  const [phase, setPhase] = useState("starting");
  const [liveStatus, setLiveStatus] = useState("eyeNotDetected");
  const [capturedFrame, setCapturedFrame] = useState(null);
  const [segResult, setSegResult] = useState(null);
  const [errorMsg, setErrorMsg] = useState("");

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const liveIntervalRef = useRef(null);
  const fileInputRef = useRef(null);
  const mountedRef = useRef(true);

  const t = CAPTURE_STRINGS[langKey] || CAPTURE_STRINGS.en;

  const STATUS_COLORS = {
    eyeNotDetected: "#ef4444",
    tooDark: "#f59e0b",
    tooFar: "#f59e0b",
    holdSteady: "#22c55e",
  };

  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment", width: { ideal: 640 }, height: { ideal: 480 } },
      });
      if (!mountedRef.current) { stream.getTracks().forEach((tr) => tr.stop()); return; }
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      if (!mountedRef.current) { stream.getTracks().forEach((tr) => tr.stop()); return; }
      setPhase("live");
    } catch (err) {
      if (!mountedRef.current) return;
      console.error("Camera error:", err.name, err.message);
      setErrorMsg(err.name + ": " + err.message);
      setPhase("error");
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    mountedRef.current = true;
    startCamera();
    return () => {
      mountedRef.current = false;
      if (streamRef.current) { streamRef.current.getTracks().forEach((tr) => tr.stop()); streamRef.current = null; }
      if (liveIntervalRef.current) clearInterval(liveIntervalRef.current);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const grabGuideRegion = useCallback(() => {
    const video = videoRef.current;
    if (!video || video.readyState < 2) return null;
    const fullCanvas = canvasRef.current;
    const vw = video.videoWidth, vh = video.videoHeight;
    if (!vw || !vh) return null;
    fullCanvas.width = vw;
    fullCanvas.height = vh;
    const ctx = fullCanvas.getContext("2d");
    ctx.drawImage(video, 0, 0, vw, vh);
    const regionW = vw * GUIDE_WIDTH_RATIO;
    const regionH = vh * GUIDE_HEIGHT_RATIO;
    const regionX = (vw - regionW) / 2;
    const regionY = (vh - regionH) / 2;
    const imageData = ctx.getImageData(regionX, regionY, regionW, regionH);
    return { imageData, fullCanvas, regionX, regionY, regionW, regionH, vw, vh };
  }, []);

  function buildCroppedThumbnail(grabbed) {
    const { imageData, regionW, regionH } = grabbed;
    const cropCanvas = document.createElement("canvas");
    cropCanvas.width = regionW;
    cropCanvas.height = regionH;
    cropCanvas.getContext("2d").putImageData(imageData, 0, 0);
    return cropCanvas.toDataURL("image/jpeg", 0.85);
  }

  const runLiveCheck = useCallback(() => {
    const grabbed = grabGuideRegion();
    if (!grabbed) return;
    const { data } = grabbed.imageData;
    let sumL = 0, sampleCount = 0;
    for (let i = 0; i < data.length; i += 4 * 8) {
      const r = data[i], g = data[i + 1], b = data[i + 2];
      sumL += (Math.max(r, g, b) + Math.min(r, g, b)) / 2 / 255 * 100;
      sampleCount++;
    }
    const avgLightness = sampleCount ? sumL / sampleCount : 0;
    if (avgLightness < 25) { setLiveStatus("tooDark"); return; }
    const seg = segmentSclera(grabbed.imageData);
    if (!seg.success) { setLiveStatus(seg.coveragePct < 5 ? "tooFar" : "eyeNotDetected"); return; }
    setLiveStatus("holdSteady");
  }, [grabGuideRegion]);

  useEffect(() => {
    if (phase !== "live") return;
    liveIntervalRef.current = setInterval(runLiveCheck, LIVE_CHECK_INTERVAL_MS);
    return () => clearInterval(liveIntervalRef.current);
  }, [phase, runLiveCheck]);

  function handleCapture() {
    if (liveIntervalRef.current) clearInterval(liveIntervalRef.current);
    setPhase("processing");
    setTimeout(() => {
      const grabbed = grabGuideRegion();
      if (!grabbed) { setErrorMsg(t.cameraError); setPhase("error"); return; }
      const seg = segmentSclera(grabbed.imageData);
      const dataUrl = buildCroppedThumbnail(grabbed);
      setCapturedFrame({ dataUrl });
      setSegResult(seg);
      setPhase("result");
      if (streamRef.current) streamRef.current.getTracks().forEach((tr) => tr.stop());
    }, 150);
  }

  function handleRetake() {
    setCapturedFrame(null);
    setSegResult(null);
    setPhase("starting");
    startCamera();
  }

  // Always call onCapture — even if segmentation failed, pass it up with success:false
  // so App.jsx can combine with IMNCI result (jaundiceSignal.js handles success:false gracefully)
  function handleConfirm() {
    onCapture({
      segmentation: segResult || { success: false, reason: "no_segmentation" },
      thumbnailDataUrl: capturedFrame?.dataUrl || null,
      capturedAt: Date.now(),
    });
  }

  function handleUploadClick() { fileInputRef.current?.click(); }

  function handleFileSelected(e) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (liveIntervalRef.current) clearInterval(liveIntervalRef.current);
    if (streamRef.current) { streamRef.current.getTracks().forEach((tr) => tr.stop()); }
    setPhase("processing");

    const img = new Image();
    const objectUrl = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      const scale = Math.min(1, MAX_UPLOAD_DIM / Math.max(img.width, img.height));
      const w = Math.max(1, Math.round(img.width * scale));
      const h = Math.max(1, Math.round(img.height * scale));
      const offCanvas = document.createElement("canvas");
      offCanvas.width = w; offCanvas.height = h;
      const ctx = offCanvas.getContext("2d");
      ctx.drawImage(img, 0, 0, w, h);

      // Uploaded photos aren't pre-cropped to the eye the way the live camera
      // flow is (grabGuideRegion crops to the on-screen oval) — without this,
      // segmentation runs over the WHOLE photo (face, hair, background) and can
      // latch onto an unrelated bright/low-saturation region instead of the
      // actual sclera. Assume the worker centers the eye in frame (same
      // assumption the live guide oval makes) and crop to match before segmenting.
      const regionW = w * GUIDE_WIDTH_RATIO;
      const regionH = h * GUIDE_HEIGHT_RATIO;
      const regionX = (w - regionW) / 2;
      const regionY = (h - regionH) / 2;
      const imageData = ctx.getImageData(regionX, regionY, regionW, regionH);

      const seg = segmentSclera(imageData);

      const cropCanvas = document.createElement("canvas");
      cropCanvas.width = regionW;
      cropCanvas.height = regionH;
      cropCanvas.getContext("2d").putImageData(imageData, 0, 0);
      const dataUrl = cropCanvas.toDataURL("image/jpeg", 0.85);

      setCapturedFrame({ dataUrl });
      setSegResult(seg);
      setPhase("result");
    };
    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      setErrorMsg(t.uploadNotFound);
      setPhase("error");
    };
    img.src = objectUrl;
  }

  // ---- Render: error state ----
  if (phase === "error") {
    return (
      <div style={s.page}>
        <div style={s.topBar}>
          <button style={s.backBtn} onClick={onBack}>← Back</button>
          <span style={{ fontSize: "17px", fontWeight: "700", color: "#f9fafb" }}>{t.title}</span>
        </div>
        <div style={s.errorBanner}>⚠ {errorMsg}</div>
        <div style={s.bottomBar}>
          <input ref={fileInputRef} type="file" accept="image/*" style={s.hiddenFileInput} onChange={handleFileSelected} />
          <button style={s.uploadBtn} onClick={handleUploadClick}>{t.uploadPhoto}</button>
          {onSkip && <button style={s.skipBtn} onClick={onSkip}>{t.skip}</button>}
        </div>
      </div>
    );
  }

  // ---- Render: result/review state ----
  if (phase === "result") {
    const ok = segResult?.success;
    return (
      <div style={s.page}>
        <div style={s.topBar}>
          <button style={s.backBtn} onClick={onBack}>← Back</button>
          <span style={{ fontSize: "17px", fontWeight: "700", color: "#f9fafb" }}>{t.title}</span>
        </div>
        <div style={s.resultWrap}>
          {capturedFrame?.dataUrl && (
            <img src={capturedFrame.dataUrl} alt="Captured eye" style={s.resultImg} />
          )}
          {ok ? (
            <>
              <div style={s.resultStat}>
                <span style={{ color: "#9ca3af" }}>Sclera detected</span>
                <span style={{ color: "#22c55e", fontWeight: "700" }}>{segResult.coveragePct}% of frame</span>
              </div>
              <div style={s.resultStat}>
                <span style={{ color: "#9ca3af" }}>Color reading</span>
                <span style={{ color: "#f9fafb", fontWeight: "600" }}>
                  H {segResult.scleraHsl.h}° · S {segResult.scleraHsl.s}% · L {segResult.scleraHsl.l}%
                </span>
              </div>
            </>
          ) : (
            <div style={s.infoBanner}>
              ℹ Eye-white region not clearly detected — result will be used as-is. Tap "{t.confirm}" to continue or "{t.retake}" to try another photo.
            </div>
          )}
          <div style={s.disclaimer}>{t.disclaimer}</div>
        </div>
        <div style={s.bottomBar}>
          {/* Always show confirm — even failed segmentation passes through gracefully */}
          <button style={s.captureBtn(true)} onClick={handleConfirm}>{t.confirm}</button>
          <button style={s.skipBtn} onClick={handleRetake}>{t.retake}</button>
          {onSkip && <button style={s.skipBtn} onClick={onSkip}>{t.skip}</button>}
        </div>
      </div>
    );
  }

  // ---- Render: processing state ----
  if (phase === "processing") {
    return (
      <div style={s.page}>
        <div style={s.cameraWrap}>
          <div style={{ color: "#9ca3af", fontSize: "15px" }}>{t.processing}</div>
        </div>
      </div>
    );
  }

  // ---- Render: live camera / starting state ----
  const statusColor = STATUS_COLORS[liveStatus] || "#ef4444";
  const canCapture = phase === "live" && liveStatus === "holdSteady";

  return (
    <div style={s.page}>
      <div style={s.topBar}>
        <button style={s.backBtn} onClick={onBack}>← Back</button>
        <div>
          <div style={{ fontSize: "17px", fontWeight: "700", color: "#f9fafb" }}>{t.title}</div>
          <div style={{ fontSize: "12px", color: "#6b7280" }}>{t.subtitle}</div>
        </div>
      </div>
      <div style={s.cameraWrap}>
        <video ref={videoRef} style={s.video} playsInline muted />
        <canvas ref={canvasRef} style={s.canvas} />
        <div style={s.overlay}>
          <div style={s.guideOval(statusColor)} />
        </div>
        <div style={s.feedbackBadge(statusColor)}>
          {phase === "live" ? (t[liveStatus] || t.alignEye) : t.alignEye}
        </div>
      </div>
      <div style={s.bottomBar}>
        <button style={s.captureBtn(canCapture)} disabled={!canCapture} onClick={handleCapture}>
          {t.capture}
        </button>
        <input ref={fileInputRef} type="file" accept="image/*" style={s.hiddenFileInput} onChange={handleFileSelected} />
        <button style={s.uploadBtn} onClick={handleUploadClick}>{t.uploadPhoto}</button>
        <div style={{ fontSize: "11px", color: "#6b7280", textAlign: "center", marginTop: "-4px" }}>{t.uploadHint}</div>
        {onSkip && <button style={s.skipBtn} onClick={onSkip}>{t.skip}</button>}
        <div style={s.disclaimer}>{t.disclaimer}</div>
      </div>
    </div>
  );
}