const ApiError = require("../utils/apiError");

const handleJwtInvalidSignature = () =>
  new ApiError("Invalid token, please login", 401);

const globalError = (error, req, res, next) => {
  error.statusCode = error.statusCode || 500;
  error.status = error.status || "error";
  if (process.env.NODE_ENV === "development") {
    sendErrorForDev(error, res);
  } else {
    if (error.name === "jsonwebtokenError") {
      error = handleJwtInvalidSignature();
    }
    sendErrorForProd(error, res);
  }
};
const sendErrorForDev = (error, res) => {
  return res.status(error.statusCode).json({
    status: error.status,
    error,
    message: error.message,
    stack: error.stack,
  });
};
const sendErrorForProd = (error, res) => {
  return res.status(error.statusCode).json({
    status: error.status,
    message: error.message,
  });
};
module.exports = globalError;
