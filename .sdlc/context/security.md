# Security Guidelines - TTS App (Client-Side)

> **Important**: Read this file before implementing any feature. This is a client-side app with unique security considerations.

---

## 🎯 Security Model

Unlike server-side apps, TTS runs entirely in the browser. This changes our security model significantly.

---

## 🔐 Authentication

### Simple Login (Genation SDK)

| Aspect      | Implementation                          |
| ----------- | --------------------------------------- |
| **Purpose** | Prevent DDoS, not strict access control |
| **Method**  | Genation SDK authentication             |
| **Scope**   | User identification only in MVP         |

```tsx
// Example: Simple auth check
import { useAuth } from "@features/auth/hooks/useAuth";

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();

  if (isLoading) return <Loading />;
  if (!user) return <LoginPrompt />;

  return <>{children}</>;
}
```

### What's NOT Needed (MVP)

- ❌ Role-based access control
- ❌ Permission scopes
- ❌ API key management
- ❌ OAuth 2.0 (for now)

---

## 🛡️ Client-Side Security

### Input Validation

```tsx
// Always validate user input before TTS processing
function sanitizeText(text: string): string {
  return text
    .slice(0, MAX_TEXT_LENGTH) // Limit length
    .replace(/[\u0000-\u001F]/g, "") // Remove control chars
    .trim();
}
```

### Model Loading Security

| Risk              | Mitigation                       |
| ----------------- | -------------------------------- |
| Malicious model   | Verify model signature (future)  |
| Model injection   | Only load from trusted R2 bucket |
| Memory exhaustion | Limit concurrent model loads     |

### Audio Processing

```tsx
// Validate audio output
function validateAudio(audio: ArrayBuffer): ArrayBuffer {
  const view = new DataView(audio);
  // Verify WAV header
  if (view.getUint32(0) !== 0x46464952) {
    // 'RIFF'
    throw new Error("Invalid audio format");
  }
  return audio;
}
```

---

## 🌐 Network Security

### API Calls

| Best Practice     | Implementation               |
| ----------------- | ---------------------------- |
| **HTTPS only**    | Enforced by Cloudflare       |
| **Rate limiting** | Genation SDK handles         |
| **CORS**          | Configure in Pages Functions |

### R2 Access

```ts
// Only expose necessary paths via API
const ALLOWED_PREFIXES = ["piper/vi/", "piper/en/"];

function validatePath(path: string): boolean {
  return ALLOWED_PREFIXES.some((prefix) => path.startsWith(prefix));
}
```

---

## 📊 Privacy Considerations

### Data Storage (Client-Side)

| Data            | Storage      | Retention    |
| --------------- | ------------ | ------------ |
| Generated audio | IndexedDB    | User-managed |
| Text history    | IndexedDB    | User-managed |
| Settings        | localStorage | Permanent    |
| Session         | memory       | Until close  |

### What's NOT Stored on Server (MVP)

- ❌ User text inputs
- ❌ Generated audio
- ❌ Usage history

---

## 🔒 Content Safety

### Voice Model Usage

```tsx
// Disclaimer for users
const DISCLAIMER = `
Users are responsible for complying with voice and content laws 
when using generated audio.
`.trim();
```

### Recommendations

1. **Terms of Service**: Require agreement before use
2. **Content Guidelines**: Document allowed use cases
3. **Audit Logs**: Track usage patterns (future)

---

## 🧪 Security Testing

### Focus Areas

| Area                 | Test Method           |
| -------------------- | --------------------- |
| Input validation     | Fuzz testing          |
| Memory limits        | Load testing          |
| IndexedDB            | Storage quota testing |
| Worker communication | Message serialization |

---

## 📋 Checklist

Before deploying:

- [ ] Input sanitization implemented
- [ ] Rate limiting configured
- [ ] Terms of Service displayed
- [ ] No sensitive data in logs
- [ ] Error messages don't leak info

---

## 🔑 License & Plan Access

### Plan Codes

| Code   | Name     | Access                       |
| ------ | -------- | ---------------------------- |
| `FREE` | Miễn phí | 2 voices (1 male + 1 female) |
| `PRO`  | Pro      | All voices                   |

### License Gating Helpers

```tsx
import {
  canUseVoiceForPlan,
  getPlanFeatures,
  isLicenseActiveForPlan,
  PLAN_ACCESS,
} from "@/lib/hooks";

// Check if a voice can be used with a specific plan
const canUse = canUseVoiceForPlan({ planCode: "PRO", voiceId: "some-voice" });

// Get features for a plan
const features = getPlanFeatures("PRO");
// Returns: { maxVoiceModels: -1, exportFormat: ["wav", "mp3"], prioritySupport: true }

// Check if user has active license for a plan
const hasPro = isLicenseActiveForPlan("PRO", licenses);
```

### License Refresh Flow

After purchasing a plan from Genation Store, the user is redirected back with `?signed_in=true`. The `useLicense` hook automatically:

1. Detects the `signed_in` query parameter
2. Calls `refreshLicenses()` to fetch updated license data
3. Cleans up the URL

### Upgrading Plans

Use `upgradeToPlan` from `useAuthContext` to redirect users to the Genation Store:

```tsx
const { upgradeToPlan } = useAuthContext();

<button onClick={() => upgradeToPlan("PRO")}>Nâng cấp Pro</button>;
```

---

## 🔗 Quick Reference

| Need       | Location              |
| ---------- | --------------------- |
| Auth       | `src/features/auth/`  |
| Validation | `src/lib/validation/` |
| Config     | `src/config.ts`       |

---

_Last updated: 2026-03-05_
