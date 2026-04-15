export const errorHandler = (err, req, res, next) => {
  console.error("Lỗi hệ thống xử lý request:", err);
  const statusCode = err.statusCode || 500;
  const message = err.message || "Internal server error";

  res.status(statusCode).json({
    message,
    errors: err.errors || undefined,
  });
};
