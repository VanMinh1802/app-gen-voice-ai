# Feature Specification - Cloudflare R2 Model Storage

## 📋 Metadata

| Field              | Value                                                  |
| ------------------ | ------------------------------------------------------ |
| **Feature ID**     | REQ-012                                               |
| **Feature Name**   | Cloudflare R2 Lazy Model Loading                      |
| **Status**         | ✅ Implemented (Phase 1-2)                            |
| **Priority**       | P0 (Critical)                                         |
| **Owner**          | Development Team                                      |
| **Created**        | 2026-03-11                                           |
| **Target Release** | v1.2.0                                               |
| **MVP Constraints**| No auth required; TTS only; Ship fast               |

---

## 🔀 Mermaid Data Flow

```mermaid
flowchart TD
    subgraph Browser["👤 Browser"]
        User["User"]
        VoiceCard["VoiceCard.tsx"]
        Worker["tts-worker.ts"]
    end

    subgraph LocalCache["🟢 Local Cache"]
        IDB_Models["IndexedDB\n(tts-model-cache)"]
    end

    subgraph Cloudflare["🔵 Cloudflare"]
        CF_API["Pages Functions\n/api/models"]
        R2["R2 Bucket\n(genvoice-models)"]
    end

    User -->|1. Preview voice| VoiceCard
    VoiceCard -->|2. Fetch sample.wav| CF_API
    CF_API -->|3. Get from R2| R2
    R2 -->|4. Stream audio| VoiceCard
    VoiceCard -->|5. Play instant| User

    VoiceCard -->|6. Select voice| Worker
    Worker -->|7. Check IDB cache| IDB_Models
    IDB_Models -->|8. Cache hit| Worker
    IDB_Models -.->|9. Cache miss| Worker
    Worker -->|10. Download model| CF_API
    CF_API -->|11. Get from R2| R2
    R2 -->|12. Model data| Worker
    Worker -->|13. Cache model| IDB_Models
```

---

## 🎯 Overview

### Problem Statement

Models are currently bundled with the app, increasing bundle size. Need to store models in R2 and lazy-load on demand.

### Goals

- Move models to Cloudflare R2
- Lazy-load models only when needed
- Cache downloaded models in IndexedDB
- Pre-render voice samples for instant preview
- Reduce bundle size

### Non-Goals (MVP)

- Real-time streaming
- Server-side TTS
- Authentication (deferred to future)
- Model version management
- Analytics/usage tracking
- Multi-language support (Vietnamese only for MVP)

---

## 👥 User Stories

### Story 1: Cloudflare R2 Lazy Model Loading

**As a** user **I want** to preview voices instantly and only download models on-demand **So that** I don't have to wait for all models to load and the app stays fast.

**Acceptance Criteria:**

- [x] Voice preview button plays pre-rendered sample from R2 (instant; uses `sample.wav` per voice)
- [x] When generating, model is downloaded from R2 if not cached locally
- [x] Downloaded models are cached in IndexedDB for offline reuse
- [x] Progress shown during model download
- [x] After first download, subsequent generations use cached model
- [x] Models stored in Cloudflare R2 bucket, not in app bundle
- [x] Pre-rendered samples (`sample.wav`) stored in R2 for each voice

**Priority:** P0 (Must Have)

---

## 🏗️ Technical Design

### R2 Bucket Structure

```
genvoice-models/       # R2 Bucket Name (user-created)
├── vi/                    # Language folder
│   ├── ngochuyen/         # Voice ID
│   │   ├── ngochuyen.onnx    (~50MB; or model.onnx for legacy)
│   │   ├── ngochuyen.onnx.json
│   │   └── sample.wav       (5-10s pre-rendered, shared text)
│   ├── lacphi/
│   │   ├── lacphi.onnx
│   │   ├── lacphi.onnx.json
│   │   └── sample.wav
│   └── ... (other voices)
```

### Voice Preview Sample

| Aspect | Decision |
|--------|----------|
| Text content | Shared across all voices: "Xin chào, đây là giọng nói AI. Chúc bạn một ngày tốt lành!" |
| Duration | 5-10 seconds |
| Format | WAV (uncompressed for quality) |
| Storage | Stored in R2 as `sample.wav` per voice folder |

### Files Created

| File | Description | Status |
| ---- | ----------- | ------ |
| `src/app/api/models/[voiceId]/[file]/route.ts` | API route for R2 proxy | ✅ Created |
| `src/lib/storage/modelCache.ts` | IndexedDB model cache | ✅ Created |
| `src/lib/piper/piperR2.ts` | R2-aware Piper loader | ✅ Created |

### Cloudflare Pages Configuration

```toml
# wrangler.toml
name = "vietvoice-ai"
compatibility_date = "2024-01-01"
pages_build_output_dir = ".next"

[[r2_buckets]]
binding = "VIETVOICE_MODELS"
bucket_name = "genvoice-models"
```

