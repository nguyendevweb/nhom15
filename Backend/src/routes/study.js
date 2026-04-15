import express from "express";
import {
  createStudySession,
  getStudySession,
  getUserStudySessions,
  getDueCards,
  submitAnswer,
  completeStudySession,
  getStudyStatistics,
} from "../controllers/studyController.js";
import { authenticate } from "../middleware/auth.js";

const router = express.Router();

// Tất cả route study yêu cầu người dùng đã xác thực
router.use(authenticate);

router.post("/", createStudySession);
router.get("/", getUserStudySessions);
router.get("/due", getDueCards);
router.get("/stats", getStudyStatistics);
router.get("/:id", getStudySession);
router.put("/:id/complete", completeStudySession);
router.post("/:id/answer", submitAnswer);

export default router;