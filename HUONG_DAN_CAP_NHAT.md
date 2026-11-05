# Kotoba — bản nâng cấp học chủ động

## Cập nhật lên website hiện tại

1. Giải nén gói này. Sao lưu repo hiện tại trước khi thay các file cùng tên.
2. Đưa toàn bộ mã nguồn trong thư mục `kotoba-study-main` lên repo `kinzy2k7/kotoba-study`, giữ nguyên cấu trúc. Không đưa `node_modules`, `.next`, `.qa` hoặc file chứa khóa lên GitHub.
3. Giữ các biến môi trường đang dùng trên Vercel: `APP_PASSWORD`, `SESSION_SECRET`, các `GEMINI_API_KEY_1/2/3` và `DATABASE_URL` hoặc `POSTGRES_URL`. Nếu chưa có cấu hình, tham khảo `.env.example`; gói này không chứa mật khẩu hay khóa API thật.
4. Commit/push để Vercel triển khai lại. Nếu dự án chưa tự triển khai, chọn Redeploy trên Vercel.
5. Sau khi triển khai, kiểm tra đăng nhập, học một thẻ, tạm dừng rồi tiếp tục. Để kiểm tra Neon, học trên một máy và chờ **Đã đồng bộ**, sau đó mở website trên máy khác.

Không cần thay bảng Postgres. Bản này đọc tiến độ `kotoba-study-v1`/`v2` và bản sao lưu JSON cũ. Khi nhập bản sao, dữ liệu được gộp với tiến độ hiện tại.

## Cách dùng các chức năng mới

- **Che từng phần:** trong Từ vựng/Kanji, bật Tiếng Nhật, Cách đọc hoặc Nghĩa ở khung tự kiểm tra. Chạm ô đang che để hiện riêng, hoặc dùng Hiện tất cả/Che lại. Các lựa chọn che được nhớ trên thiết bị; phần đã hé đáp án được che lại khi đổi bài hoặc bắt đầu buổi mới.
- **Flashcard:** mặc định có tiếng Nhật và cách đọc. Chọn Nhật → Việt, Việt → Nhật hoặc Luyện đọc Kanji. Có nút bật/tắt cách đọc. Katakana vẫn giữ cách viết đúng; Kanji dùng cách đọc từ ghép trong học liệu. Ví dụ chỉ hiện khi có câu phù hợp trong bộ ngữ pháp sẵn có.
- **Phát âm:** biểu tượng loa đọc tốc độ thường, 0.7× đọc chậm. Bật Tự đọc thẻ nếu muốn tự phát khi sang thẻ Nhật. Máy cần hỗ trợ giọng tiếng Nhật.
- **Ôn nhanh:** trang chủ có nút Ôn nhanh 5 phút. Phiên gồm tối đa 20 mục, ưu tiên mục đến hạn, mục từng sai rồi mục mới. Có thể hoàn thành trước 5 phút. Trong thư viện, phiên nhanh theo phạm vi bài và bộ lọc đang chọn.
- **Lượt hai:** cuối buổi có nút ôn lại các mục đã trả lời sai. Bảng cuối buổi hiển thị số lượt, độ chính xác và lịch ôn tiếp theo. Ghép cặp có thể có nhiều lần thử cho cùng một mục.
- **Tiếp tục buổi học:** Lưu & tạm dừng giữ vị trí, câu trả lời, kiểu thẻ và kết quả. Trang chủ hoặc thư viện có nút Tiếp tục. Buổi học dở lưu riêng cho mỗi bản từ vựng và Kanji trên **thiết bị này**; tiến độ học vẫn đồng bộ qua Neon. Phiên 5 phút tiếp tục tính thời gian khi rời trang; mở lại khi hết giờ sẽ xem kết quả.
- **So sánh:** chọn 2–4 từ rồi bấm So sánh. Xem tiếng Nhật, cách đọc, nghĩa, phát âm và viết ghi chú phân biệt. Các ghi chú dùng cùng sổ tay và tiến độ đồng bộ.
- **Tập trung:** mở buổi học sẽ thu gọn menu mặc định. Nút thu/phóng bên cạnh tiến độ đổi chế độ. Điện thoại có thanh điều hướng dưới màn hình; nút đánh giá flashcard bám theo màn hình khi cuộn.

## Độ tin cậy và giới hạn

- Mỗi đáp án của một buổi học có mã ổn định: khôi phục hoặc gửi lại không làm tăng số lượt hai lần.
- Khi có lượt mới trong lúc đang gửi, ứng dụng giữ trạng thái chờ và gửi tiếp, thay vì báo đã đồng bộ cho lượt cũ.
- Tiến độ được ghi vào bộ nhớ trình duyệt ngay khi thao tác; các tab cùng thiết bị gộp thay đổi qua sự kiện storage.
- Dữ liệu sai cấu trúc được từ chối thay vì làm API lỗi vì giá trị null.
- Lịch sử lớn được nén gzip khi truyền; đã kiểm tra dữ liệu 22.000 lượt vượt 3 MB ở dạng JSON thô. Đây là cải thiện truyền tải, **không phải cơ chế xóa hoặc thu gọn lịch sử**. Bộ nhớ trình duyệt và kích thước dữ liệu vẫn có giới hạn; xuất JSON định kỳ để giữ bản dự phòng.
- Kiểm tra tự động không thay thế thử nghiệm tài khoản Gemini, Neon và giọng đọc trên thiết bị thật. Không thay đổi model AI của bản gốc.

## Chạy và kiểm tra

Cần Node.js 22 trở lên:

```sh
npm ci
npm run check
npm run build
npm run dev
```

Tạo `.env.local` từ `.env.example` và điền thông tin riêng nếu chạy trên máy. `SESSION_SECRET` cần ít nhất 32 ký tự ngẫu nhiên. Không commit `.env.local` lên GitHub.
