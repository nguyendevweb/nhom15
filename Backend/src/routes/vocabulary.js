import express from "express";
import multer from "multer";
import {
  getVocabulary,
  getVocabularyById,
  createVocabulary,
  updateVocabulary,
  deleteVocabulary,
  getVocabularySuggestions,
  importVocabulary,
  exportVocabulary,
} from "../controllers/vocabularyController.js";
import { authenticate } from "../middleware/auth.js";

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

// Public routes
router.get("/", getVocabulary);
router.get("/suggestions", getVocabularySuggestions);
router.get("/export", authenticate, exportVocabulary);
router.post("/import", authenticate, upload.single('file'), importVocabulary);
router.get("/:id", getVocabularyById);

// Protected routes
router.post("/", authenticate, createVocabulary);
router.put("/:id", authenticate, updateVocabulary);
router.delete("/:id", authenticate, deleteVocabulary);

export default router;