import dotenv from "dotenv";
import app from "./app.js";
import { connectDB } from "./config/db.js";

// Nạp biến môi trường từ .env
dotenv.config();

const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI;

if (!MONGO_URI) {
  console.error("Thiếu MONGO_URI trong biến môi trường.");
  process.exit(1);
}

console.log(`Chuẩn bị khởi động backend trên cổng ${PORT}`);
console.log(`Đường dẫn MongoDB: ${MONGO_URI}`);

connectDB(MONGO_URI)
  .then(() => {
    console.log("Kết nối MongoDB thành công, bắt đầu lắng nghe cổng...");
    app.listen(PORT, () => {
      console.log(`Backend server đang chạy tại http://localhost:${PORT}`);
    });
  })
  .catch((error) => {
    console.error("Khởi động server thất bại:", error);
    process.exit(1);
  });
