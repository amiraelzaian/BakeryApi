const User = require("../models/user.model");
const ApiError = require("../utils/apiError");
const { generateToken } = require("../utils/generateToken");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const sendEmail = require("../utils/sendEmail");
const { OAuth2Client } = require("google-auth-library");


const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

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

  if (!user) {
    return next(new ApiError("Incorrect credential", 401));
  }

  const isCorrectPassword = await bcrypt.compare(req.body.password, user.password);

  if (!isCorrectPassword) {
    return next(new ApiError("Incorrect credential", 401));
  }

  if (user.role !== 'customer') {
    return next(new ApiError("This is Customer module, You are not authorized", 403));
  }

  const token = generateToken(user._id);
  res.status(200).json({ status: "success", data: user, token });
};

// @desc   Staff login
// @route  POST /api/v1/auth/staff/login
// @access Public
exports.staffLogin = async (req, res, next) => {
  const user = await User.findOne({ email: req.body.email });

  if (!user) {
    return next(new ApiError("Incorrect credential", 401));
  }

  const isCorrectPassword = await bcrypt.compare(
    req.body.password,
    user.password,
  );

  if (!isCorrectPassword) {
    return next(new ApiError("Incorrect credential", 401));
  }

  if (user.role === 'customer') {
    return next(new ApiError("This is Staff module, You are not authorized", 403));
  }

  const token = generateToken(user._id);

  res.status(200).json({
    status: "success",
    data: user,
    token,
  });
};

// @desc   Staff login by google
// @route  POST /api/v1/auth/staff/google
// @access Public
exports.staffGoogleLogin = async (req, res, next) => {
  const { credential } = req.body;

  const ticket = await client.verifyIdToken({
    idToken: credential,
    audience: process.env.GOOGLE_CLIENT_ID,
  });

  const payload = ticket.getPayload();
  const { email } = payload;

  const user = await User.findOne({ email });

  if (!user) {
    return next(new ApiError("No staff account found with this email", 404));
  }

  if (user.role === 'customer') {
    return next(new ApiError("This is Staff module, You are not authorized", 403));
  }

  const token = generateToken(user._id);

  res.status(200).json({
    status: "success",
    data: user,
    token,
  });
};


// @desc make sure the user is logged in
exports.protect = async (req, res, next) => {
  //1- check if token exists, if yes hold it
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  )
    token = req.headers.authorization.split(" ")[1];
  if (!token)
    return next(new ApiError("You are not logged in, Please login", 401));

  //2- verify token -> no change happen, not expires
  const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);

  //3-check if user exist
  const currentUser = await User.findById(decoded.payload);
  if (!currentUser)
    return next(
      new ApiError("The user that belong to this token doesn't exist", 401),
    );
  //4- check if user change his password after token generated
  if (currentUser?.passwordChangedAt) {
        const changedAt = Math.floor(currentUser.passwordChangedAt.getTime() / 1000);
      if (changedAt > decoded.iat) {
        return next(new ApiError("User has changed account credential recently, login again", 401));
      }
  }
  req.user = currentUser;
  next();
};

//@desc user permissions (user autherization)
exports.allowedTo =
  (...roles) =>
  async (req, res, next) => {
    if (!roles.includes(req.user.role))
      return next(new ApiError("This job is out of your permissioins", 403));
    next();
  };



// @desc   login by google
// @route  post /api/v1/auth/googleAuth
// @access Public
exports.googleLogin = async (req, res, next) => {
  const { credential } = req.body;

  const ticket = await client.verifyIdToken({
    idToken: credential,
    audience: process.env.GOOGLE_CLIENT_ID,
  });

  const payload = ticket.getPayload();

  const { email, name, picture, sub: googleId } = payload;

  let user = await User.findOne({ email });

  if (!user) {
    user = await User.create({
      name,
      email,
      googleId,
      profileImg: picture,
      provider: "google",
    });
  }
  if(user.role!=='customer')
    return next(new ApiError("This is Customer module, You are not autherized", 403))

  const token = generateToken(user._id);

  res.status(200).json({
    status: "success",
    data: user,
    token,
  });
};

const { redisClient, ensureRedisConnected } = require("../redis");

const resetKey = (email) => `resetCode:${email}`;
const verifiedKey = (email) => `resetVerified:${email}`;
const hashCode = (code) => crypto.createHash("sha256").update(code).digest("hex");

// @route POST /api/v1/auth/forgotPassword
exports.forgotPassword = async (req, res, next) => {
  const rawEmail = String(req.body.email || "").trim();
  const email = rawEmail.toLowerCase();

  const user = await User.findOne({ email: rawEmail });
  if (!user) {
    return next(new ApiError(`There is no user with that email ${rawEmail}`, 404));
  }

  await ensureRedisConnected();

  const resetCode = crypto.randomInt(100000, 1000000).toString(); // secure random
  await redisClient.set(resetKey(email), hashCode(resetCode), { EX: 15 * 60 });
  await redisClient.del(verifiedKey(email));

  const message = `
    <h2>Hello ${user.name}</h2>
    <p>We received a request to reset your password.</p>
    <h1>${resetCode}</h1>
    <p>This code is valid for <strong>15 minutes</strong>.</p>
    <p>If you didn't request a password reset, you can ignore this email.</p>
    <p>Bakery Team</p>
  `;

  try {
    await sendEmail({
      email: user.email,
      subject: "Your password reset code (valid for 15 minutes)",
      message,
    });
  } catch (err) {
    console.error("Reset email failed:", err.message);
    await redisClient.del(resetKey(email));
    await redisClient.del(verifiedKey(email));
    return next(new ApiError("Could not send the email, try again later", 500));
  }

  res.status(200).json({
    status: "success",
    message: "Reset code has been sent to your email, check your inbox",
  });
};

// @route POST /api/v1/auth/verifyPassword
exports.verifyResetcode = async (req, res, next) => {
  const email = String(req.body.email || "").trim().toLowerCase();
  const resetCode = String(req.body.resetCode || "").trim(); // works even if the frontend sends a number

  if (!email || !resetCode) {
    return next(new ApiError("Email and reset code are required", 400));
  }

  await ensureRedisConnected();

  const stored = await redisClient.get(resetKey(email));
  if (!stored || stored !== hashCode(resetCode)) {
    return next(new ApiError("Invalid or expired reset code", 400));
  }

  await redisClient.set(verifiedKey(email), "true", { EX: 15 * 60 });
  res.status(200).json({ status: "success" });
};

// @route POST /api/v1/auth/resetPassword
exports.resetPassword = async (req, res, next) => {
  const rawEmail = String(req.body.email || "").trim();
  const email = rawEmail.toLowerCase();
  const { newPassword } = req.body;

  if (typeof newPassword !== "string" || newPassword.length < 6) {
    return next(new ApiError("Password must be at least 6 characters", 400));
  }

  await ensureRedisConnected();

  const user = await User.findOne({ email: rawEmail });
  if (!user) return next(new ApiError("There is no user with this email", 404));

  if ((await redisClient.get(verifiedKey(email))) !== "true") {
    return next(new ApiError("Reset code is not verified, check your email", 400));
  }

  user.password = newPassword;
  user.passwordChangedAt = Date.now() - 1000; // invalidates old tokens
  await user.save();

  await redisClient.del(resetKey(email));
  await redisClient.del(verifiedKey(email));

  const token = generateToken(user._id);
  res.status(200).json({ status: "success", token });
};