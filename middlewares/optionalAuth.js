const jwt = require("jsonwebtoken");
const User = require("../models/user.model");

module.exports = async (req, res, next) => {
  try {
    const header = req.headers.authorization;
    if (header?.startsWith("Bearer ")) {
      const decoded = jwt.verify(header.split(" ")[1], process.env.JWT_SECRET_KEY);
      const user = await User.findById(decoded.payload); 

      const changedAfterToken =
        user?.passwordChangedAt &&
        parseInt(user.passwordChangedAt.getTime() / 100, 10) > decoded.iat;

      if (user && user.role === "customer" && !changedAfterToken) req.user = user;
    }
  } catch (_) {
    /* invalid token -> guest */
  }
  next();
};