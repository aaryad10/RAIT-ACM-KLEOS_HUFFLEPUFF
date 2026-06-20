import { pipeline } from "@huggingface/transformers";

let transcriber = null;

const WHISPER_LANG_MAP = {
  hi: "hindi", mr: "marathi", ta: "tamil", te: "telugu",
  kn: "kannada", bn: "bengali", gu: "gujarati", en: "english",
};

self.onmessage = async (e) => {
  const { type, langKey, audio } = e.data;

  if (type === "load") {
    try {
      self.postMessage({ type: "status", message: "loading" });

      transcriber = await pipeline(
        "automatic-speech-recognition",
        "onnx-community/whisper-tiny",
        { quantized: false }   // <-- fixed: quantized weights broken in transformers v4.2
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
      const whisperLang = WHISPER_LANG_MAP[langKey] || null;
      const result = await transcriber(audio, {
        ...(whisperLang ? { language: whisperLang } : {}),
        task: "transcribe",
        return_timestamps: false,
      });
      self.postMessage({ type: "result", text: result.text?.trim() ?? "" });
    } catch (err) {
      self.postMessage({ type: "error", message: err.message });
    }
  }
};