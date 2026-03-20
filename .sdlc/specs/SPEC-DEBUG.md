# SPEC-DEBUG: Agent, Skill, Rule Reference & Dashboard UI/UX Review

## Metadata

| Field              | Value                                                             |
| ------------------ | ----------------------------------------------------------------- |
| **Feature ID**     | SPEC-DEBUG                                                        |
| **Feature Name**   | Comprehensive Agent/Skill/Rule Reference + Dashboard UI/UX Review |
| **Status**         | Complete                                                          |
| **Priority**       | P1 (High)                                                         |
| **Owner**          | Development Team                                                  |
| **Created**        | 2026-03-20                                                        |
| **Target Release** | v1.x                                                              |

---

## Table of Contents

1. [Agents Overview](#1-agents-overview)
2. [Skills Overview](#2-skills-overview)
3. [Workspace Rules](#3-workspace-rules)
4. [Dashboard UI/UX Review](#4-dashboard-uiux-review)
5. [Priority Implementation Plan](#5-priority-implementation-plan)
6. [Files Reference](#6-files-reference)

---

## 1. Agents Overview

### 1.1 Code Reviewer Agent

**File:** `.cursor/agents/code-reviewer.md`

#### Role

Expert code reviewer ensuring high standards of code quality and security for Voice AI applications.

#### Trigger

Invoked immediately after writing or modifying code.

#### Process

1. Run `git diff` to see recent changes
2. Focus on modified files
3. Begin review immediately

#### Code Quality Checklist

| Aspect         | Requirement                                            |
| -------------- | ------------------------------------------------------ |
| Readability    | Code is clear and readable                             |
| Naming         | Functions and variables are well-named                 |
| Duplication    | No duplicated code                                     |
| Error handling | Proper error handling throughout                       |
| TypeScript     | Types properly defined, no `any` without justification |

#### Security Checklist

| Aspect           | Requirement                            |
| ---------------- | -------------------------------------- |
| Secrets          | No exposed secrets or API keys         |
| Input validation | Input validation implemented           |
| Env vars         | Environment variables properly managed |
| API keys         | Stored in `.env` files, never in code  |
| Rate limiting    | Considerations for AI API calls        |

#### Voice AI Specific Checklist

| Aspect        | Requirement                                                |
| ------------- | ---------------------------------------------------------- |
| Audio data    | Handled securely                                           |
| Audio cleanup | Proper cleanup of audio streams                            |
| API errors    | Error handling for API failures (OpenAI, ElevenLabs, etc.) |
| Timeouts      | Timeout handling for long-running AI requests              |
| Streaming     | Streaming responses handled correctly                      |

#### Performance Checklist

| Aspect      | Requirement                             |
| ----------- | --------------------------------------- |
| Caching     | Consider caching for repeated API calls |
| Suspense    | Proper use of Suspense boundaries       |
| Re-renders  | No unnecessary re-renders               |
| Bundle size | Bundle size considerations              |

#### Testing Checklist

| Aspect      | Requirement                        |
| ----------- | ---------------------------------- |
| Coverage    | Good test coverage                 |
| Unit tests  | Unit tests for utilities           |
| Integration | Integration tests for API handlers |

#### Output Format

Feedback organized by priority:

| Priority   | Label                 | Meaning                                      |
| ---------- | --------------------- | -------------------------------------------- |
| Critical   | 🔴 Must fix           | Security issues, crashes, broken flows       |
| Warning    | 🟡 Should fix         | Performance issues, maintainability concerns |
| Suggestion | 🟢 Consider improving | Code style, minor improvements               |

Include specific code examples for how to fix issues.

---

### 1.2 Debugger Agent

**File:** `.cursor/agents/debugger.md`

#### Role

Expert debugging specialist for Voice AI applications, specializing in root cause analysis.

#### Trigger

Use proactively when encountering any bugs, test failures, or unexpected behavior.

#### Debugging Process

```
Phase 1: Root Cause Investigation
  → Capture error message and stack trace
  → Identify reproduction steps
  → Isolate the failure location

Phase 2: Pattern Analysis
  → Find working examples in codebase
  → Compare against reference implementations
  → Identify differences

Phase 3: Hypothesis and Testing
  → Form single hypothesis
  → Test minimally (one variable at a time)
  → Verify before continuing

Phase 4: Implementation
  → Create failing test case
  → Implement minimal fix
  → Verify fix works
```

#### Common Voice AI Debugging Scenarios

**API Issues:**

- OpenAI/ElevenLabs API errors
- Authentication failures
- Rate limiting issues
- Timeout handling

**Audio Processing:**

- Audio stream interruptions
- Microphone permission issues
- Audio format compatibility
- Buffer overflow/underflow

**Frontend Issues:**

- React component errors
- State management issues
- Streaming response handling
- WebSocket connections

**Server Issues:**

- Next.js API route errors
- Server Component vs Client Component conflicts
- Environment variable issues

#### Required Output Per Issue

| Field            | Description                         |
| ---------------- | ----------------------------------- |
| Root cause       | Explanation of WHY it breaks        |
| Evidence         | Supporting diagnosis data           |
| Code fix         | Specific implementation             |
| Testing approach | How to verify                       |
| Prevention       | Recommendations to avoid recurrence |

#### The Iron Law

```
NO FIXES WITHOUT ROOT CAUSE INVESTIGATION FIRST
```

If Phase 1 is not completed, NO fix proposals are allowed.

---

### 1.3 Spec Writer Agent

**File:** `.cursor/agents/spec-writer.md`

#### Role

Senior software architect and specification writer with deep expertise in Next.js, SDLC methodology, and Voice AI applications.

#### When to Use

- User describes a new feature requirement
- Designing significant changes to existing functionality
- Planning new subsystems or integrations
- Adding security-sensitive changes
- Any work requiring architectural decisions

#### Workflow

```
1. Explore Codebase
   → Project structure: follow vertical slice pattern in `src/features/`
   → Existing conventions: check `.sdlc/context/conventions.md`
   → Architecture: check `.sdlc/context/architecture.md`
   → Existing features: look at `src/features/tts/` for reference patterns
   → Tech stack: Next.js App Router, Tailwind CSS, Zustand, TypeScript

2. Ask Clarifying Questions
   → What are the success criteria?
   → Who are the target users?
   → What are the edge cases?
   → What browser/environment constraints exist?

3. Produce Specification
   → Save to `.sdlc/specs/REQ-XXX-{feature-name}/SPEC.md`
```

#### Specification Structure

```
.sdlc/specs/REQ-XXX-{feature-name}/
├── SPEC.md                    # Main specification
├── decisions/
│   └── ADR-001-{topic}.md   # Architecture Decision Records
└── notes/
    └── meeting-001-{topic}.md
```

#### Required Sections

1. **Metadata** - Feature ID, name, status, priority, owner
2. **Mermaid Data Flow** - Quick visual flow at the top (mandatory)
3. **Overview** - Problem statement, goals, non-goals
4. **User Stories** - At least 2-3 stories with acceptance criteria
5. **Technical Design** - Component structure, state management, API design
6. **Flow Diagrams** - Main flow, error flow
7. **Edge Cases** - At least 5 common edge cases
8. **Security** - Input validation, model loading, content safety
9. **Testing Strategy** - Component tests, integration tests
10. **Implementation Plan** - Ordered steps with dependencies

#### Project Conventions

**Component Structure:**

```tsx
interface ComponentProps {
  defaultValue?: string;
  onComplete?: (result: Result) => void;
}

export function Component({ defaultValue, onComplete }: ComponentProps) {
  // Use hooks from ../hooks/
  // Use store from ../store.ts
  // Return JSX with Tailwind classes
}
```

**Hook Pattern:**

```tsx
export function useFeature() {
  const [state, setState] = useState(initial);

  const action = useCallback(
    async (input: Input): Promise<Output> => {
      // Implementation
      return result;
    },
    [...deps],
  );

  return { action, state };
}
```

**State Management Matrix:**

| State Type       | Solution          | When to Use                 |
| ---------------- | ----------------- | --------------------------- |
| UI state         | `useState`        | Component-specific          |
| Feature settings | Zustand + persist | Cross-component, persistent |
| Session          | React Context     | Auth, global flags          |
| Large data       | IndexedDB         | History, cached models      |
| Database         | Drizzle ORM       | Persistent structured data  |

**Import Order:**

```tsx
// 1. React/Next
import { useState } from "react";
import Link from "next/link";

// 2. External
import { clsx } from "clsx";

// 3. Internal shared
import { Button } from "@/components/ui/button";

// 4. Feature (absolute)
import { useTtsGenerate } from "@/features/tts/hooks/useTtsGenerate";

// 5. Relative
import { formatDuration } from "../utils/format";
```

**File Naming:**

| Type      | Pattern            | Example                 |
| --------- | ------------------ | ----------------------- |
| Component | `{Name}.tsx`       | `TtsPlayer.tsx`         |
| Hook      | `use{Name}.ts`     | `useTtsGenerate.ts`     |
| Service   | `{name}.ts`        | `piperTts.ts`           |
| Types     | `types.ts`         | `features/tts/types.ts` |
| Worker    | `{name}.worker.ts` | `tts.worker.ts`         |

#### Quality Gates

Before delivering spec:

- [ ] Every user story has acceptance criteria
- [ ] Technical design covers all user stories
- [ ] Mermaid diagrams are syntactically correct
- [ ] Module structure follows project conventions
- [ ] Error cases mapped to specific error codes
- [ ] Implementation plan ordered by dependency
- [ ] Open questions clearly stated

---

## 2. Skills Overview

### 2.1 Systematic Debugging Skill

**File:** `.cursor/skills/superpowers/systematic-debugging/SKILL.md`

#### Core Principle

Random fixes waste time and create new bugs. Quick patches mask underlying issues.

```
NO FIXES WITHOUT ROOT CAUSE INVESTIGATION FIRST
```

#### The Four Phases

**Phase 1: Root Cause Investigation**

BEFORE attempting ANY fix:

1. Read error messages carefully — don't skip past errors or warnings
2. Reproduce consistently — can you trigger it reliably?
3. Check recent changes — git diff, commits, new dependencies, config changes
4. Gather evidence in multi-component systems — log at each boundary
5. Trace data flow — find where bad value originates, trace up to source

**Phase 2: Pattern Analysis**

1. Find working examples in same codebase
2. Compare against reference implementations completely (don't skim)
3. Identify differences (list every difference, however small)
4. Understand dependencies

**Phase 3: Hypothesis and Testing**

1. Form single hypothesis: "I think X is root cause because Y"
2. Test minimally — smallest change, one variable at a time
3. Verify before continuing
4. When unsure: research more, ask for help

**Phase 4: Implementation**

1. Create failing test case first (TDD cycle)
2. Implement single fix addressing root cause
3. Verify fix — test passes, no regressions
4. If 3+ fixes failed: STOP and question architecture

#### Red Flags — STOP and Follow Process

| Rationalization                                 | Action                      |
| ----------------------------------------------- | --------------------------- |
| "Quick fix for now, investigate later"          | STOP, return to Phase 1     |
| "Just try changing X and see if it works"       | STOP, return to Phase 1     |
| "Add multiple changes, run tests"               | STOP, return to Phase 1     |
| "Skip the test, I'll manually verify"           | STOP, return to Phase 1     |
| "It's probably X, let me fix that"              | STOP, return to Phase 1     |
| "I don't fully understand but this might work"  | STOP, return to Phase 1     |
| "One more fix attempt" (after 2+ failures)      | STOP, question architecture |
| Each fix reveals new problem in different place | STOP, question architecture |

#### Common Rationalizations Table

| Excuse                                       | Reality                                            |
| -------------------------------------------- | -------------------------------------------------- |
| "Issue is simple, don't need process"        | Simple issues have root causes too                 |
| "Emergency, no time for process"             | Systematic debugging is FASTER than thrashing      |
| "Just try this first, then investigate"      | First fix sets the pattern. Do it right from start |
| "I'll write test after confirming fix works" | Untested fixes don't stick                         |
| "Multiple fixes at once saves time"          | Can't isolate what worked. Causes new bugs         |
| "Reference too long, I'll adapt the pattern" | Partial understanding guarantees bugs              |
| "I see the problem, let me fix it"           | Seeing symptoms ≠ understanding root cause         |
| "One more fix attempt" (after 2+ failures)   | 3+ failures = architectural problem                |

#### When 3+ Fixes Failed

Pattern indicating architectural problem:

- Each fix reveals new shared state/coupling/problem in different place
- Fixes require "massive refactoring" to implement
- Each fix creates new symptoms elsewhere

**Action:** STOP. Discuss with human before attempting more fixes.

---

### 2.2 Verification Before Completion Skill

**File:** `.cursor/skills/superpowers/verification-before-completion/SKILL.md`

#### Core Principle

Claiming work is complete without verification is dishonesty, not efficiency.

```
NO COMPLETION CLAIMS WITHOUT FRESH VERIFICATION EVIDENCE
```

#### The Gate Function

```
BEFORE claiming any status or expressing satisfaction:

1. IDENTIFY: What command proves this claim?
2. RUN: Execute the FULL command (fresh, complete)
3. READ: Full output, check exit code, count failures
4. VERIFY: Does output confirm the claim?
   - If NO: State actual status with evidence
   - If YES: State claim WITH evidence
5. ONLY THEN: Make the claim

Skip any step = lying, not verifying
```

#### Common Failures

| Claim                 | Requires                        | Not Sufficient                 |
| --------------------- | ------------------------------- | ------------------------------ |
| Tests pass            | Test command output: 0 failures | Previous run, "should pass"    |
| Linter clean          | Linter output: 0 errors         | Partial check, extrapolation   |
| Build succeeds        | Build command: exit 0           | Linter passing, logs look good |
| Bug fixed             | Test original symptom: passes   | Code changed, assumed fixed    |
| Regression test works | Red-green cycle verified        | Test passes once               |
| Agent completed       | VCS diff shows changes          | Agent reports "success"        |
| Requirements met      | Line-by-line checklist          | Tests passing                  |

#### Red Flags — STOP

- Using "should", "probably", "seems to"
- Expressing satisfaction before verification
- About to commit/PR without verification
- Trusting agent success reports
- Relying on partial verification
- Thinking "just this once"
- **ANY wording implying success without having run verification**

#### Key Patterns

**Tests:**

```
✅ [Run test command] [See: 34/34 pass] "All tests pass"
❌ "Should pass now" / "Looks correct"
```

**Build:**

```
✅ [Run build] [See: exit 0] "Build passes"
❌ "Linter passed" (linter doesn't check compilation)
```

#### Why This Matters

From 24 failure memories:

- Human said "I don't believe you" — trust broken
- Undefined functions shipped — would crash
- Missing requirements shipped — incomplete features
- Time wasted on false completion → redirect → rework
- Violates: "Honesty is a core value. If you lie, you'll be replaced."

---

### 2.3 Test-Driven Development Skill

**File:** `.cursor/skills/superpowers/test-driven-development/SKILL.md`

#### Core Principle

Write the test first. Watch it fail. Write minimal code to pass.

```
NO PRODUCTION CODE WITHOUT A FAILING TEST FIRST
```

Write code before the test? Delete it. Start over.

#### The Iron Law

**No exceptions:**

- Don't keep it as "reference"
- Don't "adapt" it while writing tests
- Don't look at it
- Delete means delete

#### Red-Green-Refactor Cycle

```
RED:   Write failing test → Verify it fails
GREEN: Minimal code to pass → Verify it passes
REFACTOR: Clean up → Verify still passes
→ Repeat
```

**RED Phase:**

- One behavior per test
- Clear name describing behavior
- Real code (no mocks unless unavoidable)
- **MANDATORY:** Watch it fail before implementing

**GREEN Phase:**

- Simplest code to pass the test
- Don't add features beyond the test
- Don't refactor other code
- Just enough to pass

**REFACTOR Phase:**

- After green only
- Remove duplication
- Improve names
- Extract helpers
- Keep tests green

#### Good vs Bad Tests

| Quality      | Good                               | Bad                                                 |
| ------------ | ---------------------------------- | --------------------------------------------------- |
| Minimal      | One thing. "and" in name? Split it | `test('validates email and domain and whitespace')` |
| Clear        | Name describes behavior            | `test('test1')`                                     |
| Shows intent | Demonstrates desired API           | Obscures what code should do                        |

#### Common Rationalizations

| Excuse                           | Reality                                                                 |
| -------------------------------- | ----------------------------------------------------------------------- |
| "Too simple to test"             | Simple code breaks. Test takes 30 seconds                               |
| "I'll test after"                | Tests passing immediately prove nothing                                 |
| "Tests after achieve same goals" | Tests-after = "what does this do?" Tests-first = "what should this do?" |
| "Already manually tested"        | Ad-hoc ≠ systematic. No record, can't re-run                            |
| "Deleting X hours is wasteful"   | Sunk cost fallacy. Keeping unverified code is technical debt            |
| "TDD will slow me down"          | TDD faster than debugging. Pragmatic = test-first                       |

#### Red Flags — STOP and Start Over

- Code before test
- Test after implementation
- Test passes immediately
- Can't explain why test failed
- Tests added "later"
- Rationalizing "just this once"
- "I already manually tested it"
- "Tests after achieve the same purpose"
- "It's about spirit not ritual"

---

### 2.4 Writing Skills Skill

**File:** `.cursor/skills/superpowers/writing-skills/SKILL.md`

#### Core Principle

Writing skills IS Test-Driven Development applied to process documentation.

```
NO SKILL WITHOUT A FAILING TEST FIRST
```

This applies to NEW skills AND EDITS to existing skills.

#### SKILL.md Frontmatter Format

```yaml
---
name: Skill-Name-With-Hyphens
description: Use when [specific triggering conditions and symptoms]
---
# Skill Name

## Overview

What is this? Core principle in 1-2 sentences.
```

**Frontmatter rules:**

- Only two fields: `name` and `description`
- Max 1024 characters total
- `name`: letters, numbers, hyphens only (no parentheses/special chars)
- `description`: Third-person, describes ONLY when to use (NOT what it does)
  - Start with "Use when..." to focus on triggering conditions
  - Include specific symptoms, situations, and contexts
  - **NEVER summarize the skill's process or workflow**

#### Claude Search Optimization (CSO)

**Critical for discovery:** Future Claude needs to FIND your skill.

| Pattern                             | Example                                                                                 |
| ----------------------------------- | --------------------------------------------------------------------------------------- |
| ❌ BAD: Summarizes workflow         | "Use when executing plans - dispatches subagent per task with code review"              |
| ❌ BAD: Too much process detail     | "Use for TDD - write test first, watch it fail, write minimal code, refactor"           |
| ✅ GOOD: Just triggering conditions | "Use when executing implementation plans with independent tasks in the current session" |
| ✅ GOOD: Triggering conditions only | "Use when implementing any feature or bugfix, before writing implementation code"       |

#### Skill Types

| Type      | Description                    | Examples                                    |
| --------- | ------------------------------ | ------------------------------------------- |
| Technique | Concrete method with steps     | condition-based-waiting, root-cause-tracing |
| Pattern   | Way of thinking about problems | flatten-with-flags, test-invariants         |
| Reference | API docs, syntax guides        | office docs                                 |

#### RED-GREEN-REFACTOR for Skills

**RED Phase:** Run pressure scenario WITHOUT skill → document baseline behavior verbatim
**GREEN Phase:** Write skill addressing those rationalizations → verify agents comply
**REFACTOR Phase:** Find new rationalizations → add explicit counters → re-test

#### Common Rationalizations

| Excuse                         | Reality                                                  |
| ------------------------------ | -------------------------------------------------------- |
| "Skill is obviously clear"     | Clear to you ≠ clear to other agents                     |
| "It's just a reference"        | References can have gaps                                 |
| "Testing is overkill"          | Untested skills have issues. Always                      |
| "I'll test if problems emerge" | Problems = agents can't use skill. Test before deploying |

---

### 2.5 Writing Plans Skill

**File:** `.cursor/skills/superpowers/writing-plans/SKILL.md`

#### Core Principle

Write comprehensive implementation plans assuming the engineer has zero context for our codebase and questionable taste.

**Announce at start:** "I'm using the writing-plans skill to create the implementation plan."

**Save plans to:** `docs/plans/YYYY-MM-DD-<feature-name>.md`

#### Bite-Sized Task Granularity

Each step is one action (2-5 minutes):

- "Write the failing test" — step
- "Run it to make sure it fails" — step
- "Implement the minimal code to make the test pass" — step
- "Run the tests and make sure they pass" — step
- "Commit" — step

#### Plan Document Header

```markdown
# [Feature Name] Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** [One sentence describing what this builds]
**Architecture:** [2-3 sentences about approach]
**Tech Stack:** [Key technologies/libraries]

---
```

#### Task Structure

```markdown
### Task N: [Component Name]

**Files:**

- Create: `exact/path/to/file.py`
- Modify: `exact/path/to/existing.py:123-145`
- Test: `tests/exact/path/to/test.py`

**Step 1: Write the failing test**
[pseudocode]

**Step 2: Run test to verify it fails**
Run: `pytest tests/path/test.py::test_name -v`
Expected: FAIL with "function not defined"

**Step 3: Write minimal implementation**
[pseudocode]

**Step 4: Run test to verify it passes**
Run: `pytest tests/path/test.py::test_name -v`
Expected: PASS

**Step 5: Commit**
[command]
```

#### Remember

- Exact file paths always
- Complete code in plan (not "add validation")
- Exact commands with expected output
- Reference relevant skills with @ syntax
- DRY, YAGNI, TDD, frequent commits

---

### 2.6 Subagent-Driven Development Skill

**File:** `.cursor/skills/superpowers/subagent-driven-development/SKILL.md`

#### Core Principle

Fresh subagent per task + two-stage review (spec then quality) = high quality, fast iteration.

#### When to Use

```
"Have implementation plan?" → "Tasks mostly independent?" → "Stay in this session?"
                                    ↓
         "yes"                    → subagent-driven-development
         "no - tightly coupled"    → Manual execution or brainstorm first
```

**vs. Executing Plans (parallel session):**

- Same session (no context switch)
- Fresh subagent per task (no context pollution)
- Two-stage review after each task: spec compliance first, then code quality
- Faster iteration (no human-in-loop between tasks)

#### The Process

```
Per Task:
  1. Dispatch implementer subagent with full task text + context
  2. Implementer subagent asks questions? → Answer, then continue
  3. Implementer subagent implements, tests, commits, self-reviews
  4. Dispatch spec reviewer subagent
  5. Spec reviewer confirms code matches spec?
     - No → Implementer fixes spec gaps → re-review
     - Yes → Continue
  6. Dispatch code quality reviewer subagent
  7. Code quality reviewer approves?
     - No → Implementer fixes quality issues → re-review
     - Yes → Mark task complete

After all tasks:
  8. Dispatch final code reviewer subagent for entire implementation
  9. Use finishing-a-development-branch skill
```

#### Red Flags

**Never:**

- Start implementation on main/master branch without explicit user consent
- Skip reviews (spec compliance OR code quality)
- Proceed with unfixed issues
- Dispatch multiple implementation subagents in parallel (conflicts)
- Make subagent read plan file (provide full text instead)
- Skip scene-setting context (subagent needs to understand where task fits)
- Accept "close enough" on spec compliance
- Skip review loops
- Let implementer self-review replace actual review (both are needed)
- **Start code quality review before spec compliance is ✅**
- Move to next task while either review has open issues

---

### 2.7 UI UX Pro Max Skill

**File:** `.cursor/skills/ui-ux-pro-max/SKILL.md`

#### Core Capabilities

- **67 UI Styles** — Glassmorphism, Claymorphism, Minimalism, Brutalism, Neumorphism, Bento Grid, Dark Mode, AI-Native UI, and more
- **161 Color Palettes** — Industry-specific palettes
- **57 Font Pairings** — Curated typography combinations
- **25 Chart Types** — Recommendations for dashboards
- **13 Tech Stacks** — React, Next.js, Astro, Vue, Svelte, SwiftUI, React Native, Flutter, HTML+Tailwind, shadcn/ui, Jetpack Compose
- **99 UX Guidelines** — Best practices, anti-patterns, accessibility
- **161 Reasoning Rules** — Industry-specific design system generation

#### When to Use

- Building UI components, pages, or full websites
- Designing dashboards, landing pages, or mobile apps
- Choosing color palettes, typography, or visual styles
- Getting UX recommendations or design patterns
- Creating design systems for specific industries

#### Accessibility Requirements

| Requirement    | Standard                                         |
| -------------- | ------------------------------------------------ |
| Color contrast | Minimum 4.5:1 for text, 3:1 for large text       |
| Focus states   | Visible focus indicators for keyboard navigation |
| Semantic HTML  | Proper heading hierarchy, landmarks, labels      |
| Reduced motion | Respect `prefers-reduced-motion`                 |
| Screen reader  | Proper ARIA labels and alt text                  |

#### Pre-Delivery Checklist

- [ ] No emojis as icons (use SVG: Heroicons/Lucide)
- [ ] cursor-pointer on all clickable elements
- [ ] Hover states with smooth transitions (150-300ms)
- [ ] Light mode: text contrast 4.5:1 minimum
- [ ] Focus states visible for keyboard nav
- [ ] prefers-reduced-motion respected
- [ ] Responsive breakpoints: 375px, 768px, 1024px, 1440px

---

## 3. Workspace Rules

### 3.1 Security Guidelines

**File:** `.cursor/rules/security-guidelines.mdc`

#### Security Model

Unlike server-side apps, TTS runs entirely in the browser. This changes the security model significantly.

#### Authentication

**Simple Login (Genation SDK):**

| Aspect  | Implementation                          |
| ------- | --------------------------------------- |
| Purpose | Prevent DDoS, not strict access control |
| Method  | Genation SDK authentication             |
| Scope   | User identification only in MVP         |

**NOT Needed (MVP):**

- Role-based access control
- Permission scopes
- API key management
- OAuth 2.0

#### Client-Side Security

**Input Validation:**

```tsx
function sanitizeText(text: string): string {
  return text
    .slice(0, MAX_TEXT_LENGTH) // Limit length
    .replace(/[\u0000-\u001F]/g, "") // Remove control chars
    .trim();
}
```

**Model Loading Security:**

| Risk              | Mitigation                       |
| ----------------- | -------------------------------- |
| Malicious model   | Verify model signature (future)  |
| Model injection   | Only load from trusted R2 bucket |
| Memory exhaustion | Limit concurrent model loads     |

#### Privacy Considerations

**Client-Side Data Storage:**

| Data            | Storage      | Retention    |
| --------------- | ------------ | ------------ |
| Generated audio | IndexedDB    | User-managed |
| Text history    | IndexedDB    | User-managed |
| Settings        | localStorage | Permanent    |
| Session         | memory       | Until close  |

**NOT Stored on Server (MVP):**

- User text inputs
- Generated audio
- Usage history

#### Network Security

| Best Practice | Implementation               |
| ------------- | ---------------------------- |
| HTTPS only    | Enforced by Cloudflare       |
| Rate limiting | Genation SDK handles         |
| CORS          | Configure in Pages Functions |

---

### 3.2 Coding Standards

**File:** `.cursor/rules/coding-standards.mdc`

#### TypeScript Rules

- **No `any`** without justification
- Use strict typing everywhere
- Export types for reuse
- Use interfaces for object shapes

#### Styling (Tailwind CSS)

**Use clsx for Conditional Classes:**

```tsx
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: (string | boolean | undefined)[]) {
  return twMerge(clsx(inputs));
}
```

**Responsive Design (Mobile-first):**

```tsx
<div className="flex flex-col sm:flex-row gap-2">
  <input className="w-full sm:w-auto flex-1" />
  <button className="w-full sm:w-auto">Generate</button>
</div>
```

#### Testing

**Component Test (Vitest + Testing Library):**

```tsx
import { fireEvent, render, screen } from "@testing-library/react";
import { TtsGenerator } from "./TtsGenerator";

describe("TtsGenerator", () => {
  it("should render textarea and button", () => {
    render(<TtsGenerator />);
    expect(screen.getByRole("textbox")).toBeInTheDocument();
    expect(screen.getByRole("button")).toBeInTheDocument();
  });
});
```

---

### 3.3 SDLC Workflow

**File:** `.cursor/rules/sdlc-workflow.mdc`

#### Workflow Phases

```
Phase 1: Discovery (Agent does alone)
  → Understand feature request
  → Explore codebase
  → Create initial SPEC.md draft

Phase 2: Mob Elaboration (with Human)
  → Present initial understanding
  → Ask clarifying questions
  → Document decisions

Phase 3: Refinement (Agent does alone)
  → Update SPEC.md with decisions
  → Create necessary ADRs
  → Present final spec for approval

Phase 4: Implementation (after approval)
  → Human approves SPEC.md
  → Agent implements
  → Write tests alongside code
  → Create PR
```

#### When to Use SDLC

**Use for:**

- Creating a new feature (TTS generation, model loading, audio playback)
- Adding significant functionality
- Bug fix requiring architectural changes
- Planning refactoring affecting multiple modules
- Designing API changes or new integrations

**Do NOT use for:**

- Small bug fixes (just fix directly)
- Documentation updates only
- Minor UI/text changes
- Adding comments or JSDoc

---

### 3.4 Project Overview

**File:** `.cursor/rules/project-overview.mdc`

#### Tech Stack

| Layer      | Technology                                  |
| ---------- | ------------------------------------------- |
| Framework  | Next.js 16 (App Router)                     |
| UI         | React + Tailwind CSS                        |
| State      | Zustand / React Context                     |
| TTS Engine | Piper TTS (ONNX)                            |
| Runtime    | ONNX Runtime Web (WASM)                     |
| Storage    | Cloudflare R2 (models), IndexedDB (history) |
| Deployment | Cloudflare Pages + Pages Functions          |
| Auth       | Genation SDK (simple login)                 |

#### Key Characteristics

- **Client-side first:** All TTS processing happens in the browser
- **Privacy-focused:** User text is NOT sent to any server
- **No server inference:** Uses ONNX Runtime Web (WASM) for local inference
- **Model storage:** TTS models stored in Cloudflare R2, loaded lazily

#### Git Conventions

**Commit Message Format:** `<type>(<scope>): <description>`

| Type     | Use For                            |
| -------- | ---------------------------------- |
| feat     | New feature                        |
| fix      | Bug fix                            |
| docs     | Documentation changes              |
| style    | Code formatting, no logic change   |
| refactor | Code refactoring                   |
| test     | Adding/updating tests              |
| chore    | Dependency updates, config changes |

---

## 4. Dashboard UI/UX Review

### 4.1 Architecture Overview

#### Layout Structure

```
Root Layout → (main) Layout → Page
  ├── Fonts & Providers
  │
Page (Main orchestrator):
  ├── Header (sticky, 56-64px)
  ├── Sidebar (fixed, 256px / collapsible to 72px)
  └── Main Area (flex-1, overflow-y-auto)
      ├── Tab Content (Dashboard | Voice Library | History | Settings)
      │   └── (inside Dashboard tab)
      │       ├── TextInput (8 cols)
      │       ├── Voice Selection + Audio Customization (4 cols, sticky)
      │       └── Tips + Samples + Recent History (8 cols)
      └── AudioPlayer Footer (fixed bottom, 96px)
```

#### Tab-based SPA Pattern

All tabs rendered in one page. Tab switching shows/hides content via conditional rendering. `TtsProvider` lives above tabs so the TTS worker persists across tab switches.

**Lifted State:**

- `inputText` lives in Zustand + sessionStorage (persists across tab switches)
- `activeTab`, `sidebarOpen`, `sidebarCollapsed` are local page state

**Provider Hierarchy:**

```
page.tsx
└── ToastProvider
    └── HomeContentInner
        └── TtsProvider
            └── AuthProvider
```

---

### 4.2 Component Inventory

#### Sidebar

| Aspect           | Assessment                                           | Notes                                       |
| ---------------- | ---------------------------------------------------- | ------------------------------------------- |
| Navigation items | ✅ 4 items with icons and labels                     | Dashboard, Thư viện giọng, Lịch sử, Cài đặt |
| Active state     | ✅ Left bar + gradient highlight + chevron animation |                                             |
| Plan card        | ✅ Shows plan name, expiry, upgrade button           |                                             |
| Collapse toggle  | ✅ Arrow button outside sidebar edge (md+)           |                                             |
| Logo             | ⚠️ MP4 video — may not load on slow connections      | Need static fallback                        |

**Issues:**

1. 🔴 **Collapse toggle hidden on mobile** — `hidden md:flex`. If `setSidebarCollapsed(true)` triggered on mobile, sidebar becomes `w-[4.5rem]` but still `fixed`, causing visual issues.
2. 🟡 **Active state in collapsed mode unclear** — Background color may not be visible in icon-only mode.
3. 🟢 **Missing `aria-current="page"`** on nav buttons for accessibility.

#### Header

| Aspect        | Assessment                                         | Notes |
| ------------- | -------------------------------------------------- | ----- |
| Dynamic title | ✅ Per tab                                         |       |
| Theme toggle  | ✅ Sun/Moon icons                                  |       |
| Notifications | ✅ Dropdown with unread count badge                |       |
| User menu     | ✅ Avatar + name + PRO badge                       |       |
| Auth states   | ✅ Handles loading, unauthenticated, authenticated |       |

**Issues:**

1. 🟢 **Notification badge only shows dot** — Can't tell count without opening.
2. 🟢 **Avatar is single initial letter** — Could be enhanced with gradient based on name hash.
3. 🟢 **Missing `aria-label` on logo video** in Sidebar.

#### TextInput

| Aspect            | Assessment                              | Notes |
| ----------------- | --------------------------------------- | ----- |
| Character counter | ✅ Amber at 80%, red when over limit    |       |
| Progress bar      | ✅ Color-coded (primary → amber → red)  |       |
| Ctrl+Enter hint   | ✅ Keyboard shortcut badge              |       |
| Textarea height   | ✅ Responsive (180px mobile → 320px XL) |       |
| Focus state       | ✅ Ring + border highlight              |       |

**Issues:**

1. 🟢 **No resize handle** — `resize-none` is intentional but limits accessibility.
2. 🟢 **Progress bar placement** — Below label, above textarea. Acceptable but tight on small screens.

#### VoiceSelection (Dropdown)

| Aspect           | Assessment                                           | Notes |
| ---------------- | ---------------------------------------------------- | ----- |
| Dropdown trigger | ✅ Selected voice with avatar + name + region/gender |       |
| Search           | ✅ Real-time filter by name/region/gender            |       |
| Region filter    | ✅ Pills (Tất cả, Miền Bắc, Miền Trung, Miền Nam)    |       |
| Gender filter    | ✅ Pills (Tất cả, Nam, Nữ)                           |       |
| Loading state    | ✅ Skeleton + spinner + descriptive text             |       |
| Portal rendering | ✅ Fixed-position avoids overflow clipping           |       |
| Responsive       | ✅ Recalculates on resize/scroll                     |       |

**Issues:**

1. 🟡 **Dropdown `height` set via direct style** — Fragile if position calculation fails. Should add minimum height fallback.
2. 🟢 **Empty result message** — "Không có giọng phù hợp" should suggest clearing filters.

#### AudioCustomization

| Aspect       | Assessment                        | Notes |
| ------------ | --------------------------------- | ----- |
| Speed slider | ✅ 0.5x–2.0x with label           |       |
| Pitch slider | ✅ -12 to +12 with label          |       |
| Labels       | ✅ Icon + text for each parameter |       |

**Issues:**

1. 🟡 **Pitch label confusing** — -12 to +12 with 0 in middle. Casual user doesn't know what "pitch" means. Needs tooltip or helper text: "Âm = thấp hơn, Dương = cao hơn".
2. 🟢 **Native range input styling** — Limited cross-browser control. Acceptable for MVP.

#### GenerateButton

| Aspect          | Assessment                       | Notes |
| --------------- | -------------------------------- | ----- |
| CTA prominence  | ✅ Large, glowing, primary color |       |
| Disabled states | ✅ Detailed `disabledReason`     |       |
| Keyboard hint   | ✅ Ctrl+Enter badge              |       |
| Hover animation | ✅ Scale + shadow                |       |

**Issues:**

1. 🟡 **Locked voice disabled button** — Shows "Giọng này chỉ nghe sample (cần Pro để tạo)" but user can't click it. Should navigate to `/pricing` or show upgrade toast.

#### GenerationSuccess

| Aspect         | Assessment                          | Notes |
| -------------- | ----------------------------------- | ----- |
| Success banner | ✅ Green with checkmark             |       |
| Text preview   | ✅ Read-only textarea               |       |
| Inline player  | ✅ Play/pause + waveform + progress |       |
| Actions        | ✅ "Tạo lượt mới" + "Tạo lại"       |       |

**Issues:**

1. 🔴 **NOT collapsible** — `min-h-[360px]` pushes tips/samples/history off-screen on laptops. Most impactful dashboard UX issue.
2. 🟡 **Waveform is decorative** — `globals.css` overrides with `height: 12px !important; animation: none !important`. Static, not reflecting audio data.

#### VoiceLibrary

| Aspect        | Assessment                    | Notes |
| ------------- | ----------------------------- | ----- |
| Grid layout   | ✅ Responsive (1→2→3→4 cols)  |       |
| Search        | ✅ Real-time filter           |       |
| Region filter | ✅ Segmented control buttons  |       |
| Style filter  | ✅ Advanced panel with scroll |       |
| Empty state   | ✅ "Không tìm thấy giọng nói" |       |

**Issues:**

1. 🟢 **"Xóa bộ lọc" style** — Red underline for clearing filters. Should be secondary button.
2. 🟢 **Advanced filter panel `z-index`** — 50 but inside `.relative`. May clip on smaller screens.

#### VoiceSettings

| Aspect         | Assessment                                              | Notes |
| -------------- | ------------------------------------------------------- | ----- |
| Tab navigation | ✅ 4 tabs with icons                                    |       |
| Subscription   | ✅ Plan info + upgrade card                             |       |
| Customization  | ✅ Dark mode + language + notifications + default voice |       |

**Issues:**

1. 🔴 **Personal Info form not functional** — Editable but "Lưu" just opens external link. No local save.
2. 🔴 **Language selector has no effect** — App is entirely in Vietnamese. Language switch does nothing.
3. 🔴 **"Xóa tài khoản" has no confirm dialog** — Opens external link immediately.
4. 🟡 **Settings tabs overflow-x** — `overflow-x-auto` with `pb-4` creates visual inconsistency.
5. 🟡 **"Gia hạn" shown for free users** — Should be "Nâng cấp".

#### Toast System

| Aspect             | Assessment                                   | Notes |
| ------------------ | -------------------------------------------- | ----- |
| Error toast        | ✅ Red background, close button, readable    |       |
| Success/info toast | ✅ Semi-transparent, close button            |       |
| Positioning        | ✅ Fixed top-right                           |       |
| Stacking           | ✅ Multiple toasts vertically                |       |
| Auto-dismiss       | ✅ Configurable duration                     |       |
| Global dispatch    | ✅ CustomEvent bridge for out-of-context use |       |

**Issues:**

1. 🟡 **Race condition** — `GlobalToastListener` may not have mounted when event fires. Events can be lost.
2. 🟢 **Toast timer cleanup** — Correctly clears timeout on manual close.

---

### 4.3 Critical UX Issues

#### D-01: GenerationSuccess không collapse được

**Severity:** 🔴 Critical

**Root Cause:** Component fills `min-h-[360px]` in a flex-col layout. When it appears, the form disappears from view entirely. No collapse/expand mechanism.

**Proposed Fix:**

```tsx
const [isCollapsed, setIsCollapsed] = useState(false);

// In card:
// {!isCollapsed ? ( /* full content */ ) : (
//   <button onClick={() => setIsCollapsed(false)} className="w-full...">
//     Tạo giọng nói thành công — {voiceName} (Mở rộng)
//   </button>
// )}
```

#### D-02: Personal Info form không lưu được

**Severity:** 🔴 Critical

**Root Cause:** Form fields are editable but "Lưu thay đổi" only opens `genation.ai` in a new tab. No local state persistence or API call.

**Proposed Fix:** Replace form with read-only display + "Chỉnh sửa tại Genation →" button.

#### D-03: Language selector không có tác dụng

**Severity:** 🔴 Critical

**Root Cause:** `language` state is set but never used. Entire app is hardcoded in Vietnamese.

**Proposed Fix:** Either hide the language selector or implement proper i18n with `next-intl` or `react-i18next`.

#### D-04: "Xóa tài khoản" không có confirm dialog

**Severity:** 🔴 Critical

**Root Cause:** Clicking opens external link immediately without confirmation. Accidental clicks cause irreversible navigation.

**Proposed Fix:** Add in-app confirmation dialog before navigating.

---

### 4.4 Root Cause Analysis

#### Pattern 1: "Decorative UI" — Features That Look Functional But Don't Work

Multiple features in VoiceSettings (personal form, language selector) and GenerationSuccess (no collapse) are built with full UI but missing interaction logic.

**Why:** Built iteratively — UI scaffold created with intent to connect later, but deprioritized.

**Consequence:** Users spend time filling forms or switching language only to find nothing changes. Erodes trust.

**Fix approach:** Either connect to real APIs/local state (high effort) or replace with "read-only + external link" pattern (low effort).

#### Pattern 2: Inconsistent Cross-Feature State

`GenerationSuccess` and `AudioPlayer` both show playback controls but manage state independently.

**Why:** Gapless streaming vs. HTMLAudioElement dual-path architecture creates two independent playback mechanisms.

**Consequence:** User might see inline player paused but footer player playing (or vice versa), especially during streaming.

#### Pattern 3: Missing Confirmation for Irreversible Actions

Delete account, Clear All history, Delete history item — none have in-app confirmations.

**Why:** Priority placed on speed/flow over safety for MVP.

**Consequence:** Accidental deletions possible. "Xóa tài khoản" leads to severe irreversible consequences.

---

### 4.5 Score Summary

| Section            | Score      | Notes                                                          |
| ------------------ | ---------- | -------------------------------------------------------------- |
| Layout & Grid      | 7.5/10     | Good overall, success state pushes content off-screen          |
| Sidebar            | 7/10       | Active state in collapsed mode unclear                         |
| Header             | 8/10       | Minor badge and avatar issues                                  |
| TextInput          | 8.5/10     | Excellent feedback, good accessibility                         |
| VoiceSelection     | 8/10       | Robust dropdown, loading state good                            |
| AudioCustomization | 6.5/10     | Pitch label confusing, no tooltip                              |
| GenerateButton     | 7.5/10     | Good disabled UX, locked voice needs CTA                       |
| GenerationProgress | 8/10       | Tab-switch message is excellent                                |
| GenerationSuccess  | 5/10       | Not collapsible — biggest UX gap                               |
| TipsAndLinks       | 7/10       | Hardcoded, no dismiss option                                   |
| SampleTextChips    | 6/10       | Only Vietnamese, language-agnostic                             |
| VoiceLibrary       | 8/10       | Comprehensive filters, good empty state                        |
| VoiceSettings      | 5/10       | Form not functional, language selector fake, delete no confirm |
| Toast              | 7.5/10     | Solid, minor race condition concern                            |
| **Overall**        | **7.0/10** | Basic functionality good, 3 critical UX issues need fix        |

---

## 5. Priority Implementation Plan

### 5.1 Quick Wins (≤ 2h each)

| Priority    | Task                                                          | Files                                  | Effort |
| ----------- | ------------------------------------------------------------- | -------------------------------------- | ------ |
| 🔴 Critical | Add collapse toggle to GenerationSuccess                      | `MainContent.tsx`                      | 1h     |
| 🔴 Critical | Replace Settings Personal form with read-only + external link | `VoiceSettings.tsx`                    | 30min  |
| 🔴 Critical | Add confirm dialog before "Xóa tài khoản"                     | `VoiceSettings.tsx`                    | 1h     |
| 🔴 Critical | Replace "Gia hạn" with "Nâng cấp" for free users              | `VoiceSettings.tsx`                    | 10min  |
| 🟡 High     | Hide or disable language selector (pending i18n)              | `VoiceSettings.tsx`                    | 10min  |
| 🟡 High     | Add pitch slider helper text ("âm = thấp, dương = cao")       | `MainContent.tsx`, `VoiceSettings.tsx` | 15min  |
| 🟢 Medium   | Add `aria-label` to logo video                                | `Sidebar.tsx`                          | 5min   |
| 🟢 Medium   | Add `aria-current` to sidebar nav buttons                     | `Sidebar.tsx`                          | 5min   |
| 🟢 Medium   | Style "Xóa bộ lọc" as secondary button, not red underline     | `VoiceLibrary.tsx`                     | 10min  |

### 5.2 Medium Effort (1–4h each)

| Priority  | Task                                                               | Files                 | Effort |
| --------- | ------------------------------------------------------------------ | --------------------- | ------ |
| 🟡 High   | Locked voice disabled → show upgrade toast or navigate to /pricing | `MainContent.tsx`     | 2h     |
| 🟡 High   | Extract `getVoiceName` utility (remove duplication)                | New `utils/` file     | 1h     |
| 🟢 Medium | Add sample texts in both Vietnamese and English                    | `MainContent.tsx`     | 2h     |
| 🟢 Medium | Fix Toast race condition: use React context ref                    | `Toast.tsx`           | 2h     |
| 🟢 Medium | Add `default` avatarColor fallback in VoiceCard                    | `VoiceCardShared.tsx` | 30min  |

### 5.3 Future (≥ 8h each)

| Priority  | Task                                                  | Files                                  | Effort |
| --------- | ----------------------------------------------------- | -------------------------------------- | ------ |
| 🟡 High   | Implement i18n (next-intl or react-i18next)           | All components                         | High   |
| 🟡 High   | Real-time preview of pitch/speed changes              | `MainContent.tsx`, `useTtsGenerate.ts` | 4h     |
| 🟢 Medium | Keyboard navigation for entire dashboard              | All interactive components             | High   |
| 🟢 Medium | Voice preview waveform reflecting actual audio levels | `MainContent.tsx`, `AudioPlayer.tsx`   | High   |
| 🟢 Medium | Connect Personal Settings form to real API            | `VoiceSettings.tsx`, backend           | High   |

---

## 6. Files Reference

### Agents

| Agent         | File                              |
| ------------- | --------------------------------- |
| Code Reviewer | `.cursor/agents/code-reviewer.md` |
| Debugger      | `.cursor/agents/debugger.md`      |
| Spec Writer   | `.cursor/agents/spec-writer.md`   |

### Skills

| Skill                          | File                                                                 |
| ------------------------------ | -------------------------------------------------------------------- |
| Systematic Debugging           | `.cursor/skills/superpowers/systematic-debugging/SKILL.md`           |
| Verification Before Completion | `.cursor/skills/superpowers/verification-before-completion/SKILL.md` |
| Test-Driven Development        | `.cursor/skills/superpowers/test-driven-development/SKILL.md`        |
| Writing Skills                 | `.cursor/skills/superpowers/writing-skills/SKILL.md`                 |
| Writing Plans                  | `.cursor/skills/superpowers/writing-plans/SKILL.md`                  |
| Subagent-Driven Development    | `.cursor/skills/superpowers/subagent-driven-development/SKILL.md`    |
| UI UX Pro Max                  | `.cursor/skills/ui-ux-pro-max/SKILL.md`                              |

### Rules

| Rule                | File                                    |
| ------------------- | --------------------------------------- |
| Security Guidelines | `.cursor/rules/security-guidelines.mdc` |
| Coding Standards    | `.cursor/rules/coding-standards.mdc`    |
| SDLC Workflow       | `.cursor/rules/sdlc-workflow.mdc`       |
| Project Overview    | `.cursor/rules/project-overview.mdc`    |

### Dashboard Components

| Component         | File                                            | Lines |
| ----------------- | ----------------------------------------------- | ----- |
| Main Page         | `src/app/(main)/page.tsx`                       | 172   |
| Main Content      | `src/components/tts/MainContent.tsx`            | 1181  |
| Sidebar           | `src/components/layout/Sidebar.tsx`             | 257   |
| Header            | `src/components/layout/Header.tsx`              | 273   |
| Voice Library     | `src/components/tts/VoiceLibrary.tsx`           | 267   |
| Voice Card Shared | `src/components/tts/VoiceCardShared.tsx`        | ~250  |
| Voice Settings    | `src/features/tts/components/VoiceSettings.tsx` | 594   |
| History Panel     | `src/features/tts/components/HistoryPanel.tsx`  | ~230  |
| Audio Player      | `src/components/tts/AudioPlayer.tsx`            | ~490  |
| Toast             | `src/components/ui/Toast.tsx`                   | ~175  |
| TTS Context       | `src/features/tts/context/TtsContext.tsx`       | ~60   |

### Related Specifications

| Spec               | Location                                               |
| ------------------ | ------------------------------------------------------ |
| Audio Debug        | `.sdlc/specs/REQ-AUDIO-DEBUG/SPEC.md`                  |
| Playback Controls  | `.sdlc/specs/REQ-003-playback-controls/SPEC.md`        |
| Streaming Audio    | `.sdlc/specs/REQ-014-streaming-audio-playback/SPEC.md` |
| Generation History | `.sdlc/specs/REQ-004-generation-history/SPEC.md`       |
| IndexedDB History  | `.sdlc/specs/REQ-010-indexeddb-history/SPEC.md`        |

---

## Appendix: Key Patterns Quick Reference

### State Management

```tsx
// Local state
const [value, setValue] = useState(initial);

// Feature state (Zustand + persist)
export const useFeatureStore = create<FeatureState>()(
  persist((set) => ({ ... }), { name: 'feature-settings' })
);

// Session (Zustand, memory only)
export const useSessionStore = create<SessionState>()((set) => ({ ... }));
```

### Error Handling

```tsx
// Always wrap async operations
try {
  const result = await riskyOperation();
  return { success: true, data: result };
} catch (error) {
  logger.error("Operation failed:", error);
  return { success: false, error: error.message };
}
```

### Accessibility

```tsx
// Always include:
<button aria-label="Action description" />
<textarea aria-label="Input description" />
<div role="alert">{errorMessage}</div>

// Keyboard nav
onKeyDown={(e) => {
  if (e.key === 'Enter' || e.key === ' ') {
    e.preventDefault();
    handleAction();
  }
}}
```

### Performance

```tsx
// Memoize expensive computations
const processedData = useMemo(() => expensiveTransform(rawData), [rawData]);

// Callback stability
const stableHandler = useCallback(
  (data: Data) => doSomething(data),
  [dependency],
);

// Lazy load heavy components
const HeavyComponent = lazy(() => import("./HeavyComponent"));
```
