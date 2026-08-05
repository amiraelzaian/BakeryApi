const jwt = require("jsonwebtoken");

exports.generateToken = (payload) => {
  const token = jwt.sign({ payload }, process.env.JWT_SECRET_KEY, {
    expiresIn: process.env.JWT_EXPIRE_TIME,
  });
  return token;
};
