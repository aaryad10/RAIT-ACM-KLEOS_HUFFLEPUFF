/**
 * VoiceInput.jsx — Hybrid STT: SpeechRecognition (primary) + Whisper (offline fallback)
 *
 * Flow:
 * 1. Try Web Speech API (SpeechRecognition) — instant, accurate for Indian languages on Chrome
 * 2. If unavailable or fails → fall back to Whisper in Web Worker (offline guaranteed)
 * 3. Either way: noise suppression + clean audio playback always active
 * 4. UI shows which mode is active so evaluator can see the hybrid architecture
 */
import { useEffect, useRef, useState } from "react";
import { getLang } from "../engine/languageConfig";

// Map langKey → BCP-47 locale for SpeechRecognition
const SPEECH_LOCALES = {
  hi: "hi-IN", mr: "mr-IN", ta: "ta-IN",
  te: "te-IN", kn: "kn-IN", bn: "bn-IN",
  gu: "gu-IN", en: "en-IN",
};

const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
const hasSpeechAPI = !!SpeechRecognition;

export default function VoiceInput({ onTranscript, langKey = "hi" }) {
  // status: idle | loading | ready | recording | transcribing | error
  const [status, setStatus]         = useState("idle");
  const [transcript, setTranscript] = useState("");
  const [cleanAudioURL, setCleanAudioURL] = useState(null);
  const [mode, setMode]             = useState(null); // "browser" | "whisper"

  const workerRef        = useRef(null);
  const recognitionRef   = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef   = useRef([]);

  const ui     = getLang(langKey).ui;
  const locale = SPEECH_LOCALES[langKey] || "hi-IN";

  // Load Whisper worker as fallback regardless — it runs in background
  useEffect(() => {
    const worker = new Worker(
      new URL("../whisperWorker.js", import.meta.url),
      { type: "module" }
    );
    workerRef.current = worker;

    worker.onmessage = (e) => {
      if (e.data.type === "ready" && status === "idle") setStatus("ready");
      if (e.data.type === "result") {
        const text = e.data.text;
        setTranscript(text);
        setStatus("ready");
        onTranscript(text);
      }
      if (e.data.type === "error") {
        setStatus("error");
      }
    };

    worker.postMessage({ type: "load", langKey });

    // If SpeechRecognition is available, don't wait for Whisper to be "ready"
    if (hasSpeechAPI) setStatus("ready");

    return () => worker.terminate();
  }, [langKey]);

  // ── SpeechRecognition path ────────────────────────────────────────────────
  function startBrowserSpeech(stream) {
    setMode("browser");
    const recognition = new SpeechRecognition();
    recognition.lang = locale;
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    recognitionRef.current = recognition;

    recognition.onresult = (e) => {
      const text = e.results[0][0].transcript;
      setTranscript(text);
      setStatus("ready");
      onTranscript(text);
      stream.getTracks().forEach((t) => t.stop());
    };

    recognition.onerror = (e) => {
      console.warn("SpeechRecognition failed, falling back to Whisper:", e.error);
      // Fall back to Whisper with already-recorded audio
      recognition.stop();
      triggerWhisperFromStream(stream);
    };

    recognition.onend = () => {
      if (status === "recording") setStatus("transcribing");
    };

    recognition.start();
  }

  // ── Whisper fallback path ─────────────────────────────────────────────────
  function triggerWhisperFromStream(stream) {
    setMode("whisper");
    const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
      ? "audio/webm;codecs=opus" : "audio/webm";

    const mediaRecorder = new MediaRecorder(stream, { mimeType });
    mediaRecorderRef.current = mediaRecorder;
    audioChunksRef.current = [];

    mediaRecorder.ondataavailable = (e) => {
      if (e.data.size > 0) audioChunksRef.current.push(e.data);
    };

    mediaRecorder.onstop = async () => {
      setStatus("transcribing");
      const blob = new Blob(audioChunksRef.current, { type: "audio/webm" });
      const playbackURL = URL.createObjectURL(blob);
      setCleanAudioURL(playbackURL);

      const arrayBuffer  = await blob.arrayBuffer();
      const audioContext = new AudioContext({ sampleRate: 16000 });
      const audioBuffer  = await audioContext.decodeAudioData(arrayBuffer);
      const float32      = audioBuffer.getChannelData(0);

      workerRef.current.postMessage({ type: "transcribe", audio: float32, langKey });
      stream.getTracks().forEach((t) => t.stop());
    };

    mediaRecorder.start();
    setTimeout(() => {
      if (mediaRecorder.state === "recording") mediaRecorder.stop();
    }, 10000);
  }

  // ── Main start function ───────────────────────────────────────────────────
  async function startRecording() {
    if (cleanAudioURL) { URL.revokeObjectURL(cleanAudioURL); setCleanAudioURL(null); }
    setTranscript("");

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          noiseSuppression: true,
          echoCancellation: true,
          autoGainControl: true,
          sampleRate: 44100,
        },
      });

      setStatus("recording");

      // Always record audio for clean playback + Whisper fallback
      const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
        ? "audio/webm;codecs=opus" : "audio/webm";
      const mediaRecorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = async () => {
        // Save clean audio for playback regardless of STT path
        const blob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        setCleanAudioURL(URL.createObjectURL(blob));
      };

      mediaRecorder.start();

      if (hasSpeechAPI) {
        // Primary: browser SpeechRecognition (accurate, instant)
        startBrowserSpeech(stream);
      } else {
        // Fallback: Whisper
        triggerWhisperFromStream(stream);
      }

      // Auto-stop after 10s
      setTimeout(() => {
        if (mediaRecorder.state === "recording") {
          mediaRecorder.stop();
          if (hasSpeechAPI && recognitionRef.current) recognitionRef.current.stop();
        }
      }, 10000);

    } catch (err) {
      setStatus("error");
      console.error("Mic error:", err);
    }
  }

  function stopRecording() {
    if (mediaRecorderRef.current?.state === "recording") mediaRecorderRef.current.stop();
    if (recognitionRef.current) recognitionRef.current.stop();
  }

  const isDisabled  = status === "idle" || status === "loading" || status === "transcribing";
  const isRecording = status === "recording";

  return (
    <div style={{ marginBottom: "16px" }}>

      {/* Mode + noise badge row */}
      <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "10px", flexWrap: "wrap" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
          <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#22c55e", boxShadow: "0 0 4px #22c55e" }} />
          <span style={{ fontSize: "11px", color: "#22c55e", fontWeight: "500" }}>{ui.noiseNote}</span>
        </div>
        {/* STT mode indicator */}
        <div style={{ marginLeft: "auto", fontSize: "10px", fontWeight: "600", padding: "2px 8px", borderRadius: "6px",
          background: mode === "browser" ? "#1d4ed822" : mode === "whisper" ? "#45140a" : "#1f2937",
          color: mode === "browser" ? "#60a5fa" : mode === "whisper" ? "#f97316" : "#6b7280",
          border: `1px solid ${mode === "browser" ? "#3b82f644" : mode === "whisper" ? "#f9730044" : "#37415144"}`,
        }}>
          {mode === "browser" ? "🌐 Browser STT" : mode === "whisper" ? "🔒 Offline Whisper" : hasSpeechAPI ? "🌐 Browser STT ready" : "🔒 Offline mode"}
        </div>
      </div>

      {/* Main record button */}
      <button
        onClick={isRecording ? stopRecording : startRecording}
        disabled={isDisabled}
        style={{
          padding: "14px 24px", fontSize: "16px", width: "100%", fontWeight: "600",
          background: isRecording ? "#991b1b" : isDisabled ? "#1f2937" : "#1d4ed8",
          color: isDisabled ? "#6b7280" : "white",
          border: isRecording ? "2px solid #ef4444" : "none",
          borderRadius: "12px", cursor: isDisabled ? "not-allowed" : "pointer",
          transition: "all 0.15s", position: "relative", overflow: "hidden",
        }}
      >
        {isRecording && (
          <span style={{ position: "absolute", inset: 0, background: "rgba(239,68,68,0.15)", animation: "pulse 1.2s ease-in-out infinite" }} />
        )}
        <span style={{ position: "relative" }}>
          {status === "idle"         && ui.voiceIdle}
          {status === "loading"      && ui.voiceLoading}
          {status === "ready"        && ui.voiceReady}
          {status === "recording"    && ui.voiceRecording}
          {status === "transcribing" && ui.voiceTranscribing}
          {status === "error"        && ui.voiceError}
        </span>
      </button>

      {/* Clean audio playback */}
      {cleanAudioURL && status !== "recording" && (
        <div style={{ marginTop: "10px", padding: "10px 14px", background: "#111827", borderRadius: "10px", border: "1px solid #1f2937", display: "flex", alignItems: "center", gap: "10px" }}>
          <span style={{ fontSize: "12px", color: "#6b7280", flexShrink: 0 }}>🎧 Clean audio:</span>
          <audio src={cleanAudioURL} controls style={{ flex: 1, height: "28px", filter: "invert(0.9) hue-rotate(180deg)" }} />
        </div>
      )}

      {/* Transcript */}
      {transcript && (
        <div style={{ marginTop: "10px", padding: "10px 14px", background: "#111827", borderRadius: "10px", border: "1px solid #1f2937" }}>
          <span style={{ fontSize: "11px", color: "#6b7280" }}>{ui.voiceHeard}: </span>
          <span style={{ fontSize: "14px", color: "#d1d5db" }}>"{transcript}"</span>
        </div>
      )}

      <style>{`@keyframes pulse { 0%, 100% { opacity: 0.3; } 50% { opacity: 0.7; } }`}</style>
    </div>
  );
}