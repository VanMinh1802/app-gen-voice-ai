# Feature Specification - Generation History

## Metadata

| Field              | Value              |
| ------------------ | ------------------ |
| **Feature ID**     | REQ-004            |
| **Feature Name**   | Generation History |
| **Status**         | ✅ Completed       |
| **Priority**       | P1 (High)          |
| **Owner**          | Development Team   |
| **Created**        | 2026-03-10         |
| **Last Updated**   | 2026-03-20         |
| **Target Release** | v1.2.0             |

---

## Mermaid Data Flow

```mermaid
flowchart TD
    subgraph Browser["Browser"]
        User["User"]
        HistoryPanel["HistoryPanel.tsx"]
        Hook["useTtsGenerate.ts"]
    end

    subgraph Storage["Storage"]
        IDB["IndexedDB\n(tts-audio-db)"]
        LS["localStorage"]
    end

    subgraph Auth["Authentication"]
        AuthSDK["Genation SDK"]
        UserId["user.sub"]
    end

    Hook -->|1. Save audio| IDB
    IDB -->|2. Store blob + userId| IDB
    User -->|3. View history| HistoryPanel
    HistoryPanel -->|4. Load history (filtered by userId)| IDB
    IDB -->|5. Return items| HistoryPanel
    HistoryPanel -->|6. Display| User
    AuthSDK -->|7. Get userId| Hook
    Hook -->|8. Filter by userId| IDB
```

---

## Overview

### Problem Statement

Users need to access previously generated audio for replay or reuse. With multi-user support, each user must have their own isolated history that persists across browser sessions.

### Goals

- Show last 50 generations per user
- Display text preview, voice name, timestamp
- Replay functionality
- Refill text to textarea
- **User-specific history isolation**
- **Storage usage display**
- **"Saved to History" notification timing fix**

---

## User Stories

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

### Story 2: Multi-User History Isolation

**As a** user **I want** my history to be isolated from other users **So that** when I log out and another user logs in, they don't see my history.

**Acceptance Criteria:**

- [x] Each history record stores a `userId` field (from `user.sub`)
- [x] When logged in, only current user's history is displayed
- [x] When logged out, only anonymous/anonymous records are displayed
- [x] Legacy records (without userId) are attributed to the current user on first access
- [x] "Clear History" only clears current user's history

**Priority:** P1 (High)

---

### Story 3: Storage Usage Display

**As a** user **I want** to know how much storage my history uses **So that** I can manage it and delete old records if needed.

**Acceptance Criteria:**

- [x] Display total storage used by history (in bytes, formatted as KB/MB/GB)
- [x] Display record count (e.g., "12 / 50 bản ghi")
- [x] Visual progress bar showing storage usage
- [x] Warning when storage is near limit (>80%) or full (>95%)
- [x] Refresh storage info after add/delete operations

**Priority:** P2 (Medium)

---

### Story 4: History Save Notification Timing

**As a** user **I want** the "Đã lưu vào Lịch sử" notification to appear only after the save is complete **So that** I know the save actually succeeded.

**Acceptance Criteria:**

- [x] Show "Đang lưu vào Lịch sử..." with spinner while saving
- [x] Show "Đã lưu vào Lịch sử" with checkmark only after IndexedDB save completes
- [x] Use `lastSavedHistoryId` in store to track save completion

**Priority:** P2 (Medium)

---

## Technical Design

### Files Created/Modified

| File                                           | Description                       | Status    |
| ---------------------------------------------- | --------------------------------- | --------- |
| `src/features/tts/components/HistoryPanel.tsx` | History list + StorageUsageBar    | Modified  |
| `src/lib/storage/history.ts`                   | IndexedDB ops with userId         | Modified  |
| `src/features/tts/store.ts`                    | Store with userId, storageInfo    | Modified  |
| `src/components/tts/MainContent.tsx`           | GenerationSuccess with animations | Modified  |
| `src/app/globals.css`                         | Animation keyframes               | Modified  |
| `src/components/ui/ConfirmDialog.tsx`           | Reusable confirm dialog           | Created   |

### Database Schema (IndexedDB)

```typescript
interface StoredHistoryRecord {
  id: string;
  text: string;
  model: string;
  voice: string;
  speed: number;
  duration: number;
  createdAt: number;
  audio: Blob; // Audio data (not blob URL)
  userId?: string; // Optional for legacy data
}
```

### State Management

| State            | Solution                    | Justification                     |
| ---------------- | --------------------------- | --------------------------------- |
| History items    | Zustand store + IndexedDB   | Persistence + reactivity          |
| User ID          | Zustand store               | Track current authenticated user   |
| Storage info     | Zustand store               | Display storage usage             |
| Save completion  | `lastSavedHistoryId` in store| Track async save completion       |

### StorageInfo Interface

```typescript
interface StorageInfo {
  historyBytes: number;    // Total bytes used by history
  historyCount: number;    // Number of records
  totalUsedBytes: number;  // Browser's total IndexedDB usage
  totalAvailableBytes: number; // Browser's available quota
  usagePercent: number;    // Percentage based on history limit
}
```

---

## Edge Cases

| #   | Case                                      | Handling                                      |
| --- | ----------------------------------------- | -------------------------------------------- |
| 1   | User logs out then in with different account | History reloads filtered by new userId       |
| 2   | Legacy records without userId              | Attributed to current user on first access    |
| 3   | IndexedDB not available                    | Graceful degradation, in-memory only         |
| 4   | Storage at limit                          | Warning message, oldest records evicted first |
| 5   | Save fails                                | Mark as saved after timeout, log error        |

---

## Security Considerations

- **Data Isolation**: History is filtered by `userId` from authenticated session
- **No Cross-User Access**: Users cannot access other users' history records
- **Blob URLs**: Only stored in memory (not IndexedDB), revoked on cleanup
- **Storage Limits**: Browser quota enforced by IndexedDB

---

## Definition of Done

- [x] Code implemented
- [x] Multi-user history isolation works
- [x] Storage usage displayed correctly
- [x] Save notification timing fixed
- [x] All tests pass
- [x] No lint errors
- [x] Build passes

---

## Changelog

### 2026-03-20

- Added multi-user history isolation with `userId` field
- Added `StorageUsageBar` component displaying storage usage
- Fixed "Đã lưu vào Lịch sử" notification timing
- Added `ConfirmDialog` for delete confirmations
- Added animation effects to `GenerationSuccess` component
- Fixed IndexedDB migration for adding `userId` index

### 2026-03-10

- Initial implementation with IndexedDB storage
- Basic history list with play/refill/delete
