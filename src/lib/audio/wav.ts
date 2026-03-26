/**
 * WAV audio encoding/decoding utilities.
 * Used by both main thread and Web Worker.
 */

export interface WavDecodeResult {
  float32: Float32Array;
  sampleRate: number;
}

/**
 * Decode a WAV ArrayBuffer (16-bit PCM mono/stereo) to Float32Array.
 * Only reads the first "data" chunk — ignores other chunks.
 * Supports both mono and stereo (stereo is averaged to mono).
 *
 * @throws Error if WAV header is invalid (missing RIFF or data chunk)
 */
export function decodeWav(wavBuffer: ArrayBuffer): WavDecodeResult {
  const view = new DataView(wavBuffer);
  const riff = String.fromCharCode(
    view.getUint8(0),
    view.getUint8(1),
    view.getUint8(2),
    view.getUint8(3),
  );

  if (riff !== "RIFF") {
    throw new Error("Invalid WAV file: missing RIFF header");
  }

  let offset = 12;
  let dataOffset = 0;
  let dataSize = 0;
  let sampleRate = 24000;
  let numChannels = 1;

  while (offset < wavBuffer.byteLength - 8) {
    const chunkId = String.fromCharCode(
      view.getUint8(offset),
      view.getUint8(offset + 1),
      view.getUint8(offset + 2),
      view.getUint8(offset + 3),
    );
    const chunkSize = view.getUint32(offset + 4, true);

    if (chunkId === "fmt ") {
      numChannels = view.getUint16(offset + 10, true);
      sampleRate = view.getUint32(offset + 12, true);
    } else if (chunkId === "data") {
      dataOffset = offset + 8;
      dataSize = chunkSize;
      break;
    }

    offset += 8 + chunkSize;
    if (chunkSize % 2 !== 0) offset++;
  }

  if (dataOffset === 0) {
    throw new Error("Invalid WAV file: no data chunk found");
  }

  // Decode interleaved PCM to Float32.
  // For 16-bit PCM, each sample is 2 bytes. Interleaved format:
  // [sample0_ch0, sample0_ch1, ..., sampleN_ch0, sampleN_ch1]
  // Byte offset for frame i, channel ch: (i * numChannels + ch) * bytesPerSample
  const bytesPerSample = 2;
  const totalSamples = Math.floor(dataSize / bytesPerSample); // = numFrames * numChannels
  const numFrames = Math.floor(totalSamples / numChannels);
  const dataView = new DataView(wavBuffer, dataOffset, dataSize);

  if (numChannels > 1) {
    // Average all channels per frame to produce mono output
    const float32Array = new Float32Array(numFrames);
    for (let frame = 0; frame < numFrames; frame++) {
      let sum = 0;
      for (let ch = 0; ch < numChannels; ch++) {
        const byteOffset = (frame * numChannels + ch) * bytesPerSample;
        sum += dataView.getInt16(byteOffset, true) / 32768;
      }
      float32Array[frame] = sum / numChannels;
    }
    return { float32: float32Array, sampleRate };
  }

  // Mono: one channel per frame, read directly
  const float32Array = new Float32Array(numFrames);
  for (let i = 0; i < numFrames; i++) {
    float32Array[i] = dataView.getInt16(i * 2, true) / 32768;
  }
  return { float32: float32Array, sampleRate };
}

/**
 * Encode a Float32Array (mono, normalized -1 to 1) to a WAV ArrayBuffer (16-bit PCM).
 *
 * @param float32Array - Audio samples in range [-1, 1]
 * @param sampleRate   - Sample rate in Hz (e.g. 24000)
 */
export function encodeWav(
  float32Array: Float32Array,
  sampleRate: number,
): ArrayBuffer {
  const numChannels = 1;
  const bitsPerSample = 16;
  const bytesPerSample = bitsPerSample / 8;
  const blockAlign = numChannels * bytesPerSample;
  const byteRate = sampleRate * blockAlign;
  const dataSize = float32Array.length * bytesPerSample;
  const bufferSize = 44 + dataSize;

  const buffer = new ArrayBuffer(bufferSize);
  const view = new DataView(buffer);

  const writeString = (off: number, str: string) => {
    for (let i = 0; i < str.length; i++) {
      view.setUint8(off + i, str.charCodeAt(i));
    }
  };

  writeString(0, "RIFF");
  view.setUint32(4, bufferSize - 8, true);
  writeString(8, "WAVE");
  writeString(12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, byteRate, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, bitsPerSample, true);
  writeString(36, "data");
  view.setUint32(40, dataSize, true);

  const int16Array = new Int16Array(float32Array.length);
  for (let i = 0; i < float32Array.length; i++) {
    const sample = Math.max(-1, Math.min(1, float32Array[i]!));
    // Symmetric mapping: -1.0 → -32768, 1.0 → 32767
    int16Array[i] = sample < 0
      ? Math.round(sample * 32768)
      : Math.round(sample * 32767);
  }

  const dataView = new DataView(buffer, 44);
  for (let i = 0; i < int16Array.length; i++) {
    dataView.setInt16(i * 2, int16Array[i]!, true);
  }

  return buffer;
}

/**
 * Concatenate multiple Float32Arrays into one.
 * Reuses the same implementation as the worker to keep behaviour identical.
 */
export function concatFloat32Arrays(arrays: Float32Array[]): Float32Array {
  const totalLength = arrays.reduce((acc, arr) => acc + arr.length, 0);
  const result = new Float32Array(totalLength);
  let offset = 0;
  for (const arr of arrays) {
    result.set(arr, offset);
    offset += arr.length;
  }
  return result;
}
