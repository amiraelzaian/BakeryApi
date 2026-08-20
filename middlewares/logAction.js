const AuditLog = require("../models/auditLog.model");

// action: e.g. "DELETE_PRODUCT"
// targetType: e.g. "Product"
// getDetails: optional (req, res, body) => object, to capture extra info
exports.logAction = (action, targetType, getDetails) => {
  return (req, res, next) => {
    const originalJson = res.json.bind(res);

    res.json = (body) => {
      if (body?.status === "success") {
        const targetId =
          req.params.id ||
          req.params.productId ||
          req.params.reviewId ||
          body?.data?._id ||
          body?.document._id;

        AuditLog.create({
          admin: req.user._id,
          action,
          targetType,
          targetId,
          details: getDetails ? getDetails(req, res, body) : undefined,
        }).catch((err) => {
          console.error("Failed to write audit log:", err.message);
        });
      }

      return originalJson(body);
    };

    next();
  };
};
