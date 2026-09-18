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
  staffGoogleLogin ,
  staffLogin ,
} = require("../controllers/auth.controller");
const {
  forgotPasswordLimiter,
  verifyResetCodeLimiter,
} = require("../middlewares/rateLimitMiddleware");

const router = express.Router();

router.route("/signup").post(signupValidator, signup);
router.route("/login").post(loginValidator, login);
router.route("/staff/login").post(loginValidator, staffLogin );
router.route("/google").post(googleLogin);
router.route("/staff/google").post(staffGoogleLogin );
router
  .route("/forgotPassword")
  .post( forgotPasswordLimiter, forgotPassword);
router
  .route("/verifyPassword")
  .post( verifyResetCodeLimiter, verifyResetcode);
router.route("/resetPassword").post( resetPassword);

module.exports = router;
