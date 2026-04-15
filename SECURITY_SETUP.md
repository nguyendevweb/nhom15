# 🔐 Security Features Setup Guide

## Overview
Dự án đã được cập nhật với những tính năng bảo mật quan trọng:
- ✅ Email Verification
- ✅ Password Reset
- ✅ Two-Factor Authentication (2FA)
- ✅ Refresh Token (hoàn thiện)

---

## 📦 Installation Dependencies

Chạy lệnh sau để cài đặt các package cần thiết:

```bash
cd Backend
npm install nodemailer speakeasy qrcode
```

### Packages Added:
- **nodemailer**: Gửi email (Gmail, SendGrid, custom SMTP)
- **speakeasy**: Generate & verify TOTP (Time-based One-Time Password)
- **qrcode**: Tạo QR code cho authenticator app

---

## 🔧 Configuration (.env setup)

Thêm các biến môi trường sau vào file `.env`:

```env
# ============ EMAIL CONFIGURATION ============
# Gmail: 
#   - Enable 2-factor authentication
#   - Generate "App Password": https://myaccount.google.com/apppasswords
#   - Use app password as EMAIL_PASSWORD

EMAIL_SERVICE=gmail
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password

# Hoặc sử dụng SendGrid:
# EMAIL_SERVICE=SendGrid
# EMAIL_USER=apikey
# EMAIL_PASSWORD=your-sendgrid-api-key

# Frontend URL (cho email verification & password reset links)
FRONTEND_URL=http://localhost:3000

# ============ JWT CONFIGURATION ============
JWT_SECRET=your-super-secret-key-change-this
JWT_EXPIRES_IN=1d
JWT_REFRESH_EXPIRES_IN=7d

# ============ DATABASE ============
MONGO_URI=mongodb://localhost:27017/learning-app

# ============ GOOGLE OAUTH ============
GOOGLE_CLIENT_ID=your-google-client-id
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your-google-client-id
```

---

## 📧 Email Configuration Details

### Option 1: Gmail (Recommended for Testing)

1. **Enable 2-Factor Authentication**:
   - Vào: https://myaccount.google.com/security
   - Bật "2-Step Verification"

2. **Generate App Password**:
   - Vào: https://myaccount.google.com/apppasswords
   - Chọn "Mail" và "Windows Computer" (hoặc tùy theo thiết bị)
   - Sao chép 16 ký tự password

3. **Cấu hình .env**:
   ```env
   EMAIL_SERVICE=gmail
   EMAIL_USER=your-email@gmail.com
   EMAIL_PASSWORD=xxxx xxxx xxxx xxxx
   ```

### Option 2: SendGrid (Production)

1. Đăng ký tại: https://sendgrid.com
2. Tạo API key
3. Cấu hình .env:
   ```env
   EMAIL_SERVICE=SendGrid
   EMAIL_USER=apikey
   EMAIL_PASSWORD=SG.xxxxxxx
   ```

### Option 3: Custom SMTP
```env
EMAIL_SERVICE=SMTP
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_SECURE=false
EMAIL_USER=your-email@example.com
EMAIL_PASSWORD=your-password
```

---

## 🔑 API Endpoints

### Email Verification
```
POST /api/auth/verify-email
Body: { token: "verification-token-from-email" }
```

```
POST /api/auth/resend-verification-email
Body: { email: "user@example.com" }
```

### Password Reset
```
POST /api/auth/forgot-password
Body: { email: "user@example.com" }
Response: { message: "If email exists, reset link will be sent" }
```

```
POST /api/auth/reset-password
Body: { token: "reset-token-from-email", newPassword: "new-password" }
```

### Two-Factor Authentication (2FA)

**Step 1: Setup 2FA (Get QR Code)**
```
POST /api/auth/2fa/setup
Headers: { Authorization: "Bearer access-token" }
Response: {
  qrCodeUrl: "data:image/png;base64,...",
  manualEntryKey: "BASE32SECRET"
}
```

**Step 2: Confirm 2FA (Verify TOTP Code)**
```
POST /api/auth/2fa/confirm
Headers: { Authorization: "Bearer access-token" }
Body: { 
  totpCode: "123456",  // 6 digits from authenticator
  secret: "BASE32SECRET" // from QR code scan
}
Response: {
  backupCodes: ["XXXXXXXXXX", "XXXXXXXXXX", ...] // 8 codes
}
```

**Step 3: Verify 2FA at Login**
```
POST /api/auth/2fa/verify
Body: { 
  userId: "user-id",
  totpCode: "123456"  // OR
  // backupCode: "XXXXXXXXXX"  (nếu người dùng dùng backup)
}
```

**Disable 2FA**
```
POST /api/auth/2fa/disable
Headers: { Authorization: "Bearer access-token" }
Body: { password: "current-password" }
```

---

## 🎯 Frontend Implementation

