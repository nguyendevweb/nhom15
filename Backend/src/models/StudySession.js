import mongoose from "mongoose";

/**
 * Schema StudyItem - Một thẻ trong phiên học
 * Lưu trữ dữ liệu Spaced Repetition (SM-2 algorithm) cho mỗi thẻ
 * bao gồm khoảng thời gian ôn tập, độ khó, và số lần ôn tập
 */
const studyItemSchema = new mongoose.Schema({
  // Liên kết tới từ vựng (nếu thẻ được tạo từ bộ từ vựng)
  vocabularyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Vocabulary",
    required: false,
  },
  // Liên kết tới thẻ trong Set
  cardId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Set.cards",
  },
  
  // ============ SỬ DỤNG SM-2 SPACED REPETITION ALGORITHM ============
  // easeFactor: Độ khó được điều chỉnh dựa trên hiệu suất người dùng
  // Bắt đầu ở 2.5, có thể tăng hoặc giảm dựa trên phản hồi
  // Formula: EF' = EF + (0.1 - (5 - grade) * (0.08 + (5 - grade) * 0.02))
  // Nơi grade là phản hồi của người dùng (0-5)
  easeFactor: {
    type: Number,
    default: 2.5, // SM-2 mặc định
    min: 1.3, // Giá trị tối thiểu để tránh interval quá nhỏ
  },
  
  // interval: Khoảng thời gian giữa các lần ôn tập (tính bằng ngày)
  // Lần 1: 1 ngày, lần 2: 3 ngày, lần 3: 7 ngày, v.v.
  interval: {
    type: Number,
    default: 1, // Tính bằng ngày
    min: 1,
  },
  
  // repetitions: Số lần người dùng đã ôn tập thẻ này
  repetitions: {
    type: Number,
    default: 0,
  },
  
  // nextReviewDate: Ngày ôn tập tiếp theo được tính toán dựa trên SM-2
  nextReviewDate: {
    type: Date,
    default: Date.now,
  },
  
  // lastReviewed: Lần cuối cùng ôn tập thẻ này
  lastReviewed: {
    type: Date,
  },
  
  // ============ THEO DÕI HIỆU SUẤT ============
  // correctCount: Tổng số lần trả lời đúng cho thẻ này
  correctCount: {
    type: Number,
    default: 0,
  },
  // incorrectCount: Tổng số lần trả lời sai
  incorrectCount: {
    type: Number,
    default: 0,
  },
  // streak: Chuỗi câu trả lời đúng liên tiếp hiện tại
  streak: {
    type: Number,
    default: 0,
  },
});

/**
 * Schema StudySession - Một phiên học/luyện tập
 * Ghi lại: các thẻ được học, số câu trả lời đúng/sai,
 * thời gian học, và trạng thái hoàn thành
 */
const studySessionSchema = new mongoose.Schema({
  // Người dùng thực hiện phiên học
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  // Bộ thẻ được sử dụng trong phiên học
  setId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Set",
  },
  // Loại phiên học
  sessionType: {
    type: String,
    enum: ['flashcard', 'spaced_repetition', 'context_learning'],
    required: true,
  },
  // Danh sách các thẻ được học trong phiên này
  studyItems: [studyItemSchema],
  
  // ============ ĐỐI TƯỢNG THỐNG KÊ ============
  // Tổng số thẻ trong phiên học
  totalItems: {
    type: Number,
    default: 0,
  },
  // Số thẻ đã hoàn thành
  completedItems: {
    type: Number,
    default: 0,
  },
  // Tổng số câu trả lời đúng
  correctAnswers: {
    type: Number,
    default: 0,
  },
  // Tổng số câu trả lời sai
  incorrectAnswers: {
    type: Number,
    default: 0,
  },
  
  // ============ THỜI GIAN ============
  // Thời lượng phiên học (tính bằng giây)
  sessionDuration: {
    type: Number,
    default: 0,
  },
  // Thời gian bắt đầu phiên học
  startTime: {
    type: Date,
    default: Date.now,
  },
  // Thời gian kết thúc phiên học
  endTime: {
    type: Date,
  },
  // Đánh dấu phiên học đã hoàn thành
  isCompleted: {
    type: Boolean,
    default: false,
  },
  
  // ============ THỐNG KÊ CHO SPACED REPETITION ============
  // Số thẻ mới (chưa ôn tập lần nào) học hôm nay
  newCardsToday: {
    type: Number,
    default: 0,
  },
  // Số thẻ cần ôn tập (đã hết lịch trình cũ) hôm nay
  reviewCardsToday: {
    type: Number,
    default: 0,
  },
  // Số thẻ đã học tập thành công (không cần ôn tập)
  learnedCardsToday: {
    type: Number,
    default: 0,
  },
}, {
  timestamps: true,
});

studySessionSchema.index({ userId: 1, createdAt: -1 });
studySessionSchema.index({ userId: 1, sessionType: 1 });
studySessionSchema.index({ "studyItems.nextReviewDate": 1 });

studySessionSchema.set("toJSON", {
  transform(doc, ret) {
    ret.id = ret._id;
    delete ret._id;
    delete ret.__v;
    return ret;
  },
});

const StudySession = mongoose.models.StudySession || mongoose.model("StudySession", studySessionSchema);
export default StudySession;