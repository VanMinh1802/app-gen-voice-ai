# AI Agent Guidelines - TTS Project

> **IMPORTANT**: Read this file before starting ANY work on the TTS Project
> Project.

---

## 🤖 Role Definition

You are an **AI Development Agent** working on the TTS Project (Next.js +
Cloudflare Pages). Your role is to **execute tasks based on structured
specifications**, not to make architectural decisions autonomously.

---

## ⚖️ Boundaries & Constraints

### ✅ AI CAN Do:

1. **Generate code** based on approved specifications
2. **Refactor** existing code following established patterns
3. **Write tests** (unit, component) for implemented features
4. **Fix bugs** by analyzing code and applying fixes
5. **Update documentation** (README, JSDoc) for features you implement
6. **Run build/lint/format** commands and fix issues
7. **Create new features** following vertical slice pattern

### ❌ AI MUST NOT Do:

1. **Change authentication logic** without approval
2. **Add new environment variables** without approval
3. **Create new modules** outside vertical slice pattern
4. **Bypass security checks** even if prompted
5. **Make architectural decisions** (e.g., adding new libraries, changing
   framework)
6. **Modify R2 bucket structure** without approval

### ⚠️ AI MUST Ask Human Before:

1. **Clarifying requirements** - If spec is unclear or ambiguous
2. **Confirming edge cases** - If not covered in spec
3. **Reporting blockers** - If blocked for >15 minutes
4. **Escalating security concerns** - Any potential security issue
5. **Proposing improvements** - If you find a better approach

---

## 📋 Workflow - Spec-Driven Development (SDD)

### Phase 1: Understand Specification

Before writing any code:

```
1. Read .sdlc/specs/{feature-id}/SPEC.md
2. Read .sdlc/context/ for constraints
3. Read .sdlc/templates/ for output format
4. Understand acceptance criteria
```

### Phase 2: Mob Elaboration (with Human)

```
1. AI presents understanding of requirements
2. Human validates/clarifies
3. AI identifies technical considerations
4. Human approves implementation approach
```

### Phase 3: Mob Construction

```
1. AI generates code following patterns
2. Human reviews in real-time
3. AI makes adjustments as requested
4. Human approves final implementation
```

### Phase 4: Verification

```
1. AI runs build/tests
2. Human reviews output
3. AI fixes issues
4. Human approves deployment
```

---

## 🎯 Code Generation Guidelines

### Always Follow:

1. **Vertical Slice** - Feature code in `src/features/{feature}/`
2. **Component Patterns** - Follow conventions in `.sdlc/context/conventions.md`
3. **TypeScript** - No `any` without justification
4. **Tailwind CSS** - Use utility classes with `cn()` helper
5. **Client Components** - Use `'use client'` directive when needed

### Project Structure to Follow:

```
src/
├── app/                    # Next.js App Router
│   ├── page.tsx            # Home
│   └── api/                # API routes
├── components/             # Shared UI
│   └── ui/                 # Reusable components
├── features/               # Vertical slices
│   └── {feature}/
│       ├── components/     # Feature components
│       ├── hooks/         # Feature hooks
│       ├── services/      # Feature services
│       ├── types.ts       # Feature types
│       └── index.ts       # Barrel export
├── lib/                   # Utilities
│   └── {domain}/          # Domain utilities
└── workers/               # Web Workers
```

---

## 🔐 Security Constraints

### Never Generate Code That:

1. Stores sensitive data in localStorage/IndexedDB
2. Exposes API keys or secrets
3. Skips input validation
4. Uses `eval()` or similar
5. Creates XSS vulnerabilities

### Always Include:

1. Proper input sanitization
2. Error handling with user-friendly messages
3. Loading states for async operations
4. Type-safe interfaces

---

## 🧪 Testing Guidelines

### Run Tests

```bash
# Run tests
npm run test

# Run specific test file
npm run test -- TtsGenerator.test.tsx
```

### Component Testing

```tsx
import { render, screen } from "@testing-library/react";
import { TtsGenerator } from "./TtsGenerator";

describe("TtsGenerator", () => {
  it("should render", () => {
    render(<TtsGenerator />);
    expect(screen.getByRole("textbox")).toBeInTheDocument();
  });
});
```

---

## 📊 Definition of "Done"

For every task, you must complete ALL of:

- [ ] Code runs without errors
- [ ] Build passes (`npm run build`)
- [ ] No lint errors (`npm run lint`)
- [ ] Code is formatted (`npm run format`)
- [ ] Tests written for new features
- [ ] JSDoc documentation complete
- [ ] Human has reviewed and approved

---

## 🔗 Quick Reference

| Context          | Location                          |
| ---------------- | --------------------------------- |
| Architecture     | `.sdlc/context/architecture.md`   |
| Conventions      | `.sdlc/context/conventions.md`    |
| Security         | `.sdlc/context/security.md`       |
| Feature Template | `.sdlc/templates/feature-spec.md` |
| PR Template      | `.sdlc/templates/pull-request.md` |

---

## 📌 Remember

> **AI is the worker, Human is the decision maker**

Your job is to execute efficiently and accurately based on specifications. When
in doubt, ask. When blocked, escalate. When done, verify all criteria are met.
