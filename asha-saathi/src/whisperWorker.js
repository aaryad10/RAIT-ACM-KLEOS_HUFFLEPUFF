/**
 * whisperWorker.js — Offline STT via Transformers.js
 *
 * Changes from original:
 * - Model upgraded: whisper-tiny → openai/whisper-small
 *   (meaningfully better on Hindi/Marathi/Tamil etc., still runs in-browser)
 * - Accepts `langKey` in the "transcribe" message to hint the pipeline language,
 *   which skips auto-detection and reduces word-error-rate on short clips
 * - Model is cached by the browser/service-worker after first load (no repeat downloads)
 */
import { pipeline } from "@huggingface/transformers";

let transcriber = null;

// Map our internal language keys to Whisper's language tokens
const WHISPER_LANG_MAP = {
  hi: "hindi",
  mr: "marathi",
  ta: "tamil",
  te: "telugu",
  kn: "kannada",
  bn: "bengali",
  gu: "gujarati",
  en: "english",
};

self.onmessage = async (e) => {
  const { type, langKey, audio } = e.data;

  if (type === "load") {
    try {
      self.postMessage({ type: "status", message: "loading" });

      transcriber = await pipeline(
        "automatic-speech-recognition",
        // whisper-small: ~244M params, much better on Indian languages than tiny (~39M)
        // Still runs fully in-browser via WASM/WebGL — no server needed
        "openai/whisper-small",
        {
          // Use quantized weights for faster inference on low-end devices
          quantized: true,
          // Progress callback (optional — remove if you don't show a progress bar)
          progress_callback: (progress) => {
            self.postMessage({ type: "progress", progress });
          },
        }
      );

      self.postMessage({ type: "ready" });
    } catch (err) {
      self.postMessage({ type: "error", message: err.message });
    }
  }

  if (type === "transcribe") {
    if (!transcriber) {
      self.postMessage({ type: "error", message: "Model not loaded yet" });
      return;
    }
    try {
      // Resolve the language token; default to no hint (auto-detect) if unknown
      const whisperLang = WHISPER_LANG_MAP[langKey] || null;

      const result = await transcriber(audio, {
        // Hint the language to skip auto-detection — reduces errors on short clips
        ...(whisperLang ? { language: whisperLang } : {}),
        // task: "transcribe" keeps the original language; "translate" → English
        task: "transcribe",
        // Return timestamps if you ever want word-level alignment later
        return_timestamps: false,
        // chunk_length_s: 30 is default; matches Whisper's training context
        chunk_length_s: 30,
      });

      self.postMessage({ type: "result", text: result.text?.trim() ?? "" });
    } catch (err) {
      self.postMessage({ type: "error", message: err.message });
    }
  }
};