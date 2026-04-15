import express from "express";
import {
  register,
  login,
  googleLogin,
  refreshToken,
  logout,
  getProfile,
  updateProfile,
  deleteProfile,
  // Email verification
  verifyEmail,
  resendVerificationEmail,
  // Password reset
  forgotPassword,
  resetPassword,
  // Two-factor authentication
  setupTwoFactorAuth,
  confirmTwoFactorAuth,
  verifyTwoFactorCode,
  disableTwoFactorAuth,
} from "../controllers/authController.js";
import { authenticate } from "../middleware/auth.js";

const router = express.Router();

// ============ AUTHENTICATION BASICS ============
router.post("/register", register);
router.post("/login", login);
router.post("/google", googleLogin);
router.post("/refresh", refreshToken);
router.post("/logout", logout);

// ============ PROFILE ============
router.get("/profile", authenticate, getProfile);
router.put("/profile", authenticate, ...updateProfile);
router.delete("/profile", authenticate, deleteProfile);

// ============ EMAIL VERIFICATION ============
router.post("/verify-email", verifyEmail);
router.post("/resend-verification-email", resendVerificationEmail);

// ============ PASSWORD RESET ============
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);

// ============ TWO-FACTOR AUTHENTICATION (2FA) ============
router.post("/2fa/setup", authenticate, setupTwoFactorAuth);
router.post("/2fa/confirm", authenticate, confirmTwoFactorAuth);
router.post("/2fa/verify", verifyTwoFactorCode);
router.post("/2fa/disable", authenticate, disableTwoFactorAuth);

export default router;
