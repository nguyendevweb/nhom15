import crypto from "crypto";
import speakeasy from "speakeasy";
import QRCode from "qrcode";

/**
 * Token & 2FA Utils - Hỗ trợ security features
 * Bao gồm: token generation, 2FA setup, TOTP validation
 */

/**
 * Tạo email verification token (32 ký tự ngẫu nhiên)
 */
export const generateVerificationToken = () => {
  return crypto.randomBytes(16).toString("hex");
};

/**
 * Tạo password reset token (32 ký tự ngẫu nhiên)
 */
export const generateResetToken = () => {
  return crypto.randomBytes(16).toString("hex");
};

/**
 * Tạo TOTP secret cho 2FA (Google Authenticator compatible)
 * @returns {Object} { secret, qrCodeUrl }
 */
export const generateTOTPSecret = async (email, appName = "Learning App") => {
  try {
    const secret = speakeasy.generateSecret({
      name: `${appName} (${email})`,
      issuer: appName,
      length: 32, // Base32 secret length
    });

    // Tạo QR Code để scan vào authenticator app
    const qrCodeUrl = await QRCode.toDataURL(secret.otpauth_url);

    console.log(`[2FA] 🔐 Tạo TOTP secret cho ${email}`);
    return {
      secret: secret.base32, // Secret key để lưu trong database
      qrCodeUrl, // QR code image để hiển thị frontend
      manualEntryKey: secret.base32, // Nếu user không thể scan QR
    };
  } catch (error) {
    console.error("[2FA] ❌ Lỗi tạo TOTP secret:", error.message);
    throw error;
  }
};

/**
 * Xác minh TOTP code (6 chữ số từ authenticator app)
 * @param {string} secret - Secret key từ database
 * @param {string} token - 6 chữ số từ authenticator app
 * @returns {boolean} true nếu code hợp lệ
 */
export const verifyTOTPToken = (secret, token) => {
  try {
    const isValid = speakeasy.totp.verify({
      secret: secret,
      encoding: "base32",
      token: token,
      window: 2, // Cho phép sai lệch 2 time window (±60 giây)
    });

    if (isValid) {
      console.log(`[2FA] ✅ TOTP token hợp lệ`);
    } else {
      console.log(`[2FA] ❌ TOTP token không hợp lệ`);
    }
    return isValid;
  } catch (error) {
    console.error("[2FA] ❌ Lỗi xác minh TOTP:", error.message);
    return false;
  }
};

/**
 * Tạo backup codes cho 2FA (8 codes, 10 chữ số mỗi cái)
 * @returns {Array} Mảng 8 backup codes
 */
export const generateBackupCodes = () => {
  const codes = [];
  for (let i = 0; i < 8; i++) {
    const code = crypto.randomBytes(5).toString("hex").toUpperCase().slice(0, 10);
    codes.push({
      code,
      used: false,
    });
  }
  console.log(`[2FA] 📋 Tạo 8 backup codes`);
  return codes;
};

/**
 * Xác minh backup code (dùng một lần)
 * @param {Array} backupCodes - Danh sách backup codes từ database
 * @param {string} code - Code người dùng nhập
 * @returns {Object} { isValid, index } - index để cập nhật status "used"
 */
export const verifyBackupCode = (backupCodes, code) => {
  const index = backupCodes.findIndex(
    (bc) => bc.code === code.toUpperCase() && !bc.used
  );

  if (index !== -1) {
    console.log(`[2FA] ✅ Backup code hợp lệ`);
    return { isValid: true, index };
  }

  console.log(`[2FA] ❌ Backup code không hợp lệ hoặc đã được sử dụng`);
  return { isValid: false, index: -1 };
};

/**
 * Kinetic token expiry time
 * @param {number} minutes - Số phút hết hạn (mặc định 30)
 * @returns {Date} Thời gian hết hạn
 */
export const getTokenExpiry = (minutes = 30) => {
  const expiry = new Date();
  expiry.setMinutes(expiry.getMinutes() + minutes);
  return expiry;
};

export default {
  generateVerificationToken,
  generateResetToken,
  generateTOTPSecret,
  verifyTOTPToken,
  generateBackupCodes,
  verifyBackupCode,
  getTokenExpiry,
};
