import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { OAuth2Client } from "google-auth-library";
import User from "../models/User.js";
import multer from "multer";
import path from "path";
import { fileURLToPath } from "url";
import {
  sendVerificationEmail,
  sendPasswordResetEmail,
  send2FASetupEmail,
  send2FADisabledEmail,
} from "../utils/emailService.js";
import {
  generateVerificationToken,
  generateResetToken,
  generateTOTPSecret,
  verifyTOTPToken,
  generateBackupCodes,
  verifyBackupCode,
  getTokenExpiry,
} from "../utils/securityUtils.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Cấu hình multer để lưu avatar người dùng lên thư mục uploads/avatars
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../../uploads/avatars'));
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'avatar-' + req.user.id + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ storage });

// Helper function to convert avatar path to full URL
const getAvatarUrl = (avatar) => {
  if (!avatar) return "";
  if (avatar.startsWith("http")) return avatar; // Đã là URL đầy đủ (ví dụ từ Google)
  return `http://localhost:5000${avatar}`; // Chuyển path tương đối thành URL đầy đ�?
};

const createAccessToken = (user) => {
  const secret = process.env.JWT_SECRET;
  return jwt.sign({ id: user._id, email: user.email, name: user.name }, secret, {
    expiresIn: process.env.JWT_EXPIRES_IN || "1d",
  });
};

const createRefreshToken = (user) => {
  const secret = process.env.JWT_SECRET;
  return jwt.sign({ id: user._id }, secret, {
    expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || "7d",
  });
};

// Đăng ký người dùng mới
export const register = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      console.log("Đăng ký thất bại: thiếu thông tin bắt buộc");
      return res.status(400).json({ message: "Name, email and password are required" });
    }

    const existing = await User.findOne({ email: email.toLowerCase().trim() });
    if (existing) {
      console.log(`Đăng ký thất bại: email đã tồn tại (${email})`);
      return res.status(409).json({ message: "Email already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password: hashedPassword,
    });

    console.log(`Tạo tài khoản mới thành công cho email=${user.email}`);
    res.status(201).json({
      message: "Account created successfully",
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        avatar: getAvatarUrl(user.avatar),
        learningGoal: user.learningGoal,
        level: user.level,
      },
    });
  } catch (error) {
    console.error("Lỗi khi đăng ký user:", error.message);
    next(error);
  }
};

// Đăng nhập bằng email và mật khẩu
export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      console.log("Đăng nhập thất bại: thiếu email hoặc password");
      return res.status(400).json({ message: "Email and password are required" });
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() }).select("+password");
    if (!user) {
      console.log(`Đăng nhập thất bại: không tìm thấy user với email=${email}`);
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      console.log(`Đăng nhập thất bại: mật khẩu không đúng cho email=${email}`);
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const token = createAccessToken(user);
    const refreshToken = createRefreshToken(user);

    user.refreshTokens = [...new Set([...(user.refreshTokens || []), refreshToken])];
    await user.save();

    console.log(`Đăng nhập thành công cho user=${email}`);
    res.json({
      token,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        avatar: getAvatarUrl(user.avatar),
        learningGoal: user.learningGoal,
        level: user.level,
      },
    });
  } catch (error) {
    console.error("Lỗi khi đăng nhập:", error.message);
    next(error);
  }
};

export const googleLogin = async (req, res, next) => {
  try {
    const { credential } = req.body;
    if (!credential) {
      console.log("Google login thất bại: thiếu credential");
      return res.status(400).json({ message: "Google credential is required" });
    }

    const clientId = process.env.GOOGLE_CLIENT_ID || process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
    if (!clientId) {
      console.error("Google client ID chưa được cấu hình");
      return res.status(500).json({ message: "Google client ID is not configured" });
    }

    const client = new OAuth2Client(clientId);
    const ticket = await client.verifyIdToken({ idToken: credential, audience: clientId });
    const payload = ticket.getPayload();
    if (!payload || !payload.email) {
      console.log("Google credential không hợp lệ hoặc thiếu email");
      return res.status(400).json({ message: "Failed to verify Google credential" });
    }

    const email = payload.email.toLowerCase().trim();
    const name = payload.name || email.split("@")[0];
    const googleId = payload.sub;
    const avatar = payload.picture || "";

    let user = await User.findOne({ email });
    if (!user) {
      user = await User.create({
        name,
        email,
        googleId,
        avatar,
      });
      console.log(`Tạo user mới từ Google account: ${email}`);
    } else if (!user.googleId) {
      user.googleId = googleId;
      user.avatar = avatar;
      await user.save();
      console.log(`Cập nhật Google ID cho user hiện có: ${email}`);
    }

    const token = createAccessToken(user);
    const refreshToken = createRefreshToken(user);

    user.refreshTokens = [...new Set([...(user.refreshTokens || []), refreshToken])];
    await user.save();

    console.log(`Google login thành công cho email=${email}`);
    res.json({
      token,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        avatar: getAvatarUrl(user.avatar),
        learningGoal: user.learningGoal,
        level: user.level,
      },
    });
  } catch (error) {
    console.error("Lỗi Google login:", error.message);
    next(error);
  }
};