### 1. Email Verification on Registration
```typescript
// Khi đăng ký thành công:
1. Hiển thị prompt: "Kiểm tra email để xác nhận tài khoản"
2. Gửi token từ email link tới /api/auth/verify-email
3. Sau xác nhận, cho phép đăng nhập
```

### 2. Forgot Password Flow
```typescript
1. User click "Quên mật khẩu?" → input email
2. POST /api/auth/forgot-password
3. User nhận email → click link → /reset-password?token=xxx
4. User nhập mật khẩu mới
5. POST /api/auth/reset-password với token mới
```

### 3. 2FA Setup Flow
```typescript
1. User bấm "Enable 2FA" trong settings
2. GET QR code từ POST /api/auth/2fa/setup
3. User scan with Google Authenticator / Authy / Microsoft Authenticator
4. User nhập 6 chữ số từ app → POST /api/auth/2fa/confirm
5. Hiển thị backup codes → User lưu lại
```

### 4. 2FA Login Flow
```typescript
1. User nhập email/password → login như bình thường
2. Backend kiểm tra user có 2FA chưa
3. Nếu có 2FA, yêu cầu TOTP code
4. User nhập code từ authenticator (hoặc backup code)
5. POST /api/auth/2fa/verify → nhận access token
```

---

## 🧪 Testing Email Features

### Test với MailHog (Local Email Tester)

```bash
# 1. Cài MailHog
# Mac: brew install mailhog
# Windows: Download từ https://github.com/mailhog/MailHog

# 2. Chạy MailHog
mailhog
# Inbox: http://localhost:1025
# API: http://localhost:1025

# 3. Cấu hình .env
EMAIL_SERVICE=SMTP
SMTP_HOST=localhost
SMTP_PORT=1025
SMTP_SECURE=false
EMAIL_USER=test
EMAIL_PASSWORD=test

# 4. Kiểm tra email tại: http://localhost:1025
```

Or use **Ethereal Email** (online fake email):

```bash
# Vào: https://ethereal.email
# Tạo account
# Sử dụng credentials trong .env
EMAIL_SERVICE=gmail (hoặc SMTP custom)
EMAIL_USER=your-ethereal-email
EMAIL_PASSWORD=your-ethereal-password
```

---

## 🔒 Security Best Practices

1. **Mật khẩu**: Tối thiểu 6 ký tự (nên tăng lên 8-12)
2. **Token Expiry**: 
   - Access token: 1 ngày
   - Refresh token: 7 ngày
   - Verification email: 30 phút
   - Reset password: 1 giờ

3. **2FA Backup Codes**:
   - Tạo 8 codes khi enable
   - Mỗi code dùng 1 lần
   - Nên lưu ở nơi an toàn (file, password manager)

4. **Database**:
   - Password luôn hash với bcrypt
   - Reset token không xóa ngay (lưu temporary)
   - 2FA secret chỉ select khi cần

---

## 📝 Database Schema Updates

User model đã được cập nhật với fields:

```javascript
// Email Verification
isEmailVerified: Boolean
emailVerificationToken: String
emailVerificationTokenExpires: Date

// Password Reset
resetPasswordToken: String
resetPasswordTokenExpires: Date

// 2FA
twoFactorEnabled: Boolean
twoFactorSecret: String (select: false)
twoFactorBackupCodes: [{ code, used }]
twoFactorLastVerified: Date

// Existing
refreshTokens: [String]
```

---

## 🚀 Production Checklist

- [ ] Update `FRONTEND_URL` để trỏ đúng domain
- [ ] Sử dụng SendGrid hoặc email service khác (không Gmail)
- [ ] Tăng mức độ phức tạp mật khẩu
- [ ] Rate limiting trên login/forgot-password endpoints
- [ ] HTTPS only
- [ ] Strong JWT secret (random string 32+ ký tự)
- [ ] Database backup
- [ ] Monitor email delivery

---

## 🐛 Troubleshooting

### Email không gửi được
1. Kiểm tra EMAIL_USER, EMAIL_PASSWORD
2. Gmail: Bật App Password, không sử dụng regular password
3. Check `.env` có leading/trailing spaces không
4. Kiểm tra NODE_ENV production/development

### TOTP Code không verify
1. Kiểm tra device time đúng không
2. Window time sai lệch ±1 (60 giây)
3. Secret key encoding (base32)
4. Authenticator app cài đúng

### Token hết hạn quá nhanh
1. Kiểm tra JWT_EXPIRES_IN
2. Kiểm tra server time (NTP sync)
3. Verify token signature không bị thay đổi

---

## 📖 References
- Nodemailer: https://nodemailer.com
- Speakeasy: https://github.com/speakeasyjs/speakeasy
- TOTP RFC: https://tools.ietf.org/html/rfc6238
- OWASP Auth Guidelines: https://cheatsheetseries.owasp.org

---

**Cần giúp? Check console logs với [AUTH], [EMAIL], [RESET], [2FA] tags**
