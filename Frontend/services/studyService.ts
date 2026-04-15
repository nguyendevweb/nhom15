import api from "./api";

/**
 * Study Service - API client cho quản lý phiên học và thống kê
 * Cung cấp các method để lấy thống kê học tập
 */

/**
 * Lấy thống kê học tập của người dùng
 * @param period - Khoảng thời gian: 'week' (tuần), 'month' (tháng), 'year' (năm)
 * @returns Thống kê gồm: totalSessions, totalStudyTime, totalCardsStudied, 
 *          totalCorrect, averageAccuracy, retentionRate, studyStreak
 */
export const getStudyStats = (period = "week") => api.get(`/study/stats?period=${period}`);