export const refreshToken = async (req, res, next) => {
  try {
    const incoming = req.body.refreshToken || req.headers["x-refresh-token"] || req.headers.authorization;
    const refreshToken = typeof incoming === "string" && incoming.startsWith("Bearer ")
      ? incoming.split(" ")[1]
      : incoming;

    if (!refreshToken) {
      console.log("Yêu cầu refresh token nhưng không cung cấp token");
      return res.status(400).json({ message: "Refresh token is required" });
    }

    const secret = process.env.JWT_SECRET;
    const decoded = jwt.verify(refreshToken, secret);
    const user = await User.findById(decoded.id);
    if (!user || !user.refreshTokens.includes(refreshToken)) {
      console.log("Refresh token không hợp lệ hoặc đã bị thu hồi");
      return res.status(401).json({ message: "Invalid refresh token" });
    }

    const token = createAccessToken(user);
    const newRefreshToken = createRefreshToken(user);

    user.refreshTokens = user.refreshTokens.filter((token) => token !== refreshToken);
    user.refreshTokens.push(newRefreshToken);
    await user.save();

    console.log(`Cấp lại token mới cho user=${user.email}`);
    res.json({ token, refreshToken: newRefreshToken });
  } catch (error) {
    console.error("Lỗi khi refresh token:", error.message);
    next(error);
  }
};

export const logout = async (req, res, next) => {
  try {
    const incoming = req.body.refreshToken || req.headers["x-refresh-token"] || req.headers.authorization;
    const refreshToken = typeof incoming === "string" && incoming.startsWith("Bearer ")
      ? incoming.split(" ")[1]
      : incoming;

    if (!refreshToken) {
      console.log("Logout thất bại: thiếu refresh token");
      return res.status(400).json({ message: "Refresh token is required" });
    }

    const secret = process.env.JWT_SECRET;
    const decoded = jwt.verify(refreshToken, secret);
    const user = await User.findById(decoded.id);
    if (user) {
      user.refreshTokens = (user.refreshTokens || []).filter((token) => token !== refreshToken);
      await user.save();
      console.log(`User ${user.email} đã logout và refresh token đã được xóa`);
    }

    res.json({ message: "Logged out successfully" });
  } catch (error) {
    console.error("Lỗi khi logout:", error.message);
    next(error);
  }
};

export const getProfile = async (req, res, next) => {
  try {
    const user = req.user;
    console.log(`Lấy profile của user=${user.email}`);
    res.json({ 
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        avatar: getAvatarUrl(user.avatar),
        learningGoal: user.learningGoal,
        level: user.level,
      }
    });
  } catch (error) {
    console.error("Lỗi khi lấy profile:", error.message);
    next(error);
  }
};

export const updateProfile = [
  upload.single('avatar'),
  async (req, res, next) => {
    try {
      const updates = {};
      const { name, email } = req.body;

      if (name) updates.name = name;
      if (email) {
        // Kiểm tra email đã có người dùng khác s�?dụng chưa
        const existingUser = await User.findOne({
          email: email.toLowerCase().trim(),
          _id: { $ne: req.user.id }
        });
        if (existingUser) {
          console.log(`Cập nhật profile thất bại: email đã tồn tại (${email})`);
          return res.status(409).json({ message: "Email already exists" });
        }
        updates.email = email.toLowerCase().trim();
      }
      if (req.body.learningGoal !== undefined) {
        updates.learningGoal = req.body.learningGoal;
      }
      if (req.body.level) {
        updates.level = req.body.level;
      }

      // X�?lý upload ảnh đại diện
      if (req.file) {
        updates.avatar = `/uploads/avatars/${req.file.filename}`;
      }

      const user = await User.findByIdAndUpdate(req.user.id, updates, { new: true }).select("-password");
      console.log(`Cập nhật profile thành công cho user=${user.email}`);
      res.json({ 
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          avatar: getAvatarUrl(user.avatar),
          learningGoal: user.learningGoal,
          level: user.level,
        }
      });
    } catch (error) {
      console.error("Lỗi khi cập nhật profile:", error.message);
      next(error);
    }
  }
];