### Environment Variables

| Variable | Description | Required |
| -------- | ----------- | -------- |
| `R2_PUBLIC_URL` | R2 bucket public URL (server-side; e.g. API route fallback in dev) | Local dev |
| `NEXT_PUBLIC_R2_PUBLIC_URL` | Same URL exposed to client (preview sample, worker) | Optional |

**Local development:** Create `.env.local` in project root with `R2_PUBLIC_URL=<Public URL của R2 bucket>` so the API route can proxy model/sample requests. Use UTF-8 encoding for `.env.local`.

### API Route

```typescript
// src/app/api/models/[voiceId]/[file]/route.ts
// NOTE: Public access (no auth) for MVP - R2 bucket is public readable
// Rate limiting will be handled by Cloudflare

export async function GET(
  request: Request,
  { params }: { params: Promise<{ voiceId: string; file: string }> }
) {
  const { voiceId, file } = await params;
  
  // Validate voiceId to prevent path traversal
  const allowedVoiceIds = ['ngochuyen', 'lacphi', /* ... other voices */];
  if (!allowedVoiceIds.includes(voiceId)) {
    return new Response('Not Found', { status: 404 });
  }

  const bucket = process.env.VIETVOICE_MODELS as unknown as R2Bucket;
  const object = await bucket.get(`vi/${voiceId}/${file}`);
  
  if (!object) {
    return new Response('Not Found', { status: 404 });
  }

  // Return with appropriate headers for caching
  return new Response(object.body, {
    headers: {
      'Content-Type': getContentType(file),
      'Cache-Control': 'public, max-age=31536000, immutable', // Cache for 1 year
    },
  });
}

function getContentType(file: string): string {
  if (file.endsWith('.onnx')) return 'application/octet-stream';
  if (file.endsWith('.json')) return 'application/json';
  if (file.endsWith('.wav')) return 'audio/wav';
  return 'application/octet-stream';
}
```

### Model Cache API

```typescript
// src/lib/storage/modelCache.ts
interface ModelCacheEntry {
  voiceId: string;
  data: ArrayBuffer;
  downloadedAt: number;
  size: number;
}

export async function saveModelToCache(voiceId: string, data: ArrayBuffer): Promise<void>;
export async function loadModelFromCache(voiceId: string): Promise<ArrayBuffer | null>;
export async function getCachedModels(): Promise<string[]>;
export async function clearModelCache(): Promise<void>;
```

### Implementation Notes

- **Voice preview:** `getVoiceSampleUrl(voiceId)` in `piperR2.ts` returns R2 sample URL or `/api/models/{voiceId}/sample.wav`. `useTtsGenerate.previewVoice()` fetches that URL first; on success plays the WAV, otherwise falls back to TTS generation.
- **API route (dev):** When R2 binding is not present, the route reads `R2_PUBLIC_URL` from `process.env` or by parsing `.env.local` (supports UTF-16-saved files). Debug info in 503 response only in `NODE_ENV=development`.
- **Phonemizer WASM:** Piper phonemizer `.wasm`/`.data` are loaded from CDN in `piperR2.ts` (`locateFile`) to avoid 404 on relative paths.

---

## 📦 Dependencies

### External

| Library | Version | Purpose |
| -------- | ------- | --------|
| @cloudflare/workers-types | ^4.0 | R2 types |
| wrangler | ^3.0 | Deployment |

---

## ⏱️ Implementation Plan

> **Note**: Cloudflare setup (Phase 0) is done by the user. Em provides code support only.

### Cloudflare Setup (User does - NOT included in estimate)

1. Create free Cloudflare account
2. Create R2 bucket named `vietvoice-models`
3. Install wrangler: `npm install -D wrangler`
4. Configure `wrangler.toml`
5. Upload models to R2 using wrangler
6. Configure CORS for public access

---

| Phase | Tasks | Estimated |
| ---- | ----- | --------- |
| Phase 0 | Cloudflare Setup (User does) | ~30-45 min |
| Phase 1 | Create API routes, model cache | 3 hours |
| Phase 2 | Update piper loader, VoiceCard preview | 2 hours |
| Phase 3 | Deploy to Cloudflare Pages | 1 hour |

---

## ✅ Definition of Done

- [x] R2 bucket configured with voice models (`{voiceId}.onnx` + `{voiceId}.onnx.json`)
- [x] Pre-rendered samples (`sample.wav`) available per voice in R2
- [x] API route `/api/models/[voiceId]/[file]` proxies to R2 (or direct URL in dev)
- [x] IndexedDB cache for downloaded models
- [x] Voice preview uses `sample.wav` from R2 when available; fallback to TTS generate
- [x] Build passes
