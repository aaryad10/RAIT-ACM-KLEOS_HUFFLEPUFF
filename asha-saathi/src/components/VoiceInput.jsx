import { useEffect, useRef, useState } from "react";

export default function VoiceInput({ onTranscript }) {
  const [status, setStatus] = useState("idle"); 
  // idle | loading | ready | recording | transcribing | error
  const [transcript, setTranscript] = useState("");
  const workerRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

  useEffect(() => {
    const worker = new Worker(
      new URL("../whisperWorker.js", import.meta.url),
      { type: "module" }
    );
    workerRef.current = worker;

    worker.onmessage = (e) => {
      if (e.data.type === "status") setStatus("loading");
      if (e.data.type === "ready") setStatus("ready");
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

    worker.postMessage({ type: "load" });

    return () => worker.terminate();
  }, []);

  async function startRecording() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = async () => {
        setStatus("transcribing");
        const blob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        const arrayBuffer = await blob.arrayBuffer();
        const audioContext = new AudioContext({ sampleRate: 16000 });
        const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
        const float32 = audioBuffer.getChannelData(0);
        workerRef.current.postMessage({ type: "transcribe", audio: float32 });
        stream.getTracks().forEach((t) => t.stop());
      };

      mediaRecorder.start();
      setStatus("recording");

      // Auto-stop after 8 seconds
      setTimeout(() => {
        if (mediaRecorder.state === "recording") mediaRecorder.stop();
      }, 8000);
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

  const statusLabels = {
    idle: "Initialising...",
    loading: "Loading voice model (first time only)...",
    ready: "🎤 Tap to speak",
    recording: "🔴 Recording... tap to stop",
    transcribing: "Processing speech...",
    error: "Voice unavailable — use checklist",
  };

  return (
    <div style={{ marginBottom: "16px", maxWidth: "500px" }}>
      <button
        onClick={status === "recording" ? stopRecording : startRecording}
        disabled={status === "idle" || status === "loading" || status === "transcribing"}
        style={{
          padding: "12px 24px",
          fontSize: "16px",
          background: status === "recording" ? "#d32f2f" : "#1565c0",
          color: "white",
          border: "none",
          borderRadius: "8px",
          cursor: status === "ready" || status === "recording" ? "pointer" : "not-allowed",
          opacity: status === "idle" || status === "loading" || status === "transcribing" ? 0.6 : 1,
          width: "100%",
        }}
      >
        {statusLabels[status]}
      </button>
      {transcript && (
        <p style={{ marginTop: "8px", color: "#aaa", fontSize: "14px" }}>
          Heard: "{transcript}"
        </p>
      )}
    </div>
  );
}