export const deleteProfile = async (req, res, next) => {
  try {
    // Xóa người dùng khỏi h�?thống
    await User.findByIdAndDelete(req.user.id);
    console.log(`Xóa tài khoản thành công cho userId=${req.user.id}`);

    res.json({ message: "Account deleted successfully" });
  } catch (error) {
    console.error("Lỗi khi xóa profile:", error.message);
    next(error);
  }
};

// ============ EMAIL VERIFICATION ============

/**
 * Xác thực email - người dùng nhấp link trong email
 * POST /api/auth/verify-email
 */
export const verifyEmail = async (req, res, next) => {
  try {
    const { token } = req.body;
    if (!token) {
      console.log("[EMAIL] ❌ Verify email thất bại: thiếu token");
      return res.status(400).json({ message: "Verification token is required" });
    }

    // Tìm user có token này và token chưa hết hạn
    const user = await User.findOne({
      emailVerificationToken: token,
      emailVerificationTokenExpires: { $gt: new Date() },
    });

    if (!user) {
      console.log("[EMAIL] ❌ Verify email thất bại: token không hợp lệ hoặc đã hết hạn");
      return res.status(400).json({ message: "Invalid or expired verification token" });
    }

    // Đánh dấu email đã verified
    user.isEmailVerified = true;
    user.emailVerificationToken = null;
    user.emailVerificationTokenExpires = null;
    await user.save();

    console.log(`[EMAIL] ✅ Xác thực email thành công cho ${user.email}`);
    res.json({ message: "Email verified successfully" });
  } catch (error) {
    console.error("[EMAIL] ❌ Lỗi xác thực email:", error.message);
    next(error);
  }
};

/**
 * Gửi lại email xác thực (nếu người dùng không nhận được lần đầu)
 * POST /api/auth/resend-verification-email
 */
export const resendVerificationEmail = async (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email) {
      console.log("[EMAIL] ❌ Resend verification thất bại: thiếu email");
      return res.status(400).json({ message: "Email is required" });
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) {
      console.log(`[EMAIL] ❌ Resend verification thất bại: không tìm thấy user ${email}`);
      return res.status(404).json({ message: "User not found" });
    }

    if (user.isEmailVerified) {
      console.log(`[EMAIL] ℹ️ Email đã được xác thực cho ${email}`);
      return res.json({ message: "Email is already verified" });
    }

    // Tạo token mới
    const verificationToken = generateVerificationToken();
    user.emailVerificationToken = verificationToken;
    user.emailVerificationTokenExpires = getTokenExpiry(30); // 30 phút
    await user.save();

    // Gửi email
    await sendVerificationEmail(user.email, verificationToken, user.name);

    console.log(`[EMAIL] ✅ Gửi lại verification email cho ${email}`);
    res.json({ message: "Verification email sent" });
  } catch (error) {
    console.error("[EMAIL] ❌ Lỗi gửi lại verification email:", error.message);
    next(error);
  }
};

// ============ PASSWORD RESET ============

/**
 * Yêu cầu reset password (gửi email)
 * POST /api/auth/forgot-password
 */
export const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email) {
      console.log("[RESET] �?Forgot password thất bại: thiếu email");
      return res.status(400).json({ message: "Email is required" });
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) {
      // Không tiết l�?email có tồn tại hay không (bảo mật)
      console.log(`[RESET] ℹ️ Forgot password request cho email không tồn tại: ${email}`);
      return res.json({ message: "If email exists, reset link will be sent" });
    }

    // Tạo reset token
    const resetToken = generateResetToken();
    user.resetPasswordToken = resetToken;
    user.resetPasswordTokenExpires = getTokenExpiry(60); // 1 gi�?
    await user.save();

    // Gửi email
    await sendPasswordResetEmail(user.email, resetToken, user.name);

    console.log(`[RESET] �?Gửi password reset email cho ${email}`);
    res.json({ message: "Password reset email sent" });
  } catch (error) {
    console.error("[RESET] �?Lỗi forgot password:", error.message);
    next(error);
  }
};

/**
 * Đặt lại mật khẩu qua token t�?email
 * POST /api/auth/reset-password
 */
