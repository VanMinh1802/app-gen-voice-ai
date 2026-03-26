# SDLC Builder Skill (TTS Project)

> This skill helps AI agents create feature specifications for the TTS Project
> Project following the Spec-Driven Development (SDD) methodology.

---

## ðŸŽ¯ Purpose

This skill enables the AI agent to:

1. **Create structured feature specifications** following the SDLC framework
2. **Run effective brainstorming sessions** with human stakeholders
3. **Maintain consistency** across all feature specs
4. **Follow the SDLC workflow** (Discovery, Mob Elaboration, Refinement, Implementation)

---

## ðŸ“‹ When to Use This Skill

Use this skill when:

- âœ… Creating a **new feature** (TTS generation, model loading, audio playback)
- âœ… Adding **significant functionality** to existing feature
- âœ… Creating a **bug fix** that requires architectural changes
- âœ… Planning **refactoring** that affects multiple modules
- âœ… Designing **API changes** or new integrations

**Do NOT use** for:

- âŒ Small bug fixes (just fix directly)
- âŒ Documentation updates only
- âŒ Minor UI/text changes
- âŒ Adding comments or JSDoc

---

## ðŸ”„ SDLC Workflow

### Step 1: Understand Context

Before creating any spec, always:

\\\
1. Read .cursor/rules/sdlc-workflow.mdc â€” understand SDLC phases
2. Read .sdlc/context/architecture.md â€” understand TTS system architecture
3. Read .sdlc/context/conventions.md â€” understand Next.js + vertical slice patterns
4. Read .sdlc/context/security.md â€” understand client-side security requirements
\\\

> **Note:** The AI Agent Boundaries section is in \.cursor/rules/sdlc-workflow.mdc\
> (look for the "AI Agent Boundaries" heading), not in a separate \.sdlc/AGENTS.md\ file.

### Step 2: Create Spec Structure

Create the following folder structure for each new feature:

\\\
.sdlc/specs/REQ-XXX-{feature-name}/
â”œâ”€â”€ SPEC.md                    # Main specification document
â”œâ”€â”€ decisions/
â”‚   â””â”€â”€ ADR-001-{topic}.md    # Architecture Decision Records
â””â”€â”€ notes/
    â””â”€â”€ meeting-001-{topic}.md # Meeting notes & brainstorming
\\\

### Step 3: Fill Template

Use \.sdlc/templates/feature-spec.md\ as the base template. Required sections:

1. **Metadata** - Feature ID, name, status, priority, owner
2. **Mermaid Data Flow** - **REQUIRED** - Quick visual flow at the top of spec
3. **Overview** - Problem statement, goals, non-goals
4. **User Stories** - At least 2-3 stories with acceptance criteria
5. **Technical Design** - Component structure, state management, API design
6. **Flow Diagrams** - Main flow, error flow
7. **Edge Cases** - At least 5 common edge cases
8. **Security** - Input validation, model loading, content safety
9. **Testing Strategy** - Component tests, integration tests
10. **Dependencies** - Internal and external

---

## ðŸ”€ Mermaid Chart Requirement

### Why Mermaid?

- **Human can understand instantly** - No need to read through all details
- **Quick context** - See the big picture before diving in
- **Visual validation** - Easier to spot missing steps or wrong flows

### Required Mermaid Elements

Every spec MUST include a Mermaid flowchart at the TOP (after Metadata section).
Use the client-side TTS flow pattern:

\\\mermaid
flowchart TD
    subgraph Browser["ðŸ‘¤ Browser"]
        User["User"]
        UI["UI Component"]
        Hook["Custom Hook"]
        Worker["Web Worker"]
        ONNX["ONNX Runtime"]
    end

    subgraph Storage["ðŸŸ¢ Storage"]
        IDB["IndexedDB"]
        LS["localStorage"]
    end

    subgraph Cloudflare["ðŸ”µ Cloudflare"]
        CF_API["Pages Functions"]
        R2["R2 Bucket (Models)"]
    end

    User -->|1. Input text| UI
    UI -->|2. Call hook| Hook
    Hook -->|3. Send to worker| Worker
    Worker -->|4. Load model| R2
    R2 -->|5. Model data| Worker
    Worker -->|6. Process| ONNX
    ONNX -->|7. Audio chunks| Worker
    Worker -->|8. Stream chunks| Hook
    Hook -->|9. Update state| UI
    UI -->|10. Play audio| User
\\\

### Styling Legend

| Box Color | Meaning |
| --------- | ---------------------------------------------- |
| Blue | Actor/Client/External |
| Purple | Internal Layer (Component/Hook/Service/Worker) |
| Green | Storage (IndexedDB/localStorage/R2) |
| Red | Error/Exception |

