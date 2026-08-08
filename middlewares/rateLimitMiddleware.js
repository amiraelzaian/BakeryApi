const rateLimit = require("express-rate-limit");

// Forgot password:
// Max 5 requests from the same IP every 15 minutes
const forgotPasswordLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 5,
  standardHeaders: true,
  legacyHeaders: false,

  message: {
    status: "fail",
    message:
      "Too many password reset requests. Please try again after 15 minutes.",
  },
});

// Verify reset code:
// Max 10 attempts from the same IP every 15 minutes
const verifyResetCodeLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,

  message: {
    status: "fail",
    message: "Too many verification attempts. Please try again later.",
  },
});

module.exports = {
  forgotPasswordLimiter,
  verifyResetCodeLimiter,
};
