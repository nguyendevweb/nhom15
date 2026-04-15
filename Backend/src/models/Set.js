import mongoose from "mongoose";

/**
 * Schema Card - Một thẻ flashcard trong bộ học
 * Bao gồm: mặt trước (tiếng Anh), mặt sau (tiếng Việt),
 * phát âm, ví dụ, hình ảnh và âm thanh để hỗ trợ học tập
 */
const cardSchema = new mongoose.Schema({
  // Mặt trước của thẻ (thường là từ tiếng Anh)
  front: { type: String, required: true, trim: true },
  // Mặt sau của thẻ (thường là dịch tiếng Việt)
  back: { type: String, required: true, trim: true },
  
  // ============ DỮ LIỆU NÂNG CAO CHO HỌC TỪ VỰNG ============
  // Liên kết tới từ vựng chi tiết (nếu thẻ được tạo từ Vocabulary)
  vocabularyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Vocabulary",
  },
  // Phát âm IPA (vd: /ˈheðər/)
  phonetic: { type: String },
  // Loại từ: noun, verb, adjective, adverb, etc.
  partOfSpeech: { type: String },
  // Ví dụ câu sử dụng từ
  example: { type: String },
  // URL hình ảnh giúp nhớ từ
  imageUrl: { type: String },
  // URL âm thanh để phát âm
  audioUrl: { type: String },
  // Mức độ khó: easy (A1-A2), medium (B1-B2), hard (C1-C2)
  difficulty: {
    type: String,
    enum: ['easy', 'medium', 'hard'],
    default: 'medium',
  },
  // Tags để phân loại (vd: business, informal, slang)
  tags: [{ type: String }],
});

/**
 * Schema Set - Bộ thẻ flashcard cho người dùng
 * Bao gồm: tiêu đề, mô tả, danh sách thẻ,
 * cấu hình học tập (chế độ, ngôn ngữ), và thống kê
 */
const setSchema = new mongoose.Schema({
  // Tiêu đề bộ thẻ
  title: {
    type: String,
    required: true,
    trim: true,
  },
  // Mô tả chi tiết về bộ thẻ này
  description: {
    type: String,
    trim: true,
    default: "",
  },
  // Tags để tìm kiếm (vd: "business", "IELTS", "casual")
  tags: {
    type: [String],
    default: [],
  },
  // Danh sách các thẻ flashcard trong bộ này
  cards: {
    type: [cardSchema],
    default: [],
  },
  
  // ============ QUYỀN TRUY CẬP ============
  // Người sở hữu bộ thẻ này
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  // Danh sách người dùng yêu thích bộ thẻ này
  favorites: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  ],
  // Bộ thẻ công khai hay chỉ riêng tư
  isPublic: {
    type: Boolean,
    default: true,
  },
  
  // ============ CẤU HÌNH HỌC TẬP ============
  // Chế độ học: flashcard (lật thẻ), spaced_repetition (ôn tập cách đều),
  // context_learning (học qua ngữ cảnh), mixed (kết hợp)
  studyMode: {
    type: String,
    enum: ['flashcard', 'spaced_repetition', 'context_learning', 'mixed'],
    default: 'flashcard',
  },
  // Loại nội dung: vocabulary (từ vựng), grammar (ngữ pháp),
  // phrases (cụm từ), mixed (kết hợp)
  category: {
    type: String,
    enum: ['vocabulary', 'grammar', 'phrases', 'mixed'],
    default: 'vocabulary',
  },
  // Ngôn ngữ nguồn (thường là tiếng Anh)
  language: {
    type: String,
    default: 'en', // Mã ngôn ngữ ISO (en = English)
  },
  // Ngôn ngữ đích (thường là tiếng Việt)
  targetLanguage: {
    type: String,
    default: 'vi', // Mã ngôn ngữ ISO (vi = Vietnamese)
  },
  
  // ============ THỐNG KÊ ============
  // Tổng số lần bộ thẻ được xem
  totalViews: {
    type: Number,
    default: 0,
  },
  // Tổng số lần bộ thẻ được yêu thích
  totalFavorites: {
    type: Number,
    default: 0,
  },
  // Đánh giá trung bình từ người dùng (0-5 sao)
  averageRating: {
    type: Number,
    default: 0,
    min: 0,
    max: 5,
  },
}, {
  timestamps: true, // Tự động thêm createdAt và updatedAt
});

// Chuyển đổi dữ liệu khi trả về JSON
setSchema.set("toJSON", {
  transform(doc, ret) {
    ret.id = ret._id; // Thêm id = _id để tiện dụng
    delete ret._id; // Xóa _id gốc khỏi response
    delete ret.__v; // Xóa phiên bản schema
    return ret;
  },
});

const Set = mongoose.models.Set || mongoose.model("Set", setSchema);
export default Set;
