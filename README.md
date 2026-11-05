# Kotoba — học tiếng Nhật N5–N4

**Bản nâng cấp học chủ động:** xem [HUONG_DAN_CAP_NHAT.md](./HUONG_DAN_CAP_NHAT.md) để cập nhật website hiện tại và sử dụng các chức năng mới.

Next.js trên Vercel, đăng nhập riêng, gia sư Gemini và đồng bộ tiến độ qua Neon Postgres.

## Mới trong bản này

- Che tiếng Nhật, cách đọc hoặc nghĩa; chạm từng ô để hiện.
- Flashcard có cách đọc và ba kiểu Nhật → Việt, Việt → Nhật, luyện đọc Kanji.
- Phát âm thường/chậm, tùy chọn tự đọc thẻ.
- Ôn nhanh 5 phút, lượt hai cho từ sai, tiếp tục buổi đang dở trên thiết bị.
- So sánh 2–4 từ, ghi chú phân biệt, lịch ôn sau buổi học.
- Trang chủ vào học nhanh, chế độ tập trung và điều hướng cho điện thoại.
- Sửa trạng thái đồng bộ khi có thay đổi đang gửi; kiểm tra dữ liệu chặt hơn và nén truyền tải lịch sử lớn.

## Cấu hình

Gói mã nguồn không chứa khóa API hay mật khẩu thật. Tạo `.env.local` từ `.env.example` khi chạy trên máy; khi triển khai, nhập các giá trị riêng trong Vercel Environment Variables. Giữ nguyên các biến đang dùng nếu cập nhật website cũ.

- `APP_PASSWORD`: mật khẩu trang học.
- `SESSION_SECRET`: khóa phiên, ít nhất 32 ký tự ngẫu nhiên.
- `DATABASE_URL` hoặc `POSTGRES_URL`: kết nối Neon. Không có database thì chỉ lưu trên thiết bị.
- `GEMINI_API_KEY_1/2/3`: khóa Gemini; học liệu và các chế độ luyện cơ bản vẫn dùng được khi AI chưa cấu hình.

Không commit các file môi trường hoặc khóa thật. Bảng Postgres được tạo tự động nếu tài khoản có quyền; không cần đổi schema cho bản nâng cấp này.

## Học liệu

2.171 từ & biểu thức bản cập nhật, 2.189 mục bản nền, 205 điểm ngữ pháp trên 50 bài Minna và 512 mục Kanji Look and Learn theo 32 bài. Bộ Kanji có phần vượt N4. Học liệu được tổng hợp; kiểm thử tự động xác nhận cấu trúc, không bảo đảm mọi giải thích hoặc đáp án đều chính xác về ngôn ngữ.

## Chạy và kiểm tra

Cần Node.js 22 trở lên:

```sh
npm ci
npm run check
npm run build
npm run dev
```

Mở http://localhost:3000. Kiểm thử bao gồm xác thực phiên, gộp tiến độ, Postgres qua PGlite, khôi phục buổi học, ưu tiên ôn, kiểm tra dữ liệu và truyền tải nén. Kết nối Gemini/Neon thật cần kiểm tra riêng với cấu hình của bạn.

## Lưu và đồng bộ

Tiến độ lưu trên thiết bị và đồng bộ khi có Neon. Chờ **Đã đồng bộ** trước khi chuyển thiết bị. Buổi học đang dở và tùy chọn học lưu riêng trên thiết bị. Có thể xuất/nhập JSON trong Cài đặt để sao lưu hoặc gộp tiến độ.

Lịch sử được giữ để chống đếm trùng. Nén gzip giúp truyền dữ liệu lớn, nhưng dung lượng lưu vẫn có giới hạn; nên xuất bản sao định kỳ.
