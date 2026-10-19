# Kotoba N5–N4 — bản Vercel

Next.js chuẩn, chạy trực tiếp trên Vercel. Có đăng nhập riêng, Gemini tích hợp và đồng bộ tiến độ máy tính–điện thoại qua Neon Postgres.

## Các file cần biết

- `HUONG_DAN_VERCEL.md`: hướng dẫn triển khai từng bước.
- `VERCEL_ENV_IMPORT.env`: đã điền cả ba khóa Gemini, mật khẩu trang học và khóa phiên đăng nhập. Import một lần lên Vercel.
- `TAI_KHOAN_CA_NHAN.txt`: mật khẩu đăng nhập giống nhau trên máy tính và điện thoại.
- `.env.local`: cấu hình chạy trên máy, đã có đủ khóa AI.
- `database/schema.sql`: cấu trúc cơ sở dữ liệu; ứng dụng tự tạo bảng nếu tài khoản Neon có quyền tạo bảng.

**Giữ hai file cấu hình và mật khẩu riêng cho bạn. `.gitignore` và `.vercelignore` đã loại các file này khỏi mã nguồn đưa lên GitHub.** Cấu hình trên Vercel bằng cách import `VERCEL_ENV_IMPORT.env`, không cần gõ lại ba khóa AI.

## Bắt đầu

1. Làm theo `HUONG_DAN_VERCEL.md` để đưa mã nguồn lên Vercel.
2. Import file môi trường.
3. Kết nối một database Neon trong Storage của Vercel.
4. Redeploy rồi mở cùng một địa chỉ trên máy tính và điện thoại.
5. Đăng nhập bằng mật khẩu trong `TAI_KHOAN_CA_NHAN.txt`.

Nếu chưa kết nối Neon, trang vẫn học được nhưng chỉ lưu trên từng máy và thông báo rõ chưa có đồng bộ. Chỉ khi có database thực thì tiến độ mới dùng chung giữa các thiết bị. Không dùng file JSON trên ổ đĩa của Vercel làm cơ sở dữ liệu.

## Học liệu và chức năng

- 2.171 từ & biểu thức cập nhật bản 3, hoặc 2.189 mục theo bản 2.
- 205 điểm ngữ pháp, phủ đủ 50 bài Minna.
- 512 mục Kanji Look and Learn, chia 32 bài gốc.
- Flashcard, trắc nghiệm, nghe–viết, gõ từ, ghép cặp, dựng câu, điền từ, luyện dịch và AI chấm câu.
- Ghi chú, đánh dấu từ, lịch ôn, thống kê, sao lưu JSON, sáng/tối và giao diện cho điện thoại.

Nền tảng nội dung là các PDF bản 2 người học cung cấp; phần từ vựng bản 3 áp dụng danh mục thay đổi chính thức của 3A. Đây là học liệu tổng hợp, chưa phải bản số hóa toàn bộ mọi trang sách bản 3. Bộ Kanji đủ 32 bài có phần vượt N4. Nội dung AI vẫn có thể cần đối chiếu.

## Đồng bộ hoạt động như thế nào?

Mỗi lượt luyện tập có mã riêng. Máy tính và điện thoại gửi các lượt học lên cùng một bản ghi Postgres. Khi hai máy thay đổi cùng lúc, ứng dụng gộp các lượt theo mã và không đếm lặp. Ghi chú và trạng thái đánh dấu dùng thay đổi mới hơn. Dữ liệu lưu đệm trên thiết bị khi mất mạng, tự thử đồng bộ lại mỗi 5 giây khi trang đang mở và khi quay lại tab/có mạng.

Để chuyển máy: chờ dòng **Đã đồng bộ** trước khi đóng trang. Khi mở trên máy khác, chờ vài giây hoặc bấm biểu tượng đám mây ở thanh trên.

## Chạy trên máy để kiểm tra

Cần Node.js 22 trở lên:

```sh
npm ci
npm run dev
```

Mở http://localhost:3000 và nhập mật khẩu trong file tài khoản.

Nếu muốn bản local cũng dùng chung dữ liệu với Vercel, điền `DATABASE_URL` của cùng database Neon vào `.env.local`. Nếu để trống, bản local chỉ lưu trên máy và vẫn dùng AI được.

## Kiểm thử

```sh
npm run check
npm run build
```

Bộ kiểm thử kiểm tra gộp hai thiết bị, chống đếm lặp, gộp ghi chú/đánh dấu, chuyển bản sao cũ, phiên đăng nhập, từ chối cookie giả và truy vấn Postgres có kiểm soát phiên bản. Các truy vấn được kiểm tra bằng PGlite (Postgres nhúng); không coi đây là kiểm thử kết nối tới tài khoản Neon của bạn.
