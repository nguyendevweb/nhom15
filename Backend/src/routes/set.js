import express from "express";
import {
  getAllSets,
  getSetById,
  createSet,
  updateSet,
  deleteSet,
  duplicateSet,
  searchSets,
  getSetsByUser,
  favoriteSet,
  unfavoriteSet,
} from "../controllers/setController.js";
import { authenticate } from "../middleware/auth.js";

const router = express.Router();

// Các route quản lý bộ flashcard (set)
router.get("/", authenticate, getAllSets);
router.get("/search", searchSets);
router.get("/user/:userId", getSetsByUser);
router.get("/:id", getSetById);
router.post("/", authenticate, createSet);
router.put("/:id", authenticate, updateSet);
router.delete("/:id", authenticate, deleteSet);
router.post("/:id/duplicate", authenticate, duplicateSet);
router.post("/:id/favorite", authenticate, favoriteSet);
router.delete("/:id/favorite", authenticate, unfavoriteSet);

export default router;
