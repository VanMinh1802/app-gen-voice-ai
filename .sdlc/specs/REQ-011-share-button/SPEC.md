# Feature Specification - Share Button

## 📋 Metadata

| Field              | Value            |
| ------------------ | ---------------- |
| **Feature ID**     | REQ-011          |
| **Feature Name**   | Share Button     |
| **Status**         | ✅ Completed     |
| **Priority**       | P2 (Medium)      |
| **Owner**          | Development Team |
| **Created**        | 2026-03-10       |
| **Target Release** | v1.1.0           |

---

## 🎯 Overview

### Problem Statement

Users need to share the app URL with others.

### Goals

- Copy URL to clipboard
- Show success/error feedback
- Include current state in URL

---

## 👥 User Stories

### Story 1: Share Button

**As a** user **I want** to copy the current page URL (e.g. with locale or state) to clipboard **So that** I can share the app link with others.

**Acceptance Criteria:**

- [x] "Share" or "Copy link" button in UI (e.g. header or near history)
- [x] On click: copy `window.location.href` (or canonical URL) to clipboard via Clipboard API
- [x] Toast or brief message: "Link copied" on success; show error if clipboard fails (e.g. not secure context)

**Priority:** P2 (Medium)

---

## 🏗️ Technical Design

### Files Created

| File                             | Description            |
| -------------------------------- | ---------------------- |
| `src/components/ShareButton.tsx` | Share button component |

---

## ✅ Definition of Done

- [x] Code implemented
- [x] Toast feedback works
