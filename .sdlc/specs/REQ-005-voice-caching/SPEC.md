# Feature Specification - Voice Model Caching

## 📋 Metadata

| Field              | Value                                                  |
| ------------------ | ------------------------------------------------------ |
| **Feature ID**     | REQ-005                                               |
| **Feature Name**   | Voice Model Caching + Version Check                    |
| **Status**         | ✅ Completed                                          |
| **Priority**       | P1 (High)                                             |
| **Owner**          | Development Team                                      |
| **Created**        | 2026-03-10                                           |
| **Last Updated**   | 2026-03-14                                           |
| **Target Release** | v1.0.0                                               |

---

## 🔀 Mermaid Data Flow

```mermaid
flowchart TD
    subgraph Browser["👤 Browser"]
        User["User"]
        Worker["tts-worker.ts"]
    end

    subgraph Storage["🟢 Storage"]
        IDB["IndexedDB\n(model-cache)"]
        VerFile["versions.json"]
    end

    subgraph CDN["🔵 CDN"]
        CDN["public/tts-model/"]
    end

    User -->|1. Select voice| Worker
    Worker -->|2. Fetch versions.json| VerFile
    VerFile -->|3. Version info| Worker
    Worker -->|4. Check cache| IDB
    IDB -->|4a. Cache hit + version match| Worker
    IDB -->|4b. Cache miss / version mismatch| Worker
    Worker -->|5. Download model| CDN
    CDN -->|6. Model data| Worker
    Worker -->|7. Cache model + version| IDB
```

---

## 🎯 Overview

### Problem Statement

Users need voice models cached locally for faster subsequent use. Additionally, when models are updated on the server, users should automatically get the latest version.

### Goals

- Download voice models on first use
- Cache in IndexedDB for reuse
- Show download progress
- Manage cached voices
- **Auto-update**: Detect when server has newer model version and re-download

---

## 👥 User Stories

### Story 1: Voice Model Caching

**As a** user **I want** downloaded voice models cached locally **So that** subsequent uses are faster

**Acceptance Criteria:**

- [x] First use triggers voice model download from CDN
- [x] Download progress shown to user
- [x] Cached voices load without network on return visits
- [x] Settings panel shows list of cached voices with sizes
- [x] User can delete individual cached voices

**Priority:** P1 (High)

### Story 2: Version-Based Cache Invalidation (NEW)

**As a** developer **I want** cached models to auto-update when the server has a newer version **So that** users always get the latest model quality

**Acceptance Criteria:**

- [x] Server provides `versions.json` file with version info for each voice
- [x] Client fetches `versions.json` on each model load
- [x] Client compares cloud version with cached version (semantic versioning)
- [x] If cloud version > cached version, old cache is deleted and model is re-downloaded
- [x] Version is stored alongside model in IndexedDB

**Priority:** P1 (High)

---

## 🏗️ Technical Design

### Files Created/Modified

| File | Description |
| ---- | ----------- |
| `src/lib/piper/piperCustom.ts` | Custom model loader with caching |
| `src/features/tts/components/VoiceSettings.tsx` | Settings panel |
| `src/lib/storage/modelCache.ts` | **Modified**: Added version field to CachedModel |
| `src/lib/piper/piperR2.ts` | **Modified**: Added version checking logic |
| `public/tts-model/vi/versions.json` | **NEW**: Version manifest file |

### Version Checking Flow

```
1. User selects voice → loadPiperWithCache(voiceId)
2. Fetch /tts-model/vi/versions.json
3. Check IndexedDB for cached model + version
4. If cached:
   - Compare cloudVersion vs cachedVersion
   - If cloudVersion > cachedVersion: delete cache, download new
   - Else: use cached model
5. If not cached: download from R2
6. Save to IndexedDB with version
```

### versions.json Format

```json
{
  "ngochuyen": "1.0.0",
  "banmai": "1.0.1",
  "manhdung": "1.0.0"
}
```

### Updating Models

To update a voice model on the server:
1. Upload new `.onnx` and `.onnx.json` files to R2
2. Update `versions.json` with new version (e.g., `"banmai": "1.0.2"`)
3. On next user visit, cache will be automatically invalidated and re-downloaded

---

## ✅ Definition of Done

- [x] Code implemented
- [x] Tests pass
- [x] No lint errors
- [x] Version checking implemented
