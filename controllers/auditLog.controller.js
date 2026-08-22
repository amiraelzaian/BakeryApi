const AuditLog = require("../models/auditLog.model");
const factory = require("./factory");
// exports.getAllAuditLogs = async (req, res, next) => {
//   const logs = await AuditLog.find()
//     .populate("admin", "name email")
//     .sort("-createdAt");

//   res.status(200).json({
//     status: "success",
//     results: logs.length,
//     data: logs,
//   });
// };
exports.getAllAuditLogs = factory.getAll(AuditLog);
