import axios from "axios";

/**
 * Axios API client cho backend
 * Tự động thêm JWT token vào header của mỗi request
 * Baseurl trỏ tới backend chạy trên localhost:5000
 */
const api = axios.create({
  baseURL: "http://localhost:5000/api",
});

/**
 * Interceptor request: tự động thêm JWT token vào header Authorization
 * Lấy token từ localStorage và gắn vào "Bearer <token>"
 */
api.interceptors.request.use((config) => {
  if (!config.headers?.Authorization) {
    // Lấy token từ localStorage (chỉ trên client-side)
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    if (token) {
      config.headers = config.headers ?? {};
      config.headers.Authorization = `Bearer ${token}`;
      console.log("[API] 🔓 Thêm JWT token vào header Authorization");
    }
  }
  return config;
});

export default api;