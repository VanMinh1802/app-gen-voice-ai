# Feature Specification - IndexedDB History

## Metadata

| Field              | Value                |
| ------------------ | -------------------- |
| **Feature ID**     | REQ-010              |
| **Feature Name**   | History in IndexedDB |
| **Status**         | ✅ Completed         |
| **Priority**       | P1 (High)            |
| **Owner**          | Development Team     |
| **Created**        | 2026-03-10           |
| **Last Updated**   | 2026-03-20           |
| **Target Release** | v1.2.0               |

---

## Overview

### Problem Statement

localStorage has size limits - need IndexedDB for larger history with audio blobs. Additionally, with multi-user support, history must be isolated per user.

### Goals

- Store history in IndexedDB
- Support audio blobs
- Cap at 50 items
- Migration from localStorage
- **Multi-user isolation with `userId` field**
- **Storage usage tracking**
- **Efficient IndexedDB migration**

---

## User Stories

### Story 1: History in IndexedDB

**As a** user **I want** my generation history stored in IndexedDB **So that** audio blobs and larger history are supported without localStorage limits.

**Acceptance Criteria:**

- [x] History (metadata + audio blob URLs or blobs) stored in IndexedDB; DB name e.g. `tts-app`, object store `history`
- [x] Cap history at configurable N items (e.g. 50); evict oldest on overflow
- [x] Existing HistoryPanel reads from IndexedDB; replay/refill/delete unchanged
- [x] Migration path: on first load after upgrade, migrate existing localStorage history to IndexedDB if present, then clear localStorage history key

**Priority:** P1 (High)

---

### Story 2: Multi-User History Isolation

**As a** developer **I want** IndexedDB to support userId field **So that** history can be isolated per user.

**Acceptance Criteria:**

- [x] `userId` field added to `StoredHistoryRecord`
- [x] Index on `userId` for efficient filtering
- [x] Migration v5→v6 adds `userId` index correctly
- [x] Backward compatible with legacy records (without userId)

**Priority:** P1 (High)

---

### Story 3: Storage Usage Tracking

**As a** system **I want** to track storage usage **So that** users can see how much space their history consumes.

**Acceptance Criteria:**

- [x] Calculate total bytes used by history (audio + text + metadata)
- [x] Count number of records
- [x] Use `navigator.storage.estimate()` for browser quota info
- [x] Support per-user storage calculation

**Priority:** P2 (Medium)

---

## Technical Design

### Files Created/Modified

| File                         | Description                          | Status    |
| ---------------------------- | ------------------------------------ | --------- |
| `src/lib/storage/history.ts` | IndexedDB operations with userId      | Modified  |

### Database Schema

```typescript
interface StoredHistoryRecord {
  id: string;
  text: string;
  voice: string;
  model: string;
  speed: number;
  duration: number;
  createdAt: number;
  audio: Blob; // Not blob URL - Blob is persisted
  userId?: string; // Optional for legacy compatibility
}
```

### Database Version History

| Version | Date       | Change                                           |
| ------- | ---------- | ------------------------------------------------ |
| 1      | 2026-03-10 | Initial schema with `createdAt` index            |
| 2-5    | (earlier)  | Various migrations                               |
| 6      | 2026-03-20 | Added `userId` field and index                   |

### IndexedDB Migration v5→v6

**Issue Fixed**: Original migration code used `database.transaction()` during `onupgradeneeded`, causing `InvalidStateError`.

**Solution**: Use the upgrade transaction available via `event.target.transaction` instead of creating a new transaction.

```typescript
request.onupgradeneeded = (event) => {
  const database = (event.target as IDBOpenDBRequest).result;
  /** Upgrade transaction — MUST NOT call database.transaction() during onupgradeneeded */
  const upgradeTx = (event.target as IDBOpenDBRequest).transaction;

  if (!database.objectStoreNames.contains(STORE_NAME)) {
    const objectStore = database.createObjectStore(STORE_NAME, {
      keyPath: "id",
    });
    objectStore.createIndex("createdAt", "createdAt", { unique: false });
    objectStore.createIndex("userId", "userId", { unique: false });
  } else {
    // Migration: add userId index if it doesn't exist (use upgrade transaction only)
    if (upgradeTx) {
      const objectStore = upgradeTx.objectStore(STORE_NAME);
      if (!objectStore.indexNames.contains("userId")) {
        objectStore.createIndex("userId", "userId", { unique: false });
      }
    }
  }
};
```

### Key Functions

```typescript
// Save with userId
export async function saveHistoryItem(
  item: TtsHistoryItem,
  audioBlob: Blob,
  userId: string,
): Promise<void>;

// Load with optional userId filter
export async function getHistory(
  limit?: number,
  userId?: string,
): Promise<TtsHistoryItem[]>;

// Get storage usage for specific user
export async function getStorageUsage(
  userId: string | null,
): Promise<{ totalBytes: number; itemCount: number }>;

// Clear history for specific user
export async function clearUserHistory(userId: string): Promise<void>;

// Get browser storage quota
export async function getStorageQuota(): Promise<{
  used: number;
  available: number;
  usagePercent: number;
} | null>;
```

### Storage Calculation

```typescript
// Per-record size estimation
const recordBytes =
  record.audio.size +           // Audio blob size
  record.text.length * 2 +      // UTF-16 text (2 bytes per char)
  200;                          // Metadata overhead (voice, model, etc.)
```

---

## Edge Cases

| #   | Case                                      | Handling                                      |
| --- | ----------------------------------------- | -------------------------------------------- |
| 1   | Legacy records without userId              | Count as "anonymous" when userId is null     |
| 2   | IndexedDB not available                    | Graceful fallback, in-memory only            |
| 3   | Migration fails                            | Log error, continue without migration         |
| 4   | Browser quota exceeded                     | Warn user, oldest records evicted on save    |
| 5   | User switches accounts                     | History reloads with new userId filter       |

---

## Security Considerations

- **Data Isolation**: Each user can only access their own history via userId filter
- **No PII Storage**: Only audio and text are stored, no user credentials
- **Blob URLs**: Not persisted (only in memory), recreated on load

---

## Definition of Done

- [x] Code implemented
- [x] Migration works (v5→v6)
- [x] Audio blobs stored correctly
- [x] User isolation functional
- [x] Storage tracking accurate
- [x] No lint errors
- [x] Build passes

---

## Changelog

### 2026-03-20

- Added `userId` field for multi-user isolation
- Added `userId` index for efficient filtering
- Fixed IndexedDB migration (InvalidStateError fix)
- Added storage usage tracking functions
- Added `clearUserHistory` for per-user clearing

### 2026-03-10

- Initial implementation with localStorage migration
- Basic IndexedDB storage for history
