# TTS App - Text-to-Speech Vietnamese

> Dự án: Xây dựng ứng dụng Text-to-Speech chạy hoàn toàn trên browser, hỗ trợ
> tiếng Việt.

---

## 🎯 Tổng quan

### Đây là dự án gì?

**TTS App** là ứng dụng web giúp chuyển văn bản thành giọng nói
(Text-to-Speech), tập trung vào tiếng Việt. Điểm đặc biệt:

- **Chạy trên browser**: Không cần cài đặt, không cần server mạnh
- **Miễn phí hosting**: Dùng Cloudflare Pages (free tier)
- **Nhanh và riêng tư**: Xử lý ngay trên máy user, text không gửi ra ngoài

### Mục tiêu

| Giai đoạn   | Mục tiêu                               |
| ----------- | -------------------------------------- |
| **MVP**     | Demo TTS cơ bản trong 1 tuần           |
| **Success** | Đo lường user interest                 |
| **Vision**  | Flagship app trên Genation marketplace |

### Ai sẽ dùng?

- Content creators (YouTube, TikTok, Podcast)
- Marketers cần voiceover nhanh
- SMEs Việt Nam cần giải pháp TTS tiếng Việt

---

## 🚀 Bắt đầu

### 1. Clone và chạy

```bash
git clone git@github.com:Laristo-LTD/app-gen-voice-ai.git
cd app-gen-voice-ai
npm install
```

**Chạy local cần cấu hình R2 (tránh lỗi 503):**

- File `.env.local` **không** nằm trong repo (gitignore). Người clone cần tự tạo.
- Copy `.env.example` thành `.env.local`, sửa `R2_PUBLIC_URL` thành Public URL thật của bucket R2 (Cloudflare Dashboard → R2 → genvoice-models → Settings → Public access).
- **Lưu `.env.local` bằng encoding UTF-8** (trên Windows: Notepad → Save As → Encoding: UTF-8). Nếu lưu UTF-16 có thể gây 503 do parse lỗi.
- Sau đó chạy `npm run dev`.

### 2. Hiểu cách hoạt động

```
User nhập text → Browser xử lý → Audio phát ra
```

**Điểm quan trọng**: Tất cả xử lý TTS xảy ra trong browser của user. Không cần
server inference.

### 3. Làm quen với codebase

```
src/
├── app/           # Next.js pages
├── features/      # Code theo từng feature (TTS, History, Settings)
├── components/   # UI components dùng chung
└── lib/          # Tiện ích (xử lý text, lưu trữ)
```

---

## 📐 Cách làm việc

### Quy trình (Spec-Driven Development)

```
1. Viết spec cùng Agent
2. Đọc Spec   → Hiểu yêu cầu
3. Implement  → Viết code theo spec
4. Verify     → Chạy test, build
5. Review     → Self review và tạo PR
6. PR Review  → Mentor review
7. Merge      → Merge PR
```

### Nhận task

- Task được chia nhỏ thành từng **Bolt** (feature nhỏ)
- Xem danh sách Bolt trong `.sdlc/specs/`

### Khi cần hỗ trợ

- **AI Agent**: Dùng để generate code, giải thích code
- **AI Ask Model**: Dùng để hỏi khi bí blocker quá 15 phút

---

## 📝 Quy ước Git

### Commit Message Format

```
<type>(<scope>): <mô tả ngắn>

[optional body]
```

#### Types

| Type       | Dùng cho                          |
| ---------- | --------------------------------- |
| `feat`     | Feature mới                       |
| `fix`      | Bug fix                           |
| `docs`     | Thay đổi documentation            |
| `style`    | Format code, không thay đổi logic |
| `refactor` | Refactor code                     |
| `test`     | Thêm/sửa tests                    |
| `chore`    | Cập nhật dependencies, config     |

#### Ví dụ

```bash
# Feature mới
git commit -m "feat(tts): add text input component"

# Fix bug
git commit -m "fix(audio): fix audio playback not starting"

# Documentation
git commit -m "docs: update README with setup steps"
```

### Branch Naming

```
main: production branch
staging: staging branch before merge to main
devs/xxx-feature-name: feature branch for development
```

---

## ✅ Khi nào xong?

Mỗi Bolt cần hoàn thành:

- [ ] Code chạy được
- [ ] Build không lỗi
- [ ] Tests pass
- [ ] Mentor review và approve

---

## 📚 Tài liệu tham khảo

### Đọc trước khi bắt đầu

| File                              | Nội dung               |
| --------------------------------- | ---------------------- |
| `.sdlc/AGENTS.md`                 | Hướng dẫn cho AI agent |
| `.sdlc/context/conventions.md`    | Coding conventions     |
| `.sdlc/templates/feature-spec.md` | Cách viết spec         |

### Link bên ngoài

| Resource            | Link                                    |
| ------------------- | --------------------------------------- |
| nghists (reference) | https://github.com/nghimestudio/nghists |
| Piper TTS           | https://github.com/rhasspy/piper        |
| Next.js             | https://nextjs.org/docs                 |

---

## ⚠️ Lưu ý

- **Chưa cần login**: Auth module sẽ thêm sau
- **MVP = TTS only**: Không có ASR (speech-to-text)
- **Focus**: Ship nhanh, validate user interest trước

---

_Last updated: 2026-03-05_
