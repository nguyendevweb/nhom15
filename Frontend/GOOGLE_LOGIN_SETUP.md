# Hướng dẫn cấu hình Google Login

## 1. Tạo Google OAuth 2.0 Client ID

### Bước 1: Truy cập Google Cloud Console
- Đi đến: https://console.cloud.google.com/
- Đăng nhập với tài khoản Google của bạn

### Bước 2: Tạo Project mới (nếu chưa có)
- Click "Select a project" → "NEW PROJECT"
- Nhập tên project (vd: "Quizlet Clone")
- Click "CREATE"

### Bước 3: Kích hoạt Google+ API
- Vào "APIs & Services" → "Library"
- Tìm "Google+ API"
- Click vào nó → "ENABLE"

### Bước 4: Tạo OAuth 2.0 Credentials
- Vào "APIs & Services" → "Credentials"
- Click "Create Credentials" → "OAuth client ID"
- Chọn "Application type: Web application"
- Trong "Authorized JavaScript origins", thêm:
  - http://localhost:3000 (cho development)
  - http://localhost:3001 (nếu cần)
- Trong "Authorized redirect URIs", thêm:
  - http://localhost:3000/
  - http://localhost:3000/login
- Click "CREATE"

### Bước 5: Copy Client ID
- Bạn sẽ thấy popup hiện "Your Client ID"
- Copy Client ID này

## 2. Cấu hình Frontend

### Bước 1: Thêm Client ID vào .env.local
```bash
# File: .env.local
NEXT_PUBLIC_GOOGLE_CLIENT_ID=YOUR_GOOGLE_CLIENT_ID_HERE
```

Hãy thay `YOUR_GOOGLE_CLIENT_ID_HERE` bằng Client ID bạn vừa copy

### Bước 2: Khởi động development server
```bash
npm run dev
```

## 3. Cấu hình Backend

Backend cần có endpoint `/api/auth/google` để xác minh Google Token và trả về user data

### Ví dụ (Node.js/Express):
```javascript
app.post('/api/auth/google', async (req, res) => {
  const { credential } = req.body;

  try {
    // Xác minh Google Token
    const ticket = await client.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    const { email, name, picture } = payload;

    // Tìm hoặc tạo user trong database
    let user = await User.findOne({ email });
    if (!user) {
      user = await User.create({
        email,
        name,
        avatar: picture,
        googleId: payload.sub,
      });
    }

    // Tạo JWT token
    const token = jwt.sign({ id: user._id, email: user.email }, process.env.JWT_SECRET);

    res.json({
      token,
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        avatar: user.avatar,
      },
    });
  } catch (error) {
    console.error('Google login error:', error);
    res.status(401).json({ message: 'Invalid Google token' });
  }
});
```

## 4. Test Google Login

1. Mở http://localhost:3000/login
2. Nhấp vào "Sign in with Google"
3. Đăng nhập với tài khoản Google của bạn
4. Bạn sẽ được chuyển hướng về home page nếu thành công

## Lưu ý quan trọng

- **Development**: Client ID chỉ hoạt động với `localhost`
- **Production**: Bạn cần thêm domain production vào OAuth settings
- **Environment Variable**: Phải có prefix `NEXT_PUBLIC_` để sử dụng ở client-side
- **Backend Secret**: Backend cần có `GOOGLE_CLIENT_ID` và JWT secret trong biến môi trường

## Xử lý lỗi phổ biến

| Lỗi | Nguyên nhân | Giải pháp |
|-----|-----------|---------|
| "Google login is not configured" | Client ID không được thiết lập | Thêm NEXT_PUBLIC_GOOGLE_CLIENT_ID vào .env.local |
| CORS error | Backend không cho phép request từ frontend | Cấu hình CORS trên backend |
| "Invalid Google token" | Token hết hạn hoặc sai | Kiểm tra backend xác minh token |
| Không được redirect | Endpoint Google login không tồn tại | Kiểm tra backend có endpoint `/api/auth/google` |

## Tài liệu tham khảo

- [Google OAuth Documentation](https://developers.google.com/identity/protocols/oauth2)
- [React OAuth Google Library](https://www.npmjs.com/package/@react-oauth/google)
- [Next.js Environment Variables](https://nextjs.org/docs/basic-features/environment-variables)