export const resetPassword = async (req, res, next) => {
  try {
    const { token, newPassword } = req.body;
    if (!token || !newPassword) {
      console.log("[RESET] �?Reset password thất bại: thiếu token hoặc newPassword");
      return res.status(400).json({ message: "Token and new password are required" });
    }

    if (newPassword.length < 6) {
      console.log("[RESET] �?Reset password thất bại: mật khẩu quá ngắn");
      return res.status(400).json({ message: "Password must be at least 6 characters" });
    }

    // Tìm user có token này và token chưa hết hạn
    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordTokenExpires: { $gt: new Date() },
    }).select("+password");

    if (!user) {
      console.log("[RESET] �?Reset password thất bại: token không hợp l�?hoặc đã hết hạn");
      return res.status(400).json({ message: "Invalid or expired reset token" });
    }

    // Cập nhật mật khẩu
    user.password = await bcrypt.hash(newPassword, 10);
    user.resetPasswordToken = null;
    user.resetPasswordTokenExpires = null;
    await user.save();

    console.log(`[RESET] �?Reset password thành công cho ${user.email}`);
    res.json({ message: "Password reset successfully" });
  } catch (error) {
    console.error("[RESET] �?Lỗi reset password:", error.message);
    next(error);
  }
};

// ============ TWO-FACTOR AUTHENTICATION (2FA) ============

/**
 * Bước 1: Tạo 2FA - tr�?v�?QR code đ�?scan
 * POST /api/auth/2fa/setup (requires authentication)
 */
export const setupTwoFactorAuth = async (req, res, next) => {
  try {
    const user = req.user;
    
    if (user.twoFactorEnabled) {
      console.log(`[2FA] ⚠️ Setup 2FA thất bại: 2FA đã được bật cho ${user.email}`);
      return res.status(400).json({ message: "2FA is already enabled" });
    }

    // Tạo TOTP secret
    const { secret, qrCodeUrl, manualEntryKey } = await generateTOTPSecret(user.email);

    console.log(`[2FA] �?Tạo TOTP secret cho ${user.email}`);
    res.json({
      message: "2FA setup initiated",
      qrCodeUrl,
      manualEntryKey,
      // secret không tr�?v�?frontend đ�?bảo mật
    });
  } catch (error) {
    console.error("[2FA] �?Lỗi setup 2FA:", error.message);
    next(error);
  }
};

/**
 * Bước 2: Xác minh 2FA - người dùng nhập 6 ch�?s�?t�?authenticator
 * POST /api/auth/2fa/enable (requires authentication)
 * Body: { totpCode: "123456" }
 */
export const enableTwoFactorAuth = async (req, res, next) => {
  try {
    const user = req.user;
    const { totpCode } = req.body;

    if (!totpCode) {
      console.log("[2FA] �?Enable 2FA thất bại: thiếu TOTP code");
      return res.status(400).json({ message: "TOTP code is required" });
    }

    if (user.twoFactorEnabled) {
      console.log(`[2FA] ⚠️ Enable 2FA thất bại: 2FA đã được bật cho ${user.email}`);
      return res.status(400).json({ message: "2FA is already enabled" });
    }

    // Frontend s�?gửi secret với TOTP code, nhưng tốt hơn là:
    // Frontend lưu secret temporary, gửi TOTP code, backend verify, 
    // rồi frontend gửi request tiếp theo với confirm

    // Với kiến trúc hiện tại, tôi s�?gi�?s�?frontend gửi secret tạm thời
    // Hoặc là setup 2FA là một process 2-step
    
    console.log("[2FA] ⚠️ Enable 2FA: cần implement 2-step flow");
    res.status(400).json({ message: "Enable 2FA requires 2-step flow - please use setup endpoint first" });
  } catch (error) {
    console.error("[2FA] �?Lỗi enable 2FA:", error.message);
    next(error);
  }
};

/**
 * Hoàn tất 2FA setup sau khi user xác minh TOTP code
 * POST /api/auth/2fa/confirm (requires authentication)
 * Body: { totpCode: "123456", secret: "BASE32SECRET" }
 */
export const confirmTwoFactorAuth = async (req, res, next) => {
  try {
    const user = req.user;
    const { totpCode, secret } = req.body;

    if (!totpCode || !secret) {
      console.log("[2FA] �?Confirm 2FA thất bại: thiếu TOTP code hoặc secret");
      return res.status(400).json({ message: "TOTP code and secret are required" });
    }

    // Xác minh TOTP code
    const isValidCode = verifyTOTPToken(secret, totpCode);
    if (!isValidCode) {
      console.log("[2FA] ❌ Confirm 2FA thất bại: TOTP code không hợp lệ");
      return res.status(400).json({ message: "Invalid TOTP code" });
    }

    // Tạo backup codes
    const backupCodes = generateBackupCodes();

    // Lưu vào database
    user.twoFactorSecret = secret;
    user.twoFactorBackupCodes = backupCodes;
    user.twoFactorEnabled = true;
    user.twoFactorLastVerified = new Date();
    await user.save();

    // Gửi email thông báo
    const backupCodesStr = backupCodes.map(bc => bc.code).join("\n");
    await send2FASetupEmail(user.email, user.name, backupCodesStr);

    console.log(`[2FA] �?Enable 2FA thành công cho ${user.email}`);
    res.json({
      message: "2FA enabled successfully",
      backupCodes: backupCodes.map(bc => bc.code), // Ch�?code, không status
      warning: "Save these backup codes in a safe place. You will need them if you lose access to your authenticator app."
    });
  } catch (error) {
    console.error("[2FA] �?Lỗi confirm 2FA:", error.message);
    next(error);
  }
};

