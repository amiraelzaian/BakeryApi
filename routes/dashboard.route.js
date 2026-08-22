const express = require("express");
const { getRevenueSummary } = require("../controllers/dashboard.controller");
const { protect, allowedTo } = require("../controllers/auth.controller");

const router = express.Router();

router.get("/revenue", protect, allowedTo("admin"), getRevenueSummary);

module.exports = router;
