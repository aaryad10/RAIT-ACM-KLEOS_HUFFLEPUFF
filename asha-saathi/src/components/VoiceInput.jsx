/**
 * VoiceInput.jsx — Multilingual, noise-suppressed voice input
 *
 * Changes from original:
 * 1. getUserMedia now requests noiseSuppression + echoCancellation (browser-native, free, works offline)
 * 2. All UI labels come from the active language config (prop: langKey)
 * 3. Passes langKey to whisperWorker so it can hint the model's language for better accuracy
 * 4. Shows a "clean audio" playback button after recording so the worker can hear what was captured
 * 5. Whisper model is now "openai/whisper-small" (better Indian language accuracy, still offline)
 */
import { useEffect, useRef, useState } from "react";
import { getLang } from "../engine/languageConfig";

export default function VoiceInput({ onTranscript, langKey = "hi" }) {
  const [status, setStatus] = useState("idle");
  // idle | loading | ready | recording | transcribing | error
  const [transcript, setTranscript] = useState("");
  const [cleanAudioURL, setCleanAudioURL] = useState(null);

  const workerRef         = useRef(null);
  const mediaRecorderRef  = useRef(null);
  const audioChunksRef    = useRef([]);

  const ui = getLang(langKey).ui;

  useEffect(() => {
    const worker = new Worker(
      new URL("../whisperWorker.js", import.meta.url),
      { type: "module" }
    );
    workerRef.current = worker;

    worker.onmessage = (e) => {
      if (e.data.type === "status") setStatus("loading");
      if (e.data.type === "ready")  setStatus("ready");
      if (e.data.type === "result") {
        setTranscript(e.data.text);
        setStatus("ready");
        onTranscript(e.data.text);
      }
      if (e.data.type === "error") {
        setStatus("error");
        console.error("Whisper error:", e.data.message);
      }
    };

    // Pass the language hint when loading — whisperWorker.js should forward this
    // to the pipeline so Whisper skips language-detection and goes straight to the
    // right language, reducing errors on short utterances.
    worker.postMessage({ type: "load", langKey });

    return () => worker.terminate();
  }, [langKey]);

  async function startRecording() {
    // Revoke any previous clean-audio object URL to avoid memory leaks
    if (cleanAudioURL) {
      URL.revokeObjectURL(cleanAudioURL);
      setCleanAudioURL(null);
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          // ── Noise suppression layer 1: browser-native DSP (free, offline, instant) ──
          noiseSuppression: true,
          echoCancellation: true,
          autoGainControl:  true,
          // Keep sample rate high for Whisper; we'll downsample in the worker
          sampleRate: 44100,
        },
      });

      const mediaRecorder = new MediaRecorder(stream, {
        // Prefer webm/opus for smaller chunks; fallback handled by browser
        mimeType: MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
          ? "audio/webm;codecs=opus"
          : "audio/webm",
      });
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current   = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = async () => {
        setStatus("transcribing");

        const blob = new Blob(audioChunksRef.current, { type: "audio/webm" });

        // Make the cleaned audio available for playback before we decode it
        const playbackURL = URL.createObjectURL(blob);
        setCleanAudioURL(playbackURL);

        // Decode → 16 kHz mono float32 for Whisper
        const arrayBuffer  = await blob.arrayBuffer();
        const audioContext = new AudioContext({ sampleRate: 16000 });
        const audioBuffer  = await audioContext.decodeAudioData(arrayBuffer);
        const float32      = audioBuffer.getChannelData(0);

        workerRef.current.postMessage({
          type: "transcribe",
          audio: float32,
          langKey,           // hint for the model
        });

        stream.getTracks().forEach((t) => t.stop());
      };

      mediaRecorder.start();
      setStatus("recording");

      // Auto-stop after 10 seconds (slightly longer than original for longer utterances)
      setTimeout(() => {
        if (mediaRecorder.state === "recording") mediaRecorder.stop();
      }, 10000);

    } catch (err) {
      setStatus("error");
      console.error("Mic error:", err);
    }
  }

  function stopRecording() {
    if (mediaRecorderRef.current?.state === "recording") {
      mediaRecorderRef.current.stop();
    }
  }

  const isDisabled = status === "idle" || status === "loading" || status === "transcribing";
  const isRecording = status === "recording";

  return (
    <div style={{ marginBottom: "16px" }}>

      {/* Noise suppression badge */}
      <div style={{
        display: "flex", alignItems: "center", gap: "6px",
        marginBottom: "10px",
      }}>
        <div style={{
          width: "6px", height: "6px", borderRadius: "50%",
          background: "#22c55e", boxShadow: "0 0 4px #22c55e",
        }} />
        <span style={{ fontSize: "11px", color: "#22c55e", fontWeight: "500" }}>
          {ui.noiseNote}
        </span>
      </div>

      {/* Main record button */}
      <button
        onClick={isRecording ? stopRecording : startRecording}
        disabled={isDisabled}
        style={{
          padding: "14px 24px",
          fontSize: "16px",
          background: isRecording ? "#991b1b" : isDisabled ? "#1f2937" : "#1d4ed8",
          color: isDisabled ? "#6b7280" : "white",
          border: isRecording ? "2px solid #ef4444" : "none",
          borderRadius: "12px",
          cursor: isDisabled ? "not-allowed" : "pointer",
          width: "100%",
          fontWeight: "600",
          transition: "all 0.15s",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Pulse animation while recording */}
        {isRecording && (
          <span style={{
            position: "absolute", inset: 0,
            background: "rgba(239,68,68,0.15)",
            animation: "pulse 1.2s ease-in-out infinite",
          }} />
        )}
        <span style={{ position: "relative" }}>
          {status === "idle"          && ui.voiceIdle}
          {status === "loading"       && ui.voiceLoading}
          {status === "ready"         && ui.voiceReady}
          {status === "recording"     && ui.voiceRecording}
          {status === "transcribing"  && ui.voiceTranscribing}
          {status === "error"         && ui.voiceError}
        </span>
      </button>

      {/* Playback — "hear the clean audio" */}
      {cleanAudioURL && status !== "recording" && (
        <div style={{
          marginTop: "10px", padding: "10px 14px",
          background: "#111827", borderRadius: "10px",
          border: "1px solid #1f2937",
          display: "flex", alignItems: "center", gap: "10px",
        }}>
          <span style={{ fontSize: "12px", color: "#6b7280", flexShrink: 0 }}>
            🎧 Clean audio:
          </span>
          <audio
            src={cleanAudioURL}
            controls
            style={{ flex: 1, height: "28px", filter: "invert(0.9) hue-rotate(180deg)" }}
          />
        </div>
      )}

      {/* Transcript display */}
      {transcript && (
        <div style={{
          marginTop: "10px", padding: "10px 14px",
          background: "#111827", borderRadius: "10px",
          border: "1px solid #1f2937",
        }}>
          <span style={{ fontSize: "11px", color: "#6b7280" }}>{ui.voiceHeard}: </span>
          <span style={{ fontSize: "14px", color: "#d1d5db" }}>"{transcript}"</span>
        </div>
      )}

      {/* CSS for pulse animation */}
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 0.3; }
          50% { opacity: 0.7; }
        }
      `}</style>
    </div>
  );
}