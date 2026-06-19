import { pipeline, env } from '@huggingface/transformers';

env.allowLocalModels = false;
env.useBrowserCache = true;

let transcriber = null;

async function loadModel() {
  self.postMessage({ type: 'status', message: 'Loading model...' });
  try {
    transcriber = await pipeline(
      'automatic-speech-recognition',
      'onnx-community/whisper-tiny',
      { dtype: 'fp32' }
    );
    self.postMessage({ type: 'ready' });
  } catch (err) {
    self.postMessage({ type: 'error', message: err.message });
  }
}

self.onmessage = async (e) => {
  if (e.data.type === 'load') {
    await loadModel();
  } else if (e.data.type === 'transcribe') {
    try {
      const result = await transcriber(e.data.audio, {
        language: 'hindi',
        task: 'transcribe',
      });
      self.postMessage({ type: 'result', text: result.text });
    } catch (err) {
      self.postMessage({ type: 'error', message: err.message });
    }
  }
};