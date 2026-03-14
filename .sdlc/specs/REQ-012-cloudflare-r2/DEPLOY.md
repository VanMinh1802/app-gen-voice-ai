# Hướng dẫn Deploy TTS App lên Cloudflare Pages

Hướng dẫn từng bước deploy app Next.js lên Cloudflare Pages và cấu hình R2 (bucket `genvoice-models`).

---

## Từ trang Account home (trang tổng quan Cloudflare)

1. Trên **Account home**, tìm card **"Workers and Pages"** (Build and scale apps globally).
2. Bấm **"Start building"** (hoặc bấm vào card).
3. Tiếp tục từ **Bước 2** bên dưới.

Hoặc dùng menu trái: **Build** → **Workers and Pages** → **Create application** → **Pages**.

---

## Bước 1: Đẩy code lên GitHub (nếu chưa có)

1. Tạo repository trên GitHub (nếu chưa có).
2. Trong thư mục project, chạy:

```bash
git remote add origin https://github.com/<username>/<repo>.git
git push -u origin main
```

---

## Bước 2: Vào Cloudflare Pages

1. Trên **Account home** (trang anh/chị đang mở), bấm **"Workers and Pages"** (card "Build and scale apps globally").
2. Hoặc menu bên trái: **Build** → **Workers and Pages**.
3. Trong tab **Overview**, bấm **"Create application"** → chọn **"Pages"**.
4. Chọn **"Connect to Git"**.

---

## Bước 3: Kết nối GitHub

1. Chọn **GitHub** làm nhà cung cấp.
2. Nếu lần đầu: bấm **"Connect GitHub"** và authorize Cloudflare (chọn account/org, cho phép truy cập repo).
3. Chọn **repository** chứa project (`app-gen-voice-ai` hoặc tên repo của anh/chị).
4. Bấm **"Begin setup"**.

---

## Bước 4: Cấu hình Build

Điền form **Create a project**:

| Trường | Giá trị |
|--------|--------|
| **Project name** | `vietvoice-ai` (hoặc tên khác) |
| **Production branch** | `main` |
| **Framework preset** | **Next.js** (nếu có trong danh sách) hoặc **None** |
| **Build command** | `npm run build` |
| **Build output directory** | `.next` |
| **Root directory** | Để trống (nếu repo là project gốc) |

**Nếu có preset Next.js:** chọn **Next.js**, Cloudflare sẽ điền sẵn; kiểm tra **Build output directory** là `.next`.

**Nếu chọn None:** tự điền **Build command** = `npm run build`, **Build output directory** = `.next`.

Sau đó bấm **"Save and Deploy"**. Lần build đầu có thể fail nếu thiếu cấu hình; làm tiếp Bước 5–6 rồi **Deployments** → **Retry deployment**.

---

## Bước 5: Cấu hình R2 binding (quan trọng)

Để API `/api/models/...` đọc được bucket R2:

1. Vào **Workers and Pages** → chọn project vừa tạo (vd: **vietvoice-ai**).
2. Trong project, chọn tab **Settings** (cạnh Deployments, Analytics…).
3. Kéo xuống phần **Functions**.
4. Tìm mục **R2 bucket bindings** → bấm **"Add binding"** hoặc **"Edit bindings"**.
5. Thêm 1 binding:
   - **Variable name**: `VIETVOICE_MODELS` (phải viết đúng như vậy, trùng với code).
   - **R2 bucket**: chọn **genvoice-models** (bucket đã tạo trước đó).
6. Bấm **Save** (hoặc **Add** rồi **Save**).

---

## Bước 6: Environment variables (tuỳ chọn)

Trong **Settings** → **Environment variables**:

- **Production** (và Preview nếu muốn):
  - Không bắt buộc thêm biến cho R2 (đã dùng binding).
  - Nếu có dùng `NEXT_PUBLIC_*` (vd: `NEXT_PUBLIC_R2_PUBLIC_URL`) thì thêm ở đây.

Bấm **Save**.

---

## Bước 7: Deploy lại sau khi cấu hình

1. Vào **Deployments**.
2. Bấm **"Retry deployment"** ở deployment mới nhất, hoặc push thêm 1 commit để kích hoạt build mới.

---

## Bước 8: Kiểm tra

1. **URL**: Dạng `https://<project-name>.<account>.pages.dev`.
2. Mở app → chọn giọng → Generate. Lần đầu sẽ tải model từ R2 (qua `/api/models/...`), lần sau dùng cache IndexedDB.
3. Nếu lỗi 404 khi tải model: kiểm tra R2 binding (`VIETVOICE_MODELS`, bucket `genvoice-models`) và cấu trúc object: `vi/<voiceId>/<voiceId>.onnx`, `vi/<voiceId>/<voiceId>.onnx.json`, `vi/<voiceId>/sample.wav`.

---

## Tóm tắt checklist

- [ ] Code đã push lên GitHub.
- [ ] Đã tạo project Pages, connect Git, cấu hình build (command + output directory).
- [ ] Đã thêm R2 bucket binding: variable `VIETVOICE_MODELS`, bucket `genvoice-models`.
- [ ] Deploy thành công và test generate giọng trên URL Pages.

---

## Local dev (test với R2 public)

**Lưu ý cho người clone repo:** File `.env.local` không được commit (nằm trong `.gitignore`). Nếu không tạo file này, API `/api/models/...` sẽ trả **503** (R2 public URL not configured). Cần tự tạo `.env.local` theo hướng dẫn dưới đây.

Để chạy `npm run dev` và tải model từ R2 (bucket bật public access), tạo file **`.env.local`** trong thư mục gốc project với:

```bash
# Bắt buộc cho API route (proxy R2) - Edge runtime cần biến server-only
R2_PUBLIC_URL=https://pub-86489e33a3f448f4b7dfcc0ec9dd3a49.r2.dev

# Tùy chọn: để worker gọi trực tiếp R2, giảm tải qua API
NEXT_PUBLIC_R2_PUBLIC_URL=https://pub-86489e33a3f448f4b7dfcc0ec9dd3a49.r2.dev
```

Thay URL bằng **Public URL** thực tế của bucket (R2 → genvoice-models → Settings → Public access). **Lưu file với encoding UTF-8** (trên Windows: Notepad dễ lưu thành UTF-16/Unicode, gây lỗi parse → 503; nên dùng VS Code / Cursor và chọn UTF-8 khi Save). Sau đó **restart** `npm run dev`.

---

## Lưu ý kỹ thuật

- **Next.js trên Pages**: Hiện tại app dùng `next build`; API route `/api/models/[voiceId]/[file]` chạy dưới dạng serverless trên Cloudflare. Nếu Cloudflare Pages hỗ trợ Next.js runtime, route sẽ chạy bình thường; nếu có lỗi runtime, có thể cần chuyển sang **OpenNext** (Workers) sau.
- **R2**: Bucket **genvoice-models** để private, không cần bật public; chỉ app (qua binding) mới đọc được.
- **Node version**: Nên dùng Node 18 hoặc 20. Có thể thêm file `.nvmrc` với nội dung `20` và trong `package.json`: `"engines": { "node": ">=18.0.0" }` để tránh lỗi build.

Nếu anh/chị gửi thêm ảnh màn hình (Build configuration, R2 bindings), có thể chỉnh lại từng bước cho đúng giao diện hiện tại.
