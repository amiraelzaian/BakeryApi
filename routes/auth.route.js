const express = require("express");
const {
  signupValidator,
  loginValidator,
} = require("../validators/auth.validator");
const {
  signup,
  login,
  protect,
  forgotPassword,
  verifyResetcode,
  resetPassword,
  googleLogin,
} = require("../controllers/auth.controller");
const {
  forgotPasswordLimiter,
  verifyResetCodeLimiter,
} = require("../middlewares/rateLimitMiddleware");

const router = express.Router();

router.route("/signup").post(signupValidator, signup);
router.route("/login").post(loginValidator, login);
router.route("/google").post(googleLogin);
router
  .route("/forgotPassword")
  .post(protect, forgotPasswordLimiter, forgotPassword);
router
  .route("/verifyPassword")
  .post(protect, verifyResetCodeLimiter, verifyResetcode);
router.route("/resetPassword").post(protect, resetPassword);

module.exports = router;
