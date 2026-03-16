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
5. **Lưu ý:** Nếu màn hình tiếp theo yêu cầu **Deploy command** (vd: `npx wrangler deploy`) và **API token**, đó là luồng **Workers**. Với hướng dẫn này nên dùng **Pages**: quay lại **Create application** → chọn **Pages** (không chọn Workers) → **Connect to Git** để có form **Build configuration** (Build command, Build output directory) như Bước 4.

---

## Bước 4: Cấu hình Build

Điền form **Create a project**:

| Trường | Giá trị |
|--------|--------|
| **Project name** | `vietvoice-ai` (hoặc tên khác) |
| **Production branch** | `main` |
| **Framework preset** | **Next.js** (nếu có trong danh sách) hoặc **None** |
| **Build command** | `npx @cloudflare/next-on-pages@1` |
| **Build output directory** | `.vercel/output/static` |
| **Root directory** | Để trống (nếu repo là project gốc) |

**Lưu ý:** Dùng next-on-pages adapter để build cho Cloudflare Pages. Output directory `.vercel/output/static` (đã xử lý, không có webpack cache).

Sau đó bấm **"Save and Deploy"**. Lần build đầu có thể fail nếu thiếu cấu hình; làm tiếp Bước 5–6 rồi **Deployments** → **Retry deployment**.

---

---

### Nếu gặp lỗi deploy: "Missing entry-point to Worker script" hoặc "wrangler deploy on Pages project"

Lỗi này xảy ra khi project **Pages** nhưng **Deploy command** bị điền thành `npx wrangler deploy` (lệnh của Workers). Cách sửa:

1. Vào **Workers and Pages** → chọn project (vd: **gen-voice-ai**) → **Settings** → phần **Build**.
2. Tìm field **Deploy command** (hiện đang là `npx wrangler deploy`).
3. **Xoá hết** nội dung ô **Deploy command** (để trống) — với Pages, Cloudflare tự deploy từ Build output, không cần chạy wrangler deploy.
4. (Tuỳ chọn) **Version command** cũng có thể để trống nếu không dùng Workers.
5. Bấm **Save**.
6. Vào **Deployments** → **Retry deployment** (hoặc push commit mới để build lại).

**Không cần** chạy `wrangler deploy` — Cloudflare Pages tự động deploy từ output directory (`.next`) sau khi build xong.

---

### Nếu bạn đang ở màn hình "Set up your application" (Deploy command = wrangler deploy, có API token)

Đó là luồng **Workers**. Bạn có hai lựa chọn:

**Cách 1 – Dùng Pages (khuyến nghị, đúng với hướng dẫn trên):** Bấm **Back** → về **Create application** → chọn **Pages** (không chọn Workers) → **Connect to Git** → đi tiếp theo Bước 4 (Build command, **Build output directory** = `.next`), không cần API token hay Deploy command.

**Cách 2 – Tiếp tục deploy bằng Workers:** Điền **API token** (bấm **"+ Create new token"** → vào Cloudflare Dashboard → My Profile → API Tokens → Create Token → chọn template "Edit Cloudflare Workers" hoặc quyền tương đương → tạo xong copy token và dán vào form; có thể điền **API token name**). Sau đó bấm **Deploy**. Lưu ý: với Workers, Next.js thường cần build qua adapter (vd. `@cloudflare/next-on-pages`); nếu build/deploy báo lỗi, nên chuyển sang Cách 1 (Pages).

---

### Nếu mở trang thấy "Node.JS Compatibility Error" (no nodejs_compat)

App build bằng `@cloudflare/next-on-pages` cần bật **Compatibility Flag** `nodejs_compat`.

**Cách 1 – Dùng config (khuyến nghị):** Trong repo đã có `wrangler.toml` với `compatibility_flags = ["nodejs_compat"]`. Khi deploy qua Git, Cloudflare Pages có thể đọc config này; nếu vẫn lỗi thì dùng Cách 2.

**Cách 2 – Cấu hình trên Dashboard:**

1. Vào **Workers and Pages** → chọn project (**app-gen-voice-ai**) → **Settings**.
2. Kéo xuống phần **Runtime** → **Compatibility flags**.
3. Trong dropdown có thể **không hiện** `nodejs_compat`. Hãy **gõ tay** `nodejs_compat` vào ô **Production compatibility flags** (và Preview nếu có), rồi thêm vào danh sách.
4. Bấm **Save**. Thay đổi có hiệu lực từ deployment tiếp theo.

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

## Bước 6: Environment variables (khuyến nghị: R2_PUBLIC_URL)

Trong **Settings** → **Environment variables**:

- **Production** (và Preview nếu muốn):
  - **Khuyến nghị:** Thêm `R2_PUBLIC_URL` = URL public của bucket R2 (vd: `https://pub-xxxx.r2.dev`). Khi có biến này, API sẽ dùng direct fetch thay vì R2 binding, **tránh lỗi 500** khi tải model/sample.wav trên Pages.
  - Nếu không set: app dùng R2 binding; nếu binding lỗi hoặc bucket thiếu file sẽ trả 500. Khi gặp 500, hãy thêm `R2_PUBLIC_URL` (bucket cần bật public access hoặc dùng custom domain).
  - Nếu có dùng `NEXT_PUBLIC_R2_PUBLIC_URL` (client gọi trực tiếp R2) thì cũng thêm ở đây.

Bấm **Save**.

---

## Bước 7: Deploy lại sau khi cấu hình

1. Vào **Deployments**.
2. Bấm **"Retry deployment"** ở deployment mới nhất, hoặc push thêm 1 commit để kích hoạt build mới.

---

## Bước 8: Kiểm tra

1. **URL**: Dạng `https://<project-name>.<account>.pages.dev`.
2. Mở app → chọn giọng → Generate. Lần đầu sẽ tải model từ R2 (trực tiếp qua URL trong `r2-config.json`), lần sau dùng cache IndexedDB.
3. Nếu lỗi **404** khi tải model: kiểm tra R2 bucket và cấu trúc object: `vi/<voiceId>/<voiceId>.onnx`, `vi/<voiceId>/<voiceId>.onnx.json`, `vi/<voiceId>/sample.wav`.
4. Nếu Network tab thấy `(blocked:COEP-frame...)` cho các chunk JS (`_next/static/chunks/*.js`): Đã **bỏ COEP/COOP** trong `next.config.js` và `public/_headers`. Đảm bảo code mới nhất đã được deploy.

---

## Lưu ý quan trọng: Không dùng COEP/COOP

App đã bỏ **Cross-Origin-Embedder-Policy (COEP)** và **Cross-Origin-Opener-Policy (COOP)** vì:

- Khi dùng COEP `require-corp`, mọi tài nguyên con (kể cả JS cùng origin) đều phải có header phù hợp.
- Trên Cloudflare Pages, các chunk JS (`_next/static/chunks/*.js`) không có COEP header → browser chặn → `(blocked:COEP-frame...)` → model không tải được.
- ONNX Runtime WASM **không cần** COEP/SharedArrayBuffer để chạy single-thread.

**Nếu sau này cần SharedArrayBuffer** (multi-thread WASM): dùng `credentialless` hoặc đảm bảo mọi response (kể cả chunk) đều có COEP header phù hợp.

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
