> **Bản cập nhật:** gói hiện tại không chứa các file khóa/mật khẩu điền sẵn được nhắc trong hướng dẫn cũ bên dưới. Dùng biến môi trường đang có trên Vercel hoặc tạo từ `.env.example`. Xem `HUONG_DAN_CAP_NHAT.md` để triển khai bản mới.

# Đưa Kotoba lên Vercel và học trên cả máy tính, điện thoại

## 1. Đưa mã nguồn lên GitHub

Giải nén ZIP. Thư mục gốc của project phải có `package.json`, `app`, `public`, `next.config.ts`, `vercel.json`.

Nếu dùng Git:

```sh
git init
git add .
git commit -m "Kotoba Vercel"
```

Tạo repository trên GitHub rồi đẩy project lên repository đó. Có thể dùng GitHub Desktop. `.gitignore` đã bỏ các file chứa khóa.

Nếu dùng trang Upload files trên GitHub, chỉ tải mã nguồn. **Không tải `.env.local`, `VERCEL_ENV_IMPORT.env`, `TAI_KHOAN_CA_NHAN.txt` lên repository.** Giữ các file này trên máy để nhập ở bước 3.

Vercel nhận project qua Git hoặc CLI; không phải bằng cách tải nguyên file ZIP lên như ảnh/tài liệu.

## 2. Import vào Vercel

Vào https://vercel.com → Add New → Project → Import repository vừa tạo.

- Framework Preset: **Next.js**.
- Root Directory: thư mục có `package.json`. Nếu bạn đã tải cả thư mục ngoài lên GitHub, chọn đúng thư mục con `Kotoba_Vercel`.
- Install Command: `npm ci`.
- Build Command: `npm run build`.
- Output Directory: để mặc định của Next.js, không đặt `dist` hay `public`.
- Node.js: 22.x hoặc phiên bản mới hơn được Vercel hỗ trợ.

Có thể import cấu hình ở bước 3 ngay trước Deploy nếu giao diện có ô Environment Variables. Nếu project đã Deploy, tiếp tục bước 3 rồi Redeploy.

## 3. Import cấu hình AI và mật khẩu đã điền sẵn

Project → Settings → Environment Variables → Import .env (hoặc dán toàn bộ nội dung file vào ô thêm biến môi trường).

Chọn file **VERCEL_ENV_IMPORT.env** trong gói tải về. File đã có giá trị của:

- `GEMINI_API_KEY_1`
- `GEMINI_API_KEY_2`
- `GEMINI_API_KEY_3`
- `APP_PASSWORD`
- `SESSION_SECRET`

Áp dụng cho **Production** và **Preview**; thêm Development nếu bạn dùng `vercel dev`.

Không thêm tiền tố `NEXT_PUBLIC_` vào các biến này. Các khóa chỉ được dùng trên máy chủ.

## 4. Kết nối database dùng chung

Vào project → **Storage** → **Create Database / Connect Database** → chọn **Neon Postgres** trong Marketplace.

Tạo database hoặc chọn database Neon của bạn, rồi **Connect** vào project Kotoba. Chọn các môi trường Production/Preview cần dùng. Dùng tên biến môi trường mặc định của integration.

Mã nguồn nhận `DATABASE_URL`, hoặc `POSTGRES_URL` nếu integration tạo tên đó. Kiểm tra trong Settings → Environment Variables rằng một trong hai biến có giá trị thật.

Ứng dụng tự tạo bảng `kotoba_progress` ở lần đồng bộ đầu tiên. Nếu database báo thiếu quyền tạo bảng, vào Neon SQL Editor và chạy nội dung **database/schema.sql** một lần.

Đây là database do bạn tạo trong tài khoản của bạn. Gói ZIP không chứa tài khoản Neon hay connection string giả. Nếu Marketplace có nhiều gói, chọn gói phù hợp và xem điều kiện trước khi xác nhận.

## 5. Redeploy và sử dụng

Vào Deployments → deployment mới nhất → **Redeploy** để áp dụng các biến môi trường và database.

Mở địa chỉ do Vercel cấp, ví dụ `https://ten-project.vercel.app`.

Mật khẩu nằm trong **TAI_KHOAN_CA_NHAN.txt**. Đăng nhập cùng mật khẩu trên máy tính và điện thoại, dùng cùng một địa chỉ web. Không cần nhập khóa AI trên từng thiết bị.

Để tạo lối tắt trên điện thoại:

- iPhone: Safari → Chia sẻ → Thêm vào màn hình chính.
- Android: Chrome → menu ⋮ → Thêm vào màn hình chính.

## 6. Kiểm tra đồng bộ sau khi kết nối Neon

1. Máy tính: học một flashcard, đánh giá mức nhớ; đánh dấu một từ, thêm ghi chú.
2. Chờ dòng **Đã đồng bộ** ở cuối trang/thanh trạng thái.
3. Điện thoại: mở cùng URL, đăng nhập, vào Sổ tay và Tiến độ.
4. Kiểm tra từ đã lưu, ghi chú và số lượt học.
5. Làm thêm một câu trên điện thoại. Quay lại máy tính, chờ vài giây hoặc bấm đám mây để nhận lượt mới.

Chỉ dòng **Đã đồng bộ** mới có nghĩa dữ liệu đã lên database. Nếu báo **Lưu trên thiết bị** hoặc **Chưa kết nối cơ sở dữ liệu**, đừng xóa dữ liệu trình duyệt; kiểm tra lại bước 4.

## Nếu bạn đã học trên bản cũ

Ở bản cũ, vào Cài đặt → Xuất JSON. Trên bản Vercel, vào Cài đặt → Nhập bản sao. Bản mới nhận cả định dạng cũ và gộp vào tiến độ hiện tại. Chờ Đã đồng bộ để đưa bản sao lên database dùng chung.

## Lỗi thường gặp

**Build lỗi vì thư mục:** Root Directory phải có `package.json`. Không chọn `app` hoặc `public`.

**Chưa cấu hình mật khẩu:** Import file môi trường vào đúng project, chọn đúng môi trường rồi Redeploy.

**Gemini chưa cấu hình:** Kiểm tra tên ba biến `GEMINI_API_KEY_1..3`. Không thêm `NEXT_PUBLIC_`. Redeploy sau khi sửa.

**Chỉ lưu trên máy:** Kiểm tra `DATABASE_URL`/`POSTGRES_URL`, kết nối Neon và quyền tạo bảng. Phiên bản này không tự tạo tài khoản/database bên ngoài cho bạn.

**Hai máy không giống nhau:** Dùng cùng URL/project, cùng database Production. Link Preview và link Production có thể dùng database khác nhau nếu integration tạo nhánh riêng.

**Đổi mật khẩu:** Thay `APP_PASSWORD` trong Vercel. Đổi cả `SESSION_SECRET` sang chuỗi ngẫu nhiên mới dài ít nhất 32 ký tự để vô hiệu hóa các phiên cũ, rồi Redeploy.

## Nguồn hướng dẫn nền tảng

- https://vercel.com/docs/frameworks/full-stack/nextjs
- https://vercel.com/docs/environment-variables
- https://vercel.com/docs/marketplace-storage
- https://vercel.com/marketplace/neon
- https://github.com/neondatabase/serverless
