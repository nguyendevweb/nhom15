import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import authRoutes from "./routes/auth.js";
import setRoutes from "./routes/set.js";
import vocabularyRoutes from "./routes/vocabulary.js";
import studyRoutes from "./routes/study.js";
import { errorHandler } from "./middleware/errorHandler.js";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Cấu hình CORS để cho phép frontend ở localhost:3000 truy cập
const corsOptions = {
  origin: "http://localhost:3000",
  credentials: true,
};

app.use(cors(corsOptions));
app.options("*", cors(corsOptions));
app.use(cookieParser());
app.use(express.json());
console.log("Middlewares đã được cấu hình: CORS, cookie parser, JSON parser");

// Phục vụ file tĩnh từ thư mục uploads
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Đăng ký route API chính
app.use("/api/auth", authRoutes);
app.use("/api/set", setRoutes);
app.use("/api/vocabulary", vocabularyRoutes);
app.use("/api/study", studyRoutes);

app.get("/api/status", (req, res) => {
  console.log("Kiểm tra trạng thái API /api/status");
  res.json({ status: "ok", message: "Backend is running" });
});

app.use(errorHandler);

export default app;
