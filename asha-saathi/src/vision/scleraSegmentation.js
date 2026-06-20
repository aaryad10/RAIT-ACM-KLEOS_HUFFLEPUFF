/**
 * scleraSegmentation.js
 * Classical (non-ML) sclera segmentation from a captured eye-region image.
 *
 * DESIGN DECISION — why no face/eye-detection model:
 * Robust eye-detection from arbitrary photos is itself a hard CV problem requiring
 * either a trained model (more dataset/training burden, more bundle weight) or a
 * classical landmark library (e.g. dlib/MediaPipe FaceMesh — heavier dependency,
 * less reliable offline on low-end Android hardware typical for ASHA workers).
 *
 * Instead: CaptureGuide.jsx (companion UI component) overlays an on-screen oval
 * the worker aligns the patient's eye to before capture — the same pattern as a
 * passport-photo or QR-scanner guide. This converts "find the eye in the photo"
 * (hard, needs ML) into "the eye is approximately centered in a known region"
 * (trivial, needs no ML). This is a deliberate simplification, consistent with
 * the project's "self-relative calibration over physical calibration card" choice
 * earlier — same philosophy: solve the friction problem with UI/UX, not more ML.
 *
 * Within that known region, sclera-vs-not-sclera IS solved with classical CV,
 * following the published unsupervised approach: the sclera is the dominant
 * low-saturation, high-lightness, large connected region within the eye area —
 * distinguishable from iris (saturated, often darker), pupil (near-black),
 * eyelid/skin (different hue family, typically warmer/more saturated than sclera),
 * and eyelashes (near-black, thin structures).
 *
 * Requires a 2D canvas context with pixel data already drawn (browser-only;
 * uses ImageData, ctx.getImageData). No external CV library.
 */

/** RGB (0-255 each) -> HSL (h: 0-360, s/l: 0-100) */
function rgbToHsl(r, g, b) {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h *= 60;
  }

  return { h, s: s * 100, l: l * 100 };
}

/**
 * Classify a single pixel as one of: 'sclera', 'iris', 'pupil', 'skin', 'lash', 'unknown'
 * based on HSL heuristics derived from typical eye-region color distributions.
 */
function classifyPixel(hsl) {
  const { h, s, l } = hsl;

  // Pupil: very dark, low saturation
  if (l < 15) return "pupil_or_lash";

  // Sclera: near-white. Low-moderate saturation, high lightness.
  // This range intentionally stays wide enough to ALSO catch mild/moderate
  // jaundice (which raises saturation toward yellow) — we don't want segmentation
  // itself to exclude the very pixels the classifier needs to see.
  if (l > 55 && s < 60) {
    // Exclude skin-toned false positives: skin sits in a warmer, narrower hue band
    // (roughly 5-40deg) AND tends to have moderate saturation even when bright.
    const looksLikeSkin = h >= 5 && h <= 40 && s > 15 && s < 55 && l < 85;
    if (!looksLikeSkin) return "sclera";
  }

  // High-saturation jaundice band: a photographed moderate/severe jaundiced
  // sclera can be far MORE saturated than the <60% band above assumes (verified
  // against a real reference photo: actual sclera pixels measured ~90-100%
  // saturation and were falling through to "iris" below instead, causing
  // segmentation to grab an unrelated near-white region elsewhere in the frame).
  // Restricted to the clinical yellow hue band so this doesn't start matching
  // skin (skin's saturated tones sit in the more orange/red 5-40deg band above).
  if (l > 40 && h >= 40 && h <= 70) return "sclera";

  // Iris: moderate-high saturation, varies widely in hue (brown/blue/green/grey eyes)
  if (s > 25 && l >= 15 && l <= 70) return "iris";

  return "unknown";
}

/**
 * Find the largest connected component of a given label in a label grid.
 * Simple flood-fill based connected-component labeling — fine at the resolution
 * we operate on (downsampled capture region, not full photo resolution).
 */
