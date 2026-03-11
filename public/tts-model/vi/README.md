# Custom TTS Models (Vietnamese)

Place your pre-trained Piper TTS model files here. Each model needs **two files** with the same base name:

- `{model-name}.onnx` — ONNX model (binary)
- `{model-name}.onnx.json` — Model config (phoneme_id_map, sample_rate, etc.)

## Example

To use the **ngochuyen** voice:

1. Download from Google Drive (or your source):
   - `ngochuyen.onnx`
   - `ngochuyen.onnx.json`
2. Put both files in this folder: `public/tts-model/vi/`
3. The app will list "Ngọc Huyền (custom)" in the Voice/Model dropdown (when the id is listed in `src/config.ts` → `customModels`).

## Supported models

Models must use **phoneme_type: "text"** (character-based). Models that require espeak phonemizer are not supported in the custom loader.

## Adding a new model

1. Add the `.onnx` and `.onnx.json` files to this folder.
2. In `src/config.ts`, add an entry to `customModels`:
   ```ts
   { id: "your-model-name", name: "Your Display Name (custom)" },
   ```
   Use the filename (without extension) as `id`.