### When Adding Mermaid

- âœ… Add AFTER Metadata section
- âœ… Include all actors in the flow (User â†’ UI â†’ Worker â†’ ONNX â†’ R2)
- âœ… Show data flow direction
- âœ… Include external integrations if any (Cloudflare R2, Genation SDK)
- âœ… Add legend explaining box colors

---

## ðŸ’¡ Brainstorming Guide

### Before Brainstorming

**Agent must prepare:**

- [ ] Draft SPEC.md with all known information
- [ ] List specific questions needing human input
- [ ] Identify areas with ambiguity
- [ ] Prepare comparison options if needed

### Brainstorming Format

**Start with this template:**

\\\
## ðŸŽ¯ Brainstorming Session: {Feature Name}

### Context
[Brief description of what we're building and why]

### AI's Current Understanding
1. [What I understand about the feature]
2. [What I understand about the technical requirements]

### Questions for Human

#### Question 1: [Specific question]
- Context: [Why this is important]
- Options considered: [If any]
- Need: [What specifically I need to know]

#### Question 2: [Specific question]
...

### Technical Considerations

| Aspect | My Suggestion | Need Validation |
|--------|--------------|-----------------|
| [Aspect 1] | [Suggestion] | [Yes/No] |
| [Aspect 2] | [Suggestion] | [Yes/No] |

### Next Steps (after human responds)
- [ ] Update SPEC.md with decisions
- [ ] Validate technical approach
- [ ] Proceed to implementation
\\\

### During Brainstorming

**AI should:**

- âœ… Ask **specific, focused questions** (not vague)
- âœ… Provide **options** when appropriate
- âœ… **Listen actively** to human responses
- âœ… **Summarize** key decisions made
- âœ… **Confirm understanding** before proceeding

**AI should NOT:**

- âŒ Ask too many questions at once (limit to 5-7)
- âŒ Ask questions already answered in docs
- âŒ Make assumptions without validation
- âŒ Push for implementation before alignment

### After Brainstorming

**AI must:**

1. Update SPEC.md with all decisions
2. Create ADR if significant architectural decision was made
3. Document meeting notes
4. Confirm next steps with human

---

## ðŸ“ Spec Quality Checklist

Before marking spec as "Ready for Implementation", verify:

- [ ] **Feature ID** assigned (REQ-XXX format)
- [ ] **Mermaid Data Flow** included at top (after Metadata)
- [ ] **Problem Statement** clear and specific
- [ ] **Goals** measurable and achievable
- [ ] **User Stories** have clear acceptance criteria (checkboxes)
- [ ] **Component Structure** defined (features/{feature}/)
- [ ] **State Management** documented
- [ ] **API Design** defined (if needed)
- [ ] **Flow Diagrams** included
- [ ] **Edge Cases** cover at least 5 scenarios
- [ ] **Security** considerations addressed
- [ ] **Testing Strategy** defined
- [ ] **Dependencies** documented
- [ ] **Definition of Done** clear

---

## ðŸ”— Quick Reference

| Need | Go To |
| ---------------- | --------------------------------- |
| Feature template | \.sdlc/templates/feature-spec.md\ |
| PR template | \.sdlc/templates/pull-request.md\ |
| Architecture | \.sdlc/context/architecture.md\ |
| Conventions | \.sdlc/context/conventions.md\ |
| Security | \.sdlc/context/security.md\ |
| AI Agent Boundaries | \.cursor/rules/sdlc-workflow.mdc\ |

---

## ðŸš€ Starting a New Feature

When human asks to create a new feature, follow this workflow:

### Phase 1: Discovery (Agent does alone)

\\\
1. Understand the feature request from human
2. Explore codebase for similar features
3. Read relevant context docs
4. Create initial SPEC.md draft
5. Identify gaps and questions
\\\

### Phase 2: Mob Elaboration (with Human)

\\\
1. Present initial understanding to human
2. Ask clarifying questions
3. Discuss technical approach
4. Validate assumptions
5. Document decisions
\\\

### Phase 3: Refinement (Agent does alone)

\\\
1. Update SPEC.md with all decisions
2. Create necessary ADRs
3. Prepare implementation plan
4. Present final spec to human for approval
\\\

### Phase 4: Implementation (after approval)

\\\
1. Human approves SPEC.md
2. Agent proceeds with implementation
3. Follow conventions in .sdlc/context/
4. Write tests alongside code
5. Create PR with all required info
\\\

---

## ðŸ“Œ Remember

> **Spec first, code second** - A well-written spec prevents costly rewrites

> **Ask, don't assume** - When in doubt, clarify with human

> **Follow the format** - Consistency makes specs searchable and maintainable

> **Client-side first** - This is a browser-based TTS app, not server-side