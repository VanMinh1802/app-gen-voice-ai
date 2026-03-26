---
name: writing-plans
description: Use when you have a spec or requirements for a multi-step task, before touching code
---

# Writing Plans

## Overview

Write comprehensive implementation plans assuming the engineer has zero context for our codebase and questionable taste. Document everything they need to know: which files to touch for each task, code, testing, docs they might need to check, how to test it. Give them the whole plan as bite-sized tasks. DRY. YAGNI. TDD. Frequent commits.

Assume they are a skilled developer, but know almost nothing about our toolset or problem domain. Assume they don't know good test design very well.

**Announce at start:** "I'm using the writing-plans skill to create the implementation plan."

**Context:** This should be run in a dedicated worktree (created by brainstorming skill).

**Save plans to:** \.sdlc/specs/REQ-XXX-{feature-name}/\ (NOT \docs/plans/\ â€” use the SDLC spec directory)

## Bite-Sized Task Granularity

**Each step is one action (2-5 minutes):**

- "Write the failing test" - step
- "Run it to make sure it fails" - step
- "Implement the minimal code to make the test pass" - step
- "Run the tests and make sure they pass" - step
- "Commit" - step

## Plan Document Header

**Every plan MUST start with this header:**

\\\markdown
# [Feature Name] Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development to implement this plan task-by-task.

**Goal:** [One sentence describing what this builds]

**Architecture:** [2-3 sentences about approach]

**Tech Stack:** [Key technologies/libraries â€” this project: Next.js 15, React, Tailwind CSS, Zustand, ONNX Runtime Web, IndexedDB, Cloudflare R2]

---
\\\

## Task Structure

\\\markdown
### Task N: [Component Name]

**Files:**

- Create: \exact/path/to/file.tsx\
- Modify: \exact/path/to/existing.tsx:123-145\
- Test: \	ests/exact/path/to/test.tsx\ (note: project has NO test infra yet â€” add test infrastructure first if needed)

**Step 1: Write the failing test**

> **Note:** If test infrastructure doesn't exist yet (Vitest/Playwright not configured),
> skip RED phase and go directly to implementing the feature. Document in the plan.

\\\	ypescript
// tests/path/component.test.tsx
import { render, screen } from "@testing-library/react";
import { ComponentName } from "@/features/xxx/components/ComponentName";

describe("ComponentName", () => {
  it("renders correctly", () => {
    render(<ComponentName />);
    expect(screen.getByRole("button")).toBeInTheDocument();
  });
});
\\\

**Step 2: Run test to verify it fails**

Run: \
pm run test -- --run tests/path/component.test.tsx\
Expected: FAIL with "module not found" (no test infra) or "ComponentName not defined"

**Step 3: Write minimal implementation**

\\\	ypescript
// src/features/xxx/components/ComponentName.tsx
export function ComponentName() {
  return <button>Click me</button>;
}
\\\

**Step 4: Run test to verify it passes**

Run: \
pm run test -- --run tests/path/component.test.tsx\
Expected: PASS

**Step 5: Commit**

\\\ash
git add src/features/xxx/components/ComponentName.tsx tests/path/component.test.tsx
git commit --trailer "Made-with: Cursor" -m "feat(xxx): add ComponentName"
\\\
\\\

## Remember

- Exact file paths always
- Complete code in plan (not "add validation")
- Exact commands with expected output
- Reference relevant skills with @ syntax
- DRY, YAGNI, TDD (or document if test infra missing), frequent commits
- **Save path is \.sdlc/specs/REQ-XXX-feature-name/\** not \docs/plans/\

## Execution Handoff

After saving the plan, offer execution choice:

**"Plan complete and saved to \.sdlc/specs/REQ-XXX-feature-name/\. Two execution options:**

**1. Subagent-Driven (this session)** - I dispatch fresh subagent per task, review between tasks, fast iteration

**2. Parallel Session (separate)** - Open new session with executing-plans, batch execution with checkpoints

**Which approach?"**

**If Subagent-Driven chosen:**

- **REQUIRED SUB-SKILL:** Use superpowers:subagent-driven-development
- Stay in this session
- Fresh subagent per task + code review

**If Parallel Session chosen:**

- Guide them to open new session in worktree
- **REQUIRED SUB-SKILL:** New session uses superpowers:executing-plans