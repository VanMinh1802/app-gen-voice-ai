# Biến môi trường Genation (Auth & License)

## Chạy local (localhost)

Nếu thấy **"Chưa cấu hình Genation SDK"**, bấm **Đăng nhập** không có phản hồi, hoặc **lỗi 400 "invalid client credentials"** sau khi đăng nhập:

1. Tạo file **`.env.local`** trong thư mục gốc project (cùng cấp với `package.json`).
2. Thêm nội dung sau (thay giá trị bằng từ Genation Dashboard):

```
NEXT_PUBLIC_GENATION_CLIENT_ID=your-client-id
GENATION_CLIENT_SECRET=your-client-secret
# Bắt buộc cho local: nút Đăng nhập chạy trên browser, Next.js chỉ expose biến NEXT_PUBLIC_ xuống client
NEXT_PUBLIC_GENATION_CLIENT_SECRET=your-client-secret
NEXT_PUBLIC_GENATION_REDIRECT_URI=http://localhost:3000/api/v1/auth/callback
```

**Lưu ý:** Ở local, cần thêm **`NEXT_PUBLIC_GENATION_CLIENT_SECRET`** (copy cùng giá trị với `GENATION_CLIENT_SECRET`) vì nút Đăng nhập chạy trên client; Next.js không gửi biến không có tiền tố `NEXT_PUBLIC_` xuống browser. Trên production (Cloudflare) chỉ cần set `GENATION_CLIENT_SECRET` (callback chạy server-side).

3. **Restart** dev server (`npm run dev`).
4. Trên **Genation Dashboard** (G-Store) cần đăng ký thêm Redirect URI: `http://localhost:3000/api/v1/auth/callback`.

---

## Deploy lên Cloudflare Pages

Để **Đăng nhập Genation** và **quản lý license** chạy đúng trên `app-gen-voice-ai.pages.dev`, cần cấu hình Environment Variables trong Cloudflare Pages.

### Cách thêm

1. Vào **Cloudflare Dashboard** → **Workers & Pages** → chọn project **app-gen-voice-ai**.
2. Vào **Settings** → **Environment variables**.
3. Thêm các biến sau (Production và Preview nếu cần):

| Tên | Giá trị | Ghi chú |
|-----|--------|--------|
| `NEXT_PUBLIC_GENATION_CLIENT_ID` | `98459c3f-dabd-4d42-8219-0488e6a3acbf` | Bắt buộc |
| `GENATION_CLIENT_SECRET` | *(secret từ Genation)* | Bắt buộc (cho callback server-side) |
| **`NEXT_PUBLIC_GENATION_CLIENT_SECRET`** | *(cùng giá trị với GENATION_CLIENT_SECRET)* | **Bắt buộc** – nút Đăng nhập chạy trên browser, Next.js chỉ embed biến `NEXT_PUBLIC_*` vào client |
| `NEXT_PUBLIC_GENATION_REDIRECT_URI` | `https://app-gen-voice-ai.pages.dev/api/v1/auth/callback` | Khớp với Redirect URI đã đăng ký trên Genation |

**Lưu ý:** Thiếu `NEXT_PUBLIC_GENATION_CLIENT_SECRET` → production vẫn hiển thị "Chưa cấu hình Genation SDK" và có thể gây React hydration error #418 (server có secret, client không có → render khác nhau).

## Lỗi "Internal Server Error" trên /api/auth/signin

Nếu thấy lỗi này, thường là do **chưa set** hoặc **sai tên** biến trên Pages. Sau khi thêm đủ 3 biến và redeploy, thử lại nút **Đăng nhập**.

## 302 vs 500 vs 400 khi callback

- **302** từ `/api/v1/auth/callback`: **đúng** – đây là redirect sang `/auth/callback`, không phải lỗi.
- **500** trên production (Cloudflare): route callback trả lỗi server. Đảm bảo đã deploy bản mới; nếu vẫn 500, xem **Function logs** trong Cloudflare Dashboard.
- **400** sau khi vào `/auth/callback` (redirect về `/?auth_error=...`): token exchange thất bại. Kiểm tra **redirect_uri** khớp G-Store và **client secret** đã set (local: `NEXT_PUBLIC_GENATION_CLIENT_SECRET`, production: env vars trên Pages).
