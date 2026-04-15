import api from "./api";

export const login = (data: { email: string; password: string }) => api.post("/auth/login", data);

export const register = (data: { email: string; password: string; name: string }) =>
  api.post("/auth/register", data);

export const googleLogin = (credential: string) => api.post("/auth/google", { credential });

export const logout = () => api.post("/auth/logout");

export const refreshToken = () => api.post("/auth/refresh");

export const updateProfile = (data: { name?: string; email?: string }) => api.put("/auth/profile", data);

export const getProfile = () => api.get("/auth/profile");