function largestConnectedRegion(labelGrid, targetLabel, width, height) {
  const visited = new Uint8Array(width * height);
  let best = { pixels: [], size: 0 };

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = y * width + x;
      if (visited[idx] || labelGrid[idx] !== targetLabel) continue;

      // BFS flood fill
      const stack = [idx];
      const region = [];
      visited[idx] = 1;

      while (stack.length) {
        const cur = stack.pop();
        region.push(cur);
        const cx = cur % width, cy = Math.floor(cur / width);

        const neighbors = [
          [cx - 1, cy], [cx + 1, cy], [cx, cy - 1], [cx, cy + 1],
        ];
        for (const [nx, ny] of neighbors) {
          if (nx < 0 || nx >= width || ny < 0 || ny >= height) continue;
          const nIdx = ny * width + nx;
          if (visited[nIdx] || labelGrid[nIdx] !== targetLabel) continue;
          visited[nIdx] = 1;
          stack.push(nIdx);
        }
      }

      if (region.length > best.size) {
        best = { pixels: region, size: region.length };
      }
    }
  }

  return best;
}

/**
 * Segment the sclera region from image data within the user-guided capture frame.
 * @param {ImageData} imageData - from canvas.getContext('2d').getImageData(...)
 * @returns {{
 *   success: boolean,
 *   scleraPixelCount: number,
 *   coveragePct: number,
 *   scleraHsl: {h:number, s:number, l:number} | null,   // mean color of sclera region
 *   referenceHsl: {h:number, s:number, l:number} | null, // mean color of brightest sclera sub-region
 *   reason?: string
 * }}
 */
export function segmentSclera(imageData) {
  const { data, width, height } = imageData;
  const pixelCount = width * height;

  const labelGrid = new Array(pixelCount);
  const hslGrid = new Array(pixelCount);

  for (let i = 0; i < pixelCount; i++) {
    const offset = i * 4;
    const r = data[offset], g = data[offset + 1], b = data[offset + 2];
    const hsl = rgbToHsl(r, g, b);
    hslGrid[i] = hsl;
    labelGrid[i] = classifyPixel(hsl);
  }

  const scleraRegion = largestConnectedRegion(labelGrid, "sclera", width, height);

  const MIN_SCLERA_PIXELS = Math.max(50, pixelCount * 0.02); // require at least 2% of frame
  if (scleraRegion.size < MIN_SCLERA_PIXELS) {
    return {
      success: false,
      scleraPixelCount: scleraRegion.size,
      coveragePct: Number((scleraRegion.size / pixelCount * 100).toFixed(2)),
      scleraHsl: null,
      referenceHsl: null,
      reason: "insufficient_sclera_detected",
    };
  }

  // Mean color of the full sclera region — this is the "sclera" reading
  let sumH = 0, sumS = 0, sumL = 0;
  // Sort by lightness to find brightest sub-region for the reference patch
  const lightnessValues = [];

  for (const idx of scleraRegion.pixels) {
    const { h, s, l } = hslGrid[idx];
    sumH += h; sumS += s; sumL += l;
    lightnessValues.push({ idx, l });
  }

  const n = scleraRegion.pixels.length;
  const scleraHsl = { h: sumH / n, s: sumS / n, l: sumL / n };

  // Reference patch: brightest 15% of sclera pixels (most likely to be the
  // "purest" white reflection point, least affected by vasculature/shadow)
  lightnessValues.sort((a, b) => b.l - a.l);
  const refCount = Math.max(5, Math.floor(n * 0.15));
  const refPixels = lightnessValues.slice(0, refCount);

  let refH = 0, refS = 0, refL = 0;
  for (const { idx } of refPixels) {
    const { h, s, l } = hslGrid[idx];
    refH += h; refS += s; refL += l;
  }
  const referenceHsl = {
    h: refH / refPixels.length,
    s: refS / refPixels.length,
    l: refL / refPixels.length,
  };

  return {
    success: true,
    scleraPixelCount: n,
    coveragePct: Number((n / pixelCount * 100).toFixed(2)),
    scleraHsl: {
      h: Number(scleraHsl.h.toFixed(2)),
      s: Number(scleraHsl.s.toFixed(2)),
      l: Number(scleraHsl.l.toFixed(2)),
    },
    referenceHsl: {
      h: Number(referenceHsl.h.toFixed(2)),
      s: Number(referenceHsl.s.toFixed(2)),
      l: Number(referenceHsl.l.toFixed(2)),
    },
  };
}

export { rgbToHsl, classifyPixel };