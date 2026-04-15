import mongoose from "mongoose";

/**
 * Schema User - Quản lý thông tin người dùng
 * Bao gồm: thông tin cơ bản, xác thực, mục tiêu học tập, trình độ tiếng Anh
 * Hỗ trợ đăng ký thông thường và Google OAuth
 */
const userSchema = new mongoose.Schema({
  // Tên họ người dùng
  name: {
    type: String,
    required: true,
    trim: true,
  },
  // Email duy nhất cho mỗi tài khoản
  email: {
    type: String,
    required: true,
    unique: true, // Không cho phép email trùng lặp
    lowercase: true, // Lưu dưới dạng chữ thường để tìm kiếm dễ dàng
    trim: true,
  },
  // Mật khẩu: chỉ bắt buộc nếu không đăng nhập bằng Google
  password: {
    type: String,
    required: function () {
      return !this.googleId; // Nếu có googleId thì không cần password
    },
    select: false, // Không lấy password mặc định trong query, chỉ khi select('+password')
  },
  // Ảnh đại diện của người dùng
  avatar: {
    type: String,
    default: "", // URL ảnh đại diện, có thể để trống
  },
  // Mục tiêu học tập cá nhân
  learningGoal: {
    type: String,
    trim: true,
    default: "", // Vd: "Cải thiện tương tác giao tiếp", "Luyện kinh doanh"
  },
  // Trình độ tiếng Anh theo khung CEFR (Common European Framework of Reference)
  level: {
    type: String,
    enum: ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'], // A1: Sơ cấp, C2: Thành thạo
    default: 'A1', // Mặc định bắt đầu từ A1
  },
  // ID từ Google nếu đăng nhập bằng Google OAuth
  googleId: {
    type: String,
    default: null, // Null nếu đăng ký bằng email/password
  },
  // Danh sách refresh tokens cho đăng nhập lâu dài
  refreshTokens: [
    {
      type: String, // JWT token được lưu để tạo access token mới
    },
  ],
  
  // ============ EMAIL VERIFICATION ============
  // Xác thực email: false (chưa xác thực), true (đã xác thực)
  isEmailVerified: {
    type: Boolean,
    default: false,
  },
  // Token để xác thực email (được tạo lúc đăng ký)
  emailVerificationToken: {
    type: String,
    default: null,
    select: false,
  },
  // Hạn sử dụng verification token (30 phút sau khi đăng ký)
  emailVerificationTokenExpires: {
    type: Date,
    default: null,
  },
  
  // ============ RESET PASSWORD ============
  // Token để reset mật khẩu (gửi qua email)
  resetPasswordToken: {
    type: String,
    default: null,
    select: false,
  },
  // Hạn sử dụng reset password token (1 giờ)
  resetPasswordTokenExpires: {
    type: Date,
    default: null,
  },
  
  // ============ TWO-FACTOR AUTHENTICATION (2FA) ============
  // Bật/tắt 2FA cho tài khoản
  twoFactorEnabled: {
    type: Boolean,
    default: false,
  },
  // Secret key cho TOTP (Time-based One-Time Password)
  // Được tạo từ thư viện speakeasy hoặc google-authenticator
  twoFactorSecret: {
    type: String,
    default: null,
    select: false,
  },
  // Backup codes nếu mất authenticator app (8 codes, 10 chữ số mỗi cái)
  twoFactorBackupCodes: [
    {
      code: String,
      used: { type: Boolean, default: false },
    },
  ],
  // Lần cuối cùng 2FA được xác thực
  twoFactorLastVerified: {
    type: Date,
    default: null,
  },
}, {
  timestamps: true, // Tự động thêm createdAt và updatedAt
});

// Chuyển đổi dữ liệu khi trả về JSON
userSchema.set("toJSON", {
  transform(doc, ret) {
    ret.id = ret._id; // Thêm id = _id để tiện dụng
    delete ret._id; // Xóa _id gốc khỏi response
    delete ret.__v; // Xóa phiên bản schema
    delete ret.password; // Không bao giờ trả về password
    delete ret.refreshTokens; // Không trả về refresh tokens
    return ret;
  },
});

const User = mongoose.models.User || mongoose.model("User", userSchema);
export default User;
