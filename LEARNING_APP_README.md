# English Vocabulary Learning App

Ứng dụng học từ vựng tiếng Anh với 3 phương pháp chính: Flashcard, Spaced Repetition, và Context-based Learning.

## 🚀 Tính năng chính

### 📚 Quản lý từ vựng
- Thêm/sửa/xóa từ vựng với thông tin chi tiết
- Phiên âm, định nghĩa, ví dụ, collocations
- Phân loại theo độ khó (beginner/intermediate/advanced)
- Tìm kiếm và lọc từ vựng

### 🎯 Phương pháp học

#### 1. Flashcard
- Lật thẻ để xem từ và nghĩa
- Giao diện đơn giản, dễ sử dụng

#### 2. Spaced Repetition (SM-2 Algorithm)
- Thuật toán thông minh tự động điều chỉnh khoảng cách ôn tập
- Tối ưu hóa việc ghi nhớ dựa trên hiệu suất của bạn
- 4 mức độ đánh giá: Again (1), Hard (2), Good (3), Easy (4)

#### 3. Context-based Learning
- Học từ qua ví dụ thực tế
- Xem collocations (cụm từ thông dụng)
- Hiểu cách sử dụng từ trong ngữ cảnh

### 📊 Thống kê học tập
- Theo dõi tiến độ học
- Thống kê độ chính xác
- Thời gian học tổng cộng
- Thành tích và huy hiệu

## 🛠️ Cài đặt và chạy

### Backend
```bash
cd Backend
npm install
npm run seed  # Tạo dữ liệu mẫu
npm run dev   # Chạy server development
```

### Frontend
```bash
cd Frontend
npm install
npm run dev   # Chạy frontend development
```

## 📖 Cách sử dụng

### 1. Đăng ký/Đăng nhập
- Tạo tài khoản hoặc đăng nhập bằng Google
- Truy cập dashboard cá nhân

### 2. Quản lý từ vựng
- Vào `/vocabulary` để thêm từ mới
- Điền thông tin chi tiết: từ, phiên âm, định nghĩa, ví dụ
- Phân loại độ khó và thêm tags

### 3. Tạo bộ flashcards
- Tạo set mới từ danh sách từ vựng
- Hoặc tạo thủ công từng thẻ

### 4. Học tập
- Chọn set và phương pháp học
- **Spaced Repetition**: Học thông minh với thuật toán SM-2
- **Context Learning**: Hiểu từ qua ví dụ và collocations
- **Flashcard**: Ôn tập cơ bản

### 5. Theo dõi tiến độ
- Xem thống kê tại `/study/stats`
- Theo dõi độ chính xác và thời gian học
- Đạt các thành tích học tập

## 🧠 Thuật toán Spaced Repetition

Ứng dụng sử dụng thuật toán SM-2 (SuperMemo 2):

- **Ease Factor**: Bắt đầu từ 2.5, điều chỉnh dựa trên hiệu suất
- **Interval**: Tăng dần dựa trên việc trả lời đúng
- **Quality**: 1-4 đánh giá chất lượng ghi nhớ

Công thức:
```
New Interval = Old Interval × Ease Factor
New Ease Factor = Old Ease Factor + (0.1 - (5 - Quality) × (0.08 + (5 - Quality) × 0.02))
```

## 📁 Cấu trúc dự án

```
├── Backend/
│   ├── src/
│   │   ├── models/          # Database models
│   │   ├── controllers/     # Business logic
│   │   ├── routes/         # API routes
│   │   ├── middleware/     # Authentication, etc.
│   │   └── seed.js         # Database seeder
│   └── uploads/            # Static files
├── Frontend/
│   ├── app/                # Next.js pages
│   ├── components/         # React components
│   ├── hooks/             # Custom hooks
│   └── services/          # API services
```

## 🔧 API Endpoints

### Vocabulary
- `GET /api/vocabulary` - Lấy danh sách từ vựng
- `POST /api/vocabulary` - Thêm từ mới
- `PUT /api/vocabulary/:id` - Cập nhật từ
- `DELETE /api/vocabulary/:id` - Xóa từ

### Study Sessions
- `POST /api/study` - Tạo phiên học mới
- `GET /api/study/due` - Lấy thẻ cần ôn
- `POST /api/study/:id/answer` - Gửi câu trả lời
- `GET /api/study/stats` - Thống kê học tập

### Sets
- `GET /api/set` - Lấy danh sách sets
- `POST /api/set` - Tạo set mới
- `PUT /api/set/:id` - Cập nhật set
- `DELETE /api/set/:id` - Xóa set

## 🎨 Giao diện

- **Responsive Design**: Hoạt động tốt trên mobile và desktop
- **Dark/Light Theme**: Hỗ trợ chuyển đổi theme (tương lai)
- **Intuitive UX**: Dễ sử dụng cho người mới học

## 🚀 Tính năng tương lai

- [ ] Text-to-Speech cho phát âm
- [ ] Học theo chủ đề (IELTS, TOEIC, etc.)
- [ ] Chia sẻ sets công khai
- [ ] Học nhóm và thi đấu
- [ ] Tích hợp AI để gợi ý từ vựng
- [ ] Xuất/nhập dữ liệu
- [ ] Ứng dụng mobile

## 📝 License

MIT License - sử dụng tự do cho mục đích học tập và cá nhân.

## 🤝 Đóng góp

Mọi đóng góp đều được chào đón! Hãy tạo issue hoặc pull request.

---

**Chúc bạn học tập hiệu quả! 📚✨**