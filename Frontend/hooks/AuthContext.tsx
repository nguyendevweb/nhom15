"use client";
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

/**
 * Interface User - Thông tin người dùng được lưu trong context
 */
interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string; // URL ảnh đại diện
  learningGoal?: string; // Mục tiêu học tập
  level?: string; // Trình độ tiếng Anh (A1-C2)
}

/**
 * Interface AuthContextType - Định nghĩa API của AuthContext
 * Cung cấp các method để đăng nhập, đăng ký, đăng xuất
 */
interface AuthContextType {
  user: User | null; // Thông tin user hiện tại
  token: string | null; // JWT token cho API requests
  isLoading: boolean; // Trạng thái đang tải
  error: string | null; // Thông báo lỗi
  login: (email: string, password: string) => Promise<void>; // Đăng nhập bằng email/password
  googleLogin: (credential: string) => Promise<void>; // Đăng nhập bằng Google OAuth
  register: (data: { email: string; password: string; name: string }) => Promise<void>; // Đăng ký tài khoản mới
  logout: () => void; // Đăng xuất
  updateProfile: (data: FormData) => Promise<void>; // Cập nhật thông tin profile
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

/**
 * AuthProvider - Component bao bọc ứng dụng để cung cấp auth context
 * Quản lý trạng thái đăng nhập toàn bộ ứng dụng
 */
export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /**
   * useEffect khởi tạo: Kiểm tra xem user đã đăng nhập chưa
   * (dựa trên localStorage - có thể tồn tại từ phiên đăng nhập cũ)
   */
  useEffect(() => {
    console.log("[AUTH] 🔍 Kiểm tra trạng thái đăng nhập tại localStorage");
    // Lấy token và user info từ localStorage
    const storedToken = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');
    if (storedToken && storedUser) {
      setToken(storedToken);
      setUser(JSON.parse(storedUser));
      console.log("[AUTH] ✅ Phục hồi phiên đăng nhập từ localStorage");
    } else {
      console.log("[AUTH] ℹ️ Không tìm thấy phiên đăng nhập được lưu");
    }
    setIsLoading(false);
  }, []);

  /**
   * Đăng nhập bằng email và password
   */
  const login = async (email: string, password: string) => {
    console.log(`[AUTH] 🔐 Đang đăng nhập với email=${email}`);
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch('http://localhost:5000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      if (!response.ok) {
        throw new Error('Email hoặc mật khẩu không chính xác');
      }
      const data = await response.json();
      setToken(data.token);
      setUser(data.user);
      // Lưu token và user vào localStorage để phục hồi phiên sau
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      console.log(`[AUTH] ✅ Đăng nhập thành công cho ${data.user.email}`);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Đăng nhập thất bại';
      setError(errorMessage);
      console.error(`[AUTH] ❌ Lỗi đăng nhập:`, errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Đăng nhập bằng Google OAuth credential
   */
  const googleLogin = async (credential: string) => {
    console.log("[AUTH] 🔐 Đang xác thực với Google OAuth");
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch('http://localhost:5000/api/auth/google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ credential }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Google login failed (${response.status})`);
      }

      const data = await response.json();

      if (!data.token || !data.user) {
        throw new Error('Invalid response from server');
      }

      setToken(data.token);
      setUser(data.user);
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      console.log(`[AUTH] ✅ Đăng nhập Google thành công cho ${data.user.email}`);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Đăng nhập Google thất bại';
      setError(errorMessage);
      console.error(`[AUTH] ❌ Lỗi Google login:`, errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Đăng ký tài khoản mới
   */
  const register = async (data: { email: string; password: string; name: string }) => {
    console.log(`[AUTH] 📝 Đăng ký tài khoản mới với email=${data.email}`);
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch('http://localhost:5000/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        throw new Error('Đăng ký tài khoản thất bại');
      }
      console.log(`[AUTH] ✅ Đăng ký thành công, vui lòng đăng nhập`);
      // Đăng ký thành công, không can thiệp vào trạng thái - user phải đăng nhập thủ công
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Đăng ký thất bại';
      setError(errorMessage);
      console.error(`[AUTH] ❌ Lỗi đăng ký:`, errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Cập nhật thông tin profile (avatar, learningGoal, level, etc.)
   * @param formData - FormData có thể chứa file ảnh đại diện
   */
  const updateProfile = async (formData: FormData) => {
    console.log("[AUTH] 🔄 Cập nhật thông tin profile");
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch('http://localhost:5000/api/auth/profile', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Cập nhật profile thất bại');
      }

      const data = await response.json();
      setUser(data.user);
      localStorage.setItem('user', JSON.stringify(data.user));
      console.log("[AUTH] ✅ Cập nhật profile thành công");
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Cập nhật profile thất bại';
      setError(errorMessage);
      console.error("[AUTH] ❌ Lỗi cập nhật profile:", errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Đăng xuất: xóa token, user và dữ liệu localStorage
   */
  const logout = () => {
    console.log("[AUTH] 👋 Đang đăng xuất");
    setUser(null);
    setToken(null);
    setError(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    console.log("[AUTH] ✅ Đăng xuất thành công");
  };

  return (
    <AuthContext.Provider value={{
      user,
      token,
      isLoading,
      error,
      login,
      googleLogin,
      register,
      logout,
      updateProfile,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

/**
 * Hook sử dụng auth context
 * @throws Error nếu được gọi ngoài AuthProvider
 */
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth phải được sử dụng bên trong AuthProvider');
  }
  return context;
};