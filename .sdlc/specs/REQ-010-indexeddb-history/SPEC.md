# Feature Specification - IndexedDB History

## 📋 Metadata

| Field              | Value                                                  |
| ------------------ | ------------------------------------------------------ |
| **Feature ID**     | REQ-010                                               |
| **Feature Name**   | History in IndexedDB                                    |
| **Status**         | ✅ Completed                                          |
| **Priority**       | P1 (High)                                             |
| **Owner**          | Development Team                                      |
| **Created**        | 2026-03-10                                           |
| **Target Release** | v1.1.0                                               |

---

## 🎯 Overview

### Problem Statement

localStorage has size limits - need IndexedDB for larger history with audio blobs.

### Goals

- Store history in IndexedDB
- Support audio blobs
- Cap at 50 items
- Migration from localStorage

---

## 👥 User Stories

### Story 1: History in IndexedDB

**As a** user **I want** my generation history stored in IndexedDB **So that** audio blobs and larger history are supported without localStorage limits.

**Acceptance Criteria:**

- [x] History (metadata + audio blob URLs or blobs) stored in IndexedDB; DB name e.g. `tts-app`, object store `history`
- [x] Cap history at configurable N items (e.g. 50); evict oldest on overflow
- [x] Existing HistoryPanel reads from IndexedDB; replay/refill/delete unchanged
- [x] Migration path: on first load after upgrade, migrate existing localStorage history to IndexedDB if present, then clear localStorage history key

**Priority:** P1 (High)

---

## 🏗️ Technical Design

### Files Created

| File | Description |
| ---- | ----------- |
| `src/lib/storage/history.ts` | IndexedDB operations |

### Database Schema

```typescript
interface HistoryItem {
  id: string;
  text: string;
  voiceId: string;
  voiceName: string;
  audio: Blob;
  createdAt: number;
}
```

---

## ✅ Definition of Done

- [x] Code implemented
- [x] Migration works
- [x] Audio blobs stored
