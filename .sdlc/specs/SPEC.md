# TTS App - Feature Specifications

> This document serves as an index to all feature specifications in the VietVoice AI project.

---

## 📋 Project Overview

| Field            | Value                                                        |
| ---------------- | ------------------------------------------------------------ |
| **Project Name** | VietVoice AI - Text to Speech                                |
| **Type**         | Browser-based TTS Web Application                            |
| **Tech Stack**   | Next.js 16, React, Tailwind CSS, ONNX Runtime Web, Piper TTS |
| **Deployment**   | Cloudflare Pages + R2                                        |

---

## 📁 Feature Specifications

| ID      | Feature                     | Status         | Priority | Release |
| ------- | --------------------------- | -------------- | -------- | ------- |
| REQ-002 | TTS Generation              | ✅ Completed   | P0       | v1.0.0  |
| REQ-003 | Playback Controls           | ✅ Completed   | P0       | v1.0.0  |
| REQ-004 | Generation History          | ✅ Completed   | P1       | v1.0.0  |
| REQ-005 | Voice Model Caching         | ✅ Completed   | P1       | v1.0.0  |
| REQ-006 | Settings Persistence        | ✅ Completed   | P1       | v1.0.0  |
| REQ-007 | Multi-Language              | ✅ Completed   | P1       | v1.1.0  |
| REQ-008 | Vietnamese Text Processing  | ✅ Completed   | P1       | v1.1.0  |
| REQ-009 | Dark Mode                   | ✅ Completed   | P1       | v1.1.0  |
| REQ-010 | IndexedDB History           | ✅ Completed   | P1       | v1.1.0  |
| REQ-011 | Share Button                | ✅ Completed   | P2       | v1.1.0  |
| REQ-012 | Cloudflare R2 Model Storage | ⏳ Pending     | P0       | v1.2.0  |
| REQ-013 | Plan & License Management   | 🔄 In Progress | P0       | v1.2.0  |

---

## 🔗 Feature Specification Links

### Core Features (v1.0)

| Feature              | Spec File                                                                    |
| -------------------- | ---------------------------------------------------------------------------- |
| TTS Generation       | [REQ-002-tts-generation/SPEC.md](REQ-002-tts-generation/SPEC.md)             |
| Playback Controls    | [REQ-003-playback-controls/SPEC.md](REQ-003-playback-controls/SPEC.md)       |
| Generation History   | [REQ-004-generation-history/SPEC.md](REQ-004-generation-history/SPEC.md)     |
| Voice Model Caching  | [REQ-005-voice-caching/SPEC.md](REQ-005-voice-caching/SPEC.md)               |
| Settings Persistence | [REQ-006-settings-persistence/SPEC.md](REQ-006-settings-persistence/SPEC.md) |

### Extended Features (v1.1)

| Feature                    | Spec File                                                              |
| -------------------------- | ---------------------------------------------------------------------- |
| Multi-Language             | [REQ-007-multi-language/SPEC.md](REQ-007-multi-language/SPEC.md)       |
| Vietnamese Text Processing | [REQ-008-vietnamese-text/SPEC.md](REQ-008-vietnamese-text/SPEC.md)     |
| Dark Mode                  | [REQ-009-dark-mode/SPEC.md](REQ-009-dark-mode/SPEC.md)                 |
| IndexedDB History          | [REQ-010-indexeddb-history/SPEC.md](REQ-010-indexeddb-history/SPEC.md) |
| Share Button               | [REQ-011-share-button/SPEC.md](REQ-011-share-button/SPEC.md)           |

### Future Features (v1.2)

| Feature                     | Spec File                                                                      |
| --------------------------- | ------------------------------------------------------------------------------ |
| Cloudflare R2 Model Storage | [REQ-012-cloudflare-r2/SPEC.md](REQ-012-cloudflare-r2/SPEC.md)                 |
| Plan & License Management   | [REQ-013-plan-license-genation/SPEC.md](REQ-013-plan-license-genation/SPEC.md) |

---

## 📊 Release Timeline

### v1.0.0 (Current)

- TTS Generation
- Playback Controls
- Generation History
- Voice Model Caching
- Settings Persistence

### v1.1.0 (Current)

- Multi-Language
- Vietnamese Text Processing
- Dark Mode
- IndexedDB History
- Share Button

### v1.2.0 (Planned)

- Cloudflare R2 Model Storage
- Lazy Model Loading
- Pre-rendered Voice Samples
- IndexedDB Model Cache
- Plan & License Management (Genation SDK)

---

## 🗂️ Related Documents

| Document         | Location                                                        |
| ---------------- | --------------------------------------------------------------- |
| Architecture     | [.sdlc/context/architecture.md](../context/architecture.md)     |
| Conventions      | [.sdlc/context/conventions.md](../context/conventions.md)       |
| Security         | [.sdlc/context/security.md](../context/security.md)             |
| Feature Template | [.sdlc/templates/feature-spec.md](../templates/feature-spec.md) |
| PR Template      | [.sdlc/templates/pull-request.md](../templates/pull-request.md) |

---

## 🔄 Adding New Features

To add a new feature:

1. Create a new folder: `.sdlc/specs/REQ-XXX-{feature-name}/`
2. Copy the template: `.sdlc/templates/feature-spec.md`
3. Fill in the specification
4. Add an entry to this index

Example:

```
.sdlc/specs/
├── REQ-002-tts-generation/
│   └── SPEC.md
├── REQ-003-playback-controls/
│   └── SPEC.md
└── REQ-012-cloudflare-r2/
    └── SPEC.md
```
