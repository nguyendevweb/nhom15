import api from "./api";

/**
 * Set Service - API client cho quản lý bộ flashcard (Set)
 * Cung cấp các method để lấy, tạo, cập nhật, xóa bộ thẻ
 */

/** Lấy tất cả bộ thẻ của người dùng */
export const getAllSets = () => api.get("/set");

/** Lấy thông tin chi tiết của một bộ thẻ */
export const getSetById = (id: string) => api.get(`/set/${id}`);

/** Tạo bộ thẻ mới */
export const createSet = (data: {
  title: string;
  description?: string;
  tags?: string[];
  category?: string;
  studyMode?: string;
  isPublic?: boolean;
  cards: { front: string; back: string }[];
}) => api.post("/set", data);

/** Cập nhật thông tin bộ thẻ */
export const updateSet = (
  id: string,
  data: {
    title?: string;
    description?: string;
    tags?: string[];
    category?: string;
    studyMode?: string;
    isPublic?: boolean;
    cards?: { front: string; back: string }[];
  }
) => api.put(`/set/${id}`, data);

/** Xóa bộ thẻ */
export const deleteSet = (id: string) => api.delete(`/set/${id}`);

/** Nhân bản bộ thẻ (tạo bản sao) */
export const duplicateSet = (id: string) => api.post(`/set/${id}/duplicate`);

/** Tìm kiếm bộ thẻ theo từ khóa */
export const searchSets = (query: string) => api.get(`/set/search?q=${encodeURIComponent(query)}`);

/** Lấy tất cả bộ thẻ của một người dùng cụ thể */
export const getSetsByUser = (userId: string) => api.get(`/set/user/${userId}`);

/** Thêm bộ thẻ vào danh sách yêu thích */
export const favoriteSet = (id: string) => api.post(`/set/${id}/favorite`);

/** Bỏ bộ thẻ khỏi danh sách yêu thích */
export const unfavoriteSet = (id: string) => api.delete(`/set/${id}/favorite`);