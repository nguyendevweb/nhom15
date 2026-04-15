import jwt from "jsonwebtoken";
import User from "../models/User.js";

/**
 * Middleware xác thực JWT
 * Kiểm tra token JWT trong header Authorization
 * Nếu token hợp lệ, lấy thông tin user và gắn vào req.user
 * Nếu không, trả lại lỗi 401 Unauthorized
 */
export const authenticate = async (req, res, next) => {
  try {
    // Lấy token từ header Authorization hoặc x-access-token
    // Format: "Bearer <token>"
    const authHeader = req.headers.authorization || req.headers["x-access-token"];
    if (!authHeader) {
      console.log("[AUTH] ❌ Yêu cầu xác thực nhưng không có header token");
      return res.status(401).json({ message: "Authentication required" });
    }

    // Tách token khỏi "Bearer " prefix nếu có
    const token = authHeader.startsWith("Bearer ")
      ? authHeader.split(" ")[1]
      : authHeader;

    if (!token) {
      console.log("[AUTH] ❌ Token xác thực bị thiếu trong header Authorization");
      return res.status(401).json({ message: "Authentication token missing" });
    }

    // Lấy JWT secret từ biến môi trường
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      console.error("[AUTH] ⚠️ JWT_SECRET chưa được cấu hình trong biến môi trường");
      return res.status(500).json({ message: "JWT secret is not configured" });
    }

    // Xác minh token và lấy payload
    const decoded = jwt.verify(token, secret);
    // Lấy thông tin user từ database (không lấy password)
    const user = await User.findById(decoded.id).select("-password");
    if (!user) {
      console.log("[AUTH] ❌ Token hợp lệ nhưng không tìm thấy user");
      return res.status(401).json({ message: "Invalid authentication token" });
    }

    // Gắn user vào request object để các route handler sử dụng
    req.user = user;
    console.log(`[AUTH] ✅ Xác thực thành công cho user ${user.email}`);
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      console.error("[AUTH] ❌ Token đã hết hiệu lực:", error.message);
      return res.status(401).json({ message: "Token expired" });
    } else if (error.name === 'JsonWebTokenError') {
      console.error("[AUTH] ❌ Token không hợp lệ:", error.message);
      return res.status(401).json({ message: "Invalid token" });
    }
    console.error("[AUTH] ❌ Xác thực thất bại:", error.message);
    return res.status(401).json({ message: "Invalid or expired token" });
  }
};
