# Coding Conventions - TTS App (Next.js)

> **Important**: Follow these conventions when writing code for TTS Project.

---

## 🎯 General Principles

1. **Vertical Slice Architecture**: Group code by feature, not by type
2. **Client-side First**: Most logic runs in browser (TTS processing)
3. **TypeScript Strict**: No `any` without justification
4. **Component Isolation**: Each component owns its state

---

## 📁 File Naming

| Type       | Pattern            | Example                 |
| ---------- | ------------------ | ----------------------- |
| Components | `{name}.tsx`       | `TtsPlayer.tsx`         |
| Hooks      | `use{name}.ts`     | `useTtsGenerate.ts`     |
| Services   | `{name}.ts`        | `piperTts.ts`           |
| Types      | `types.ts`         | `features/tts/types.ts` |
| Utils      | `{name}.ts`        | `text-cleaner.ts`       |
| Workers    | `{name}.worker.ts` | `tts.worker.ts`         |

---

## 🏗️ Component Structure

### Feature Component (Recommended)

```tsx
// src/features/tts/components/TtsGenerator.tsx
import { useCallback, useState } from "react";
import { useTtsGenerate } from "../hooks/useTtsGenerate";
import type { TtsRequest, TtsResponse } from "../types";

interface TtsGeneratorProps {
  defaultModel?: string;
  onComplete?: (audio: Blob) => void;
}

export function TtsGenerator({ defaultModel, onComplete }: TtsGeneratorProps) {
  const [text, setText] = useState("");
  const { generate, isGenerating, progress } = useTtsGenerate();

  const handleGenerate = useCallback(async () => {
    const result = await generate({ text, model: defaultModel });
    onComplete?.(result.audio);
  }, [text, defaultModel, generate, onComplete]);

  return (
    <div>
      <textarea value={text} onChange={(e) => setText(e.target.value)} />
      <button onClick={handleGenerate} disabled={isGenerating}>
        {isGenerating ? `Generating... ${progress}%` : "Generate"}
      </button>
    </div>
  );
}
```

### Hook Pattern

```tsx
// src/features/tts/hooks/useTtsGenerate.ts
import { useCallback, useState } from "react";
import type { TtsRequest, TtsResponse } from "../types";

export function useTtsGenerate() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);

  const generate = useCallback(
    async (req: TtsRequest): Promise<TtsResponse> => {
      setIsGenerating(true);
      setProgress(0);

      try {
        // Implementation
        return { audio: new Blob(), duration: 0 };
      } finally {
        setIsGenerating(false);
      }
    },
    [],
  );

  return { generate, isGenerating, progress };
}
```

---

## 🎨 Styling (Tailwind CSS)

### Use clsx for Conditional Classes

```tsx
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: (string | boolean | undefined)[]) {
  return twMerge(clsx(inputs));
}

// Usage
<div
  className={cn(
    "p-4 rounded-lg",
    isActive && "bg-blue-500",
    isDisabled && "opacity-50",
  )}
/>;
```

### Responsive Design

```tsx
// Mobile-first approach
<div className="flex flex-col sm:flex-row gap-2">
  <input className="w-full sm:w-auto flex-1" />
  <button className="w-full sm:w-auto">Generate</button>
</div>
```

---

## 🔧 State Management

### Local State (Default)

```tsx
const [value, setValue] = useState(initial);
```

### Feature State (Zustand)

```tsx
// stores/tts-store.ts
import { create } from "zustand";

interface TtsStore {
  model: string;
  voice: string;
  speed: number;
  setModel: (model: string) => void;
  setVoice: (voice: string) => void;
  setSpeed: (speed: number) => void;
}

export const useTtsStore = create<TtsStore>((set) => ({
  model: "calmwoman3688",
  voice: "default",
  speed: 1.0,
  setModel: (model) => set({ model }),
  setVoice: (voice) => set({ voice }),
  setSpeed: (speed) => set({ speed }),
}));
```

### Context (Auth/Session)

```tsx
// context/auth-context.tsx
'use client';

import { createContext, useContext, type ReactNode } from 'react';

interface User {
  id: string;
  email: string;
}

interface AuthContext {
  user: User | null;
  login: () => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContext | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  // Implementation
  return <AuthContext.Provider value={...}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
```

---

## 📡 API Routes (Cloudflare Pages)

### Model Discovery API

```ts
// app/api/models/ts GET
import { R2 } from "@cloudflare/workers-types";

export async function GET() {
  const r2 = process.env.R2_BUCKET as unknown as R2;
  const objects = await r2.list({ prefix: "piper/vi/" });

  const models = objects.objects.map((obj) => ({
    name: obj.key.replace("piper/vi/", "").replace(".onnx", ""),
    size: obj.size,
    uploaded: obj.uploaded,
  }));

  return Response.json({ models });
}
```

---

## 🧪 Testing

### Component Test (Vitest + Testing Library)

```tsx
import { fireEvent, render, screen } from "@testing-library/react";
import { TtsGenerator } from "./TtsGenerator";

describe("TtsGenerator", () => {
  it("should render textarea and button", () => {
    render(<TtsGenerator />);
    expect(screen.getByRole("textbox")).toBeInTheDocument();
    expect(screen.getByRole("button")).toBeInTheDocument();
  });

  it("should call onComplete when generation done", async () => {
    const onComplete = vi.fn();
    render(<TtsGenerator onComplete={onComplete} />);

    fireEvent.click(screen.getByRole("button"));
    // Wait for async...
    expect(onComplete).toHaveBeenCalled();
  });
});
```

---

## 📦 Import Organization

```tsx
// 1. React/Next imports
import { useCallback, useState } from "react";
import Link from "next/link";

// 2. External libraries
import { clsx } from "clsx";
import { useDebounce } from "use-debounce";

// 3. Internal shared
import { Button } from "@/components/ui/button";
import { useToast } from "@/lib/hooks/use-toast";

// 4. Feature imports (absolute)
import { useTtsGenerate } from "@features/tts/hooks/useTtsGenerate";
import type { TtsRequest } from "@features/tts/types";

// 5. Relative (within same feature)
import { formatDuration } from "../utils/format";
```

---

## 🔗 Quick Reference

| Need             | Pattern                                   |
| ---------------- | ----------------------------------------- |
| New feature      | Create in `src/features/{feature}/`       |
| Shared component | Create in `src/components/ui/`            |
| Hook             | Create in `src/features/{feature}/hooks/` |
| Utils            | Create in `src/lib/{domain}/`             |
| API route        | Create in `src/app/api/{endpoint}/`       |

---

_Last updated: 2026-03-05_
