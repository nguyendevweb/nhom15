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
  config.headers = config.headers ?? {};
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  if (token) {
    config.headers["Authorization"] = `Bearer ${token}`;
    console.log("[API] 🔓 Thêm JWT token vào header Authorization");
  } else {
    console.warn("[API] ⚠️ Không tìm thấy token trong localStorage");
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error?.response?.status === 401) {
      console.error("[API] ❌ API returned 401 Unauthorized", error.response?.data?.message || error.message);
    }
    return Promise.reject(error);
  }
);

export default api;