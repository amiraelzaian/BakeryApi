const User = require("../models/user.model");
const ApiError = require("../utils/apiError");
const { generateToken } = require("../utils/generateToken");
const bcrypt = require("bcryptjs");

// @desc   Signnup
// @route  post /api/v1/auth/signup
// @access Public
exports.signup = async (req, res, next) => {
  const user = await User.create({
    name: req.body.name,
    email: req.body.email,
    password: req.body.password,
  });
  if (!user) {
    return next(new ApiError("Could not signup, try later", 401));
  }

  const token = generateToken(user._id);
  res.status(201).json({ status: "success", data: user, token });
};
// @desc   login
// @route  post /api/v1/auth/login
// @access Public
exports.login = async (req, res, next) => {
  const user = await User.findOne({ email: req.body.email });
  if (!user || !bcrypt.compare(req.body.password, user.password)) {
    return next(new ApiError("Incorrect credintial", 401));
  }

  const token = generateToken(user._id);
  res.status(200).json({ status: "success", data: user, token });
};

exports.protect = async (req, res, next) => {};
exports.allowedTo =
  (...roles) =>
  async (req, res, next) => {};
exports.forgotPassword = async (req, res, next) => {};
exports.verifyPassword = async (req, res, next) => {};
exports.resetPassword = async (req, res, next) => {};
