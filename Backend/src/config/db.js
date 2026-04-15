import mongoose from "mongoose";

// Kết nối tới cơ sở dữ liệu MongoDB
export const connectDB = async (mongoUri) => {
  try {
    await mongoose.connect(mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("MongoDB đã kết nối thành công");
  } catch (error) {
    console.error("Lỗi kết nối MongoDB:", error);
    throw error;
  }
};
