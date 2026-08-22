const express = require("express");

const { getAllAuditLogs } = require("../controllers/auditLog.controller");
const { protect, allowedTo } = require("../controllers/auth.controller");

const router = express.Router();

router.route("/").get(protect, allowedTo("admin"), getAllAuditLogs);

module.exports = router;
