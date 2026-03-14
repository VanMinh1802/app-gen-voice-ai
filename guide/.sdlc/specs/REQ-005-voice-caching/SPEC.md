# Feature Specification - Voice Model Caching

## 📋 Metadata

| Field              | Value                                                  |
| ------------------ | ------------------------------------------------------ |
| **Feature ID**     | REQ-005                                               |
| **Feature Name**   | Voice Model Caching                                    |
| **Status**         | ✅ Completed                                          |
| **Priority**       | P1 (High)                                             |
| **Owner**          | Development Team                                      |
| **Created**        | 2026-03-10                                           |
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
    end

    subgraph CDN["🔵 CDN"]
        CDN["public/tts-model/"]
    end

    User -->|1. Select voice| Worker
    Worker -->|2. Check cache| IDB
    IDB -->|3. Cache hit| Worker
    IDB -.->|4. Cache miss| Worker
    Worker -->|5. Download model| CDN
    CDN -->|6. Model data| Worker
    Worker -->|7. Cache model| IDB
```

---

## 🎯 Overview

### Problem Statement

Users need voice models cached locally for faster subsequent use.

### Goals

- Download voice models on first use
- Cache in IndexedDB for reuse
- Show download progress
- Manage cached voices

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

---

## 🏗️ Technical Design

### Files Created

| File | Description |
| ---- | ----------- |
| `src/lib/piper/piperCustom.ts` | Custom model loader with caching |
| `src/features/tts/components/VoiceSettings.tsx` | Settings panel |

---

## ✅ Definition of Done

- [x] Code implemented
- [x] Tests pass
- [x] No lint errors