/**
 * Xác minh TOTP code khi đăng nhập (nếu user bật 2FA)
 * POST /api/auth/2fa/verify (không cần authentication vì gọi lúc login)
 * Body: { userId: "...", totpCode: "123456" hoặc backupCode: "XXXXXXXXXX" }
 */
export const verifyTwoFactorCode = async (req, res, next) => {
  try {
    const { userId, totpCode, backupCode } = req.body;

    if (!userId || (!totpCode && !backupCode)) {
      console.log("[2FA] �?Verify 2FA thất bại: thiếu userId hoặc code");
      return res.status(400).json({ message: "userId and TOTP code or backup code are required" });
    }

    const user = await User.findById(userId).select("+twoFactorSecret");
    if (!user || !user.twoFactorEnabled) {
      console.log("[2FA] �?Verify 2FA thất bại: user không bật 2FA");
      return res.status(400).json({ message: "2FA not enabled for this user" });
    }

    let isValid = false;

    // Nếu người dùng gửi TOTP code
    if (totpCode) {
      isValid = verifyTOTPToken(user.twoFactorSecret, totpCode);
    }

    // Nếu người dùng gửi backup code
    if (!isValid && backupCode) {
      const result = verifyBackupCode(user.twoFactorBackupCodes, backupCode);
      if (result.isValid) {
        // Đánh dấu backup code là đã dùng
        user.twoFactorBackupCodes[result.index].used = true;
        await user.save();
        isValid = true;
        console.log(`[2FA] �?Backup code hợp l�?cho ${user.email}`);
      }
    }

    if (!isValid) {
      console.log(`[2FA] �?Verify 2FA thất bại: code không hợp l�?cho ${user.email}`);
      return res.status(400).json({ message: "Invalid TOTP code or backup code" });
    }

    // Cập nhật lần cuối xác minh
    user.twoFactorLastVerified = new Date();
    await user.save();

    console.log(`[2FA] �?Verify 2FA code thành công cho ${user.email}`);
    res.json({ message: "2FA code verified successfully" });
  } catch (error) {
    console.error("[2FA] �?Lỗi verify 2FA code:", error.message);
    next(error);
  }
};

/**
 * Tắt 2FA
 * POST /api/auth/2fa/disable (requires authentication)
 * Body: { password: "current_password" } - yêu cầu xác nhận mật khẩu
 */
export const disableTwoFactorAuth = async (req, res, next) => {
  try {
    const user = req.user;
    const { password } = req.body;

    if (!password) {
      console.log("[2FA] �?Disable 2FA thất bại: thiếu password xác nhân");
      return res.status(400).json({ message: "Password confirmation is required" });
    }

    if (!user.twoFactorEnabled) {
      console.log(`[2FA] ⚠️ Disable 2FA thất bại: 2FA chưa được bật cho ${user.email}`);
      return res.status(400).json({ message: "2FA is not enabled" });
    }

    // Xác minh mật khẩu
    const userWithPassword = await User.findById(user._id).select("+password");
    const isPasswordValid = await bcrypt.compare(password, userWithPassword.password);

    if (!isPasswordValid) {
      console.log(`[2FA] �?Disable 2FA thất bại: mật khẩu không đúng cho ${user.email}`);
      return res.status(401).json({ message: "Invalid password" });
    }

    // Tắt 2FA
    userWithPassword.twoFactorEnabled = false;
    userWithPassword.twoFactorSecret = null;
    userWithPassword.twoFactorBackupCodes = [];
    userWithPassword.twoFactorLastVerified = null;
    await userWithPassword.save();

    // Gửi email thông báo
    await send2FADisabledEmail(user.email, user.name);

    console.log(`[2FA] �?Disable 2FA thành công cho ${user.email}`);
    res.json({ message: "2FA disabled successfully" });
  } catch (error) {
    console.error("[2FA] �?Lỗi disable 2FA:", error.message);
    next(error);
  }
};

