# Biến môi trường khi deploy lên Cloudflare Pages

Để **Đăng nhập Genation** và **quản lý license** chạy đúng trên `app-gen-voice-ai.pages.dev`, cần cấu hình Environment Variables trong Cloudflare Pages.

## Cách thêm

1. Vào **Cloudflare Dashboard** → **Workers & Pages** → chọn project **app-gen-voice-ai**.
2. Vào **Settings** → **Environment variables**.
3. Thêm các biến sau (Production và Preview nếu cần):

| Tên | Giá trị | Ghi chú |
|-----|--------|--------|
| `NEXT_PUBLIC_GENATION_CLIENT_ID` | `98459c3f-dabd-4d42-8219-0488e6a3acbf` | Bắt buộc |
| `GENATION_CLIENT_SECRET` | *(secret từ Genation)* | Bắt buộc, **không** dùng tiền tố `NEXT_PUBLIC_` |
| `NEXT_PUBLIC_GENATION_REDIRECT_URI` | `https://app-gen-voice-ai.pages.dev/api/v1/auth/callback` | Khớp với Redirect URI đã đăng ký trên Genation |

4. **Redeploy** project (Build lại) để biến môi trường có hiệu lực.

## Lỗi "Internal Server Error" trên /api/auth/signin

Nếu thấy lỗi này, thường là do **chưa set** hoặc **sai tên** biến trên Pages. Sau khi thêm đủ 3 biến và redeploy, thử lại nút **Đăng nhập**.
