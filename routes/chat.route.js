const router = require("express").Router();
const rateLimit = require("express-rate-limit"); 
const optionalAuth = require("../middlewares/optionalAuth");
const { sendMessage } = require("../controllers/chat.controller");

const chatLimiter = rateLimit({ windowMs: 60 * 1000, limit: 15 });

router.post("/", chatLimiter, optionalAuth, sendMessage);
module.exports = router;