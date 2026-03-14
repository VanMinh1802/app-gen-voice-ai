# Feature Specification - Generation History

## 📋 Metadata

| Field              | Value                                                  |
| ------------------ | ------------------------------------------------------ |
| **Feature ID**     | REQ-004                                               |
| **Feature Name**   | Generation History                                     |
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
        HistoryPanel["HistoryPanel.tsx"]
        Hook["useTtsGenerate.ts"]
    end

    subgraph Storage["🟢 Storage"]
        IDB["IndexedDB\n(tts-audio-db)"]
        LS["localStorage"]
    end

    Hook -->|1. Save audio| IDB
    IDB -->|2. Store blob| IDB
    User -->|3. View history| HistoryPanel
    HistoryPanel -->|4. Load history| IDB
    IDB -->|5. Return items| HistoryPanel
    HistoryPanel -->|6. Display| User
```

---

## 🎯 Overview

### Problem Statement

Users need to access previously generated audio for replay or reuse.

### Goals

- Show last 50 generations
- Display text preview, voice name, timestamp
- Replay functionality
- Refill text to textarea

---

## 👥 User Stories

### Story 1: Generation History

**As a** user **I want** to access previously generated audio **So that** I can replay or reuse them

**Acceptance Criteria:**

- [x] History panel shows last 50 generations
- [x] Each entry displays: text preview (truncated), voice name, timestamp
- [x] Click on history item replays that audio
- [x] "Refill" button loads history text back into textarea
- [x] History persists across browser sessions (IndexedDB)

**Priority:** P1 (High)

---

## 🏗️ Technical Design

### Files Created

| File | Description |
| ---- | ----------- |
| `src/features/tts/components/HistoryPanel.tsx` | History list component |
| `src/lib/storage/history.ts` | IndexedDB history operations |

### State Management

| State | Solution | Justification |
| ----- | -------- | ------------- |
| History items | React useState + IDB | Persistence + reactivity |

---

## ✅ Definition of Done

- [x] Code implemented
- [x] All tests pass
- [x] No lint errors
