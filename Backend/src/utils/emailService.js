import nodemailer from "nodemailer";

/**
 * Email Service - Gửi email xác thực, reset password, 2FA
 * Sử dụng Nodemailer với Gmail SMTP hoặc custom SMTP
 */

// Cấu hình transporter
const transporter = nodemailer.createTransport({
  service: process.env.EMAIL_SERVICE || "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
});

/**
 * Gửi email xác thực tài khoản
 * @param {string} email - Email người dùng
 * @param {string} verificationToken - Token xác thực
 * @param {string} userName - Tên người dùng
 */
export const sendVerificationEmail = async (email, verificationToken, userName) => {
  try {
    const verificationUrl = `${process.env.FRONTEND_URL}/verify-email?token=${verificationToken}`;
    
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: "🎓 Learning App - Xác Nhận Email Của Bạn",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #4CAF50;">Chào mừng ${userName}! 👋</h2>
          <p>Cảm ơn bạn đã đăng ký Learning App.</p>
          <p>Vui lòng xác nhận email của bạn bằng cách nhấp vào link dưới đây:</p>
          <p>
            <a href="${verificationUrl}" style="display: inline-block; padding: 10px 20px; background-color: #4CAF50; color: white; text-decoration: none; border-radius: 5px;">
              ✓ Xác Nhận Email
            </a>
          </p>
          <p style="color: #666; font-size: 12px;">
            Link này sẽ hết hạn trong 30 phút.<br>
            Nếu bạn không đăng ký Learning App, vui lòng bỏ qua email này.
          </p>
          <hr>
          <p style="color: #999; font-size: 12px;">Learning App Team</p>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);
    console.log(`[EMAIL] ✅ Gửi verification email thành công tới ${email}`);
  } catch (error) {
    console.error(`[EMAIL] ❌ Lỗi gửi verification email:`, error.message);
    throw error;
  }
};

/**
 * Gửi email reset password
 * @param {string} email - Email người dùng
 * @param {string} resetToken - Token reset password
 * @param {string} userName - Tên người dùng
 */
export const sendPasswordResetEmail = async (email, resetToken, userName) => {
  try {
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;
    
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: "🔐 Learning App - Đặt Lại Mật Khẩu",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #FF9800;">Đặt Lại Mật Khẩu 🔐</h2>
          <p>Chào ${userName},</p>
          <p>Chúng tôi nhận được yêu cầu đặt lại mật khẩu cho tài khoản của bạn.</p>
          <p>Nhấp vào link dưới đây để đặt lại mật khẩu:</p>
          <p>
            <a href="${resetUrl}" style="display: inline-block; padding: 10px 20px; background-color: #FF9800; color: white; text-decoration: none; border-radius: 5px;">
              🔑 Đặt Lại Mật Khẩu
            </a>
          </p>
          <p style="color: #666; font-size: 12px;">
            Link này sẽ hết hạn trong 1 giờ.<br>
            Nếu bạn không yêu cầu đặt lại mật khẩu, vui lòng bỏ qua email này.
          </p>
          <hr>
          <p style="color: #999; font-size: 12px;">Learning App Team</p>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);
    console.log(`[EMAIL] ✅ Gửi password reset email thành công tới ${email}`);
  } catch (error) {
    console.error(`[EMAIL] ❌ Lỗi gửi password reset email:`, error.message);
    throw error;
  }
};

/**
 * Gửi email thông báo 2FA được kích hoạt
 * @param {string} email - Email người dùng
 * @param {string} userName - Tên người dùng
 * @param {string} backupCodes - Backup codes (cách nhau bởi dòng mới)
 */
export const send2FASetupEmail = async (email, userName, backupCodes) => {
  try {
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: "🛡️ Learning App - Two-Factor Authentication Đã Bật",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2196F3;">Two-Factor Authentication Đã Bật 🛡️</h2>
          <p>Chào ${userName},</p>
          <p>Two-Factor Authentication (2FA) đã được bật cho tài khoản của bạn.</p>
          <p><strong>Lưu trữ các backup codes dưới đây ở nơi an toàn:</strong></p>
          <pre style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; overflow-x: auto;">
${backupCodes}
          </pre>
          <p style="color: #d32f2f; font-weight: bold;">⚠️ Quan Trọng:</p>
          <ul>
            <li>Nếu mất quyền truy cập vào authenticator app, bạn có thể sử dụng các backup codes này</li>
            <li>Mỗi backup code chỉ có thể sử dụng một lần</li>
            <li>Lưu các codes này ở nơi an toàn trước khi đóng email này</li>
          </ul>
          <hr>
          <p style="color: #999; font-size: 12px;">Learning App Team</p>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);
    console.log(`[EMAIL] ✅ Gửi 2FA setup email thành công tới ${email}`);
  } catch (error) {
    console.error(`[EMAIL] ❌ Lỗi gửi 2FA setup email:`, error.message);
    throw error;
  }
};

/**
 * Gửi email thông báo 2FA bị vô hiệu hóa
 * @param {string} email - Email người dùng
 * @param {string} userName - Tên người dùng
 */
export const send2FADisabledEmail = async (email, userName) => {
  try {
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: "🔓 Learning App - Two-Factor Authentication Đã Tắt",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #d32f2f;">Two-Factor Authentication Đã Tắt 🔓</h2>
          <p>Chào ${userName},</p>
          <p>Two-Factor Authentication đã được tắt trên tài khoản của bạn.</p>
          <p style="color: #666;">Nếu bạn không thực hiện tác vụ này, vui lòng liên hệ với chúng tôi ngay để bảo vệ tài khoản.</p>
          <hr>
          <p style="color: #999; font-size: 12px;">Learning App Team</p>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);
    console.log(`[EMAIL] ✅ Gửi 2FA disabled email thành công tới ${email}`);
  } catch (error) {
    console.error(`[EMAIL] ❌ Lỗi gửi 2FA disabled email:`, error.message);
    throw error;
  }
};

export default {
  sendVerificationEmail,
  sendPasswordResetEmail,
  send2FASetupEmail,
  send2FADisabledEmail,
};
