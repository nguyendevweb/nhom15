import mongoose from "mongoose";

// Schema cho ví dụ câu sử dụng từ vựng
const exampleSchema = new mongoose.Schema({
  sentence: { type: String, required: true }, // Câu ví dụ bằng tiếng Anh
  translation: { type: String, required: true }, // Dịch sang tiếng Việt
  source: { type: String, default: "" }, // Nguồn (sách, bài viết, v.v.)
});

// Schema cho cụm từ liên kết (collocations)
const collocationSchema = new mongoose.Schema({
  phrase: { type: String, required: true }, // Cụm từ (vd: "strong coffee")
  meaning: { type: String, required: true }, // Ý nghĩa
  example: { type: String, required: true }, // Ví dụ sử dụng
});

/**
 * Schema Vocabulary - Quản lý từ vựng Tiếng Anh
 * Bao gồm: định nghĩa, ví dụ, cụm từ, tính phát âm, hình ảnh,
 * từ đồng nghĩa/trái nghĩa để hỗ trợ một quá trình học tập toàn diện
 */
const vocabularySchema = new mongoose.Schema({
  // Từ chính
  word: {
    type: String,
    required: true,
    trim: true,
    lowercase: true, // Lưu dưới dạng chữ thường để tìm kiếm dễ dàng
  },
  // Phát âm IPA (vd: /ˈheðər/ cho "heather")
  phonetic: {
    type: String,
    trim: true,
  },
  // Định nghĩa: có thể có nhiều loại từ (noun, verb, adjective, v.v.)
  definitions: [{
    partOfSpeech: { type: String, required: true }, // Loại từ (noun, verb, adjective, etc.)
    meaning: { type: String, required: true }, // Nghĩa tiếng Việt
    example: { type: String }, // Ví dụ trong tiếng Anh
  }],
  // Từ đồng nghĩa (vd: happy → joyful, cheerful)
  synonyms: [{ type: String }],
  // Từ trái nghĩa (vd: happy → sad, unhappy)
  antonyms: [{ type: String }],
  // Ví dụ câu sử dụng từ trong ngữ cảnh thực tế
  examples: [exampleSchema],
  // Cụm từ liên kết (vd: "make progress" với động từ "make")
  collocations: [collocationSchema],
  // Mục độ khó: beginner (A1-A2), intermediate (B1-B2), advanced (C1-C2)
  difficulty: {
    type: String,
    enum: ['beginner', 'intermediate', 'advanced'],
    default: 'intermediate',
  },
  // Tags để phân loại (vd: business, informal, slang, v.v.)
  tags: [{ type: String }],
  // URL âm thanh (phát âm từ)
  audioUrl: { type: String },
  // URL hình ảnh giúp nhớ từ
  imageUrl: { type: String },
  // Người tạo từ vựng này
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  // Công khai hay riêng tư
  isPublic: {
    type: Boolean,
    default: true,
  },
}, {
  timestamps: true,
});

vocabularySchema.index({ word: 1 });
vocabularySchema.index({ tags: 1 });
vocabularySchema.index({ difficulty: 1 });

vocabularySchema.set("toJSON", {
  transform(doc, ret) {
    ret.id = ret._id;
    delete ret._id;
    delete ret.__v;
    return ret;
  },
});

const Vocabulary = mongoose.models.Vocabulary || mongoose.model("Vocabulary", vocabularySchema);
export default Vocabulary;