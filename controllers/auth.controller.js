const User = require("../models/user.model");
const ApiError = require("../utils/apiError");
const { generateToken } = require("../utils/generateToken");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const sendEmail = require("../utils/sendEmail");
const { OAuth2Client } = require("google-auth-library");
const { redisClient } = require("../redis");

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

  const isCorrectPassword = await bcrypt.compare(
    req.body.password,
    user.password,
  );

  if (!isCorrectPassword) {
    return next(new ApiError("Incorrect credential", 401));
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
    const passwordChangedTimeStamp = parseInt(
      currentUser.passwordChangedAt.getTime() / 100,
      10,
    );
    // pass chnaged after token generated

    if (passwordChangedTimeStamp > docoded.iat)
      return next(
        new ApiError(
          "User has changed account credintial recently, login again",
          401,
        ),
      );
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
// @desc   forgot password
// @route  post /api/v1/auth/forgotPassword
// @access Public
// exports.forgotPassword = async (req, res, next) => {
//   //1- get user by email
//   const user = await User.findOne({ email: req.body.email });
//   if (!user) {
//     return next(
//       new ApiError(`There is no user with that email ${req.body.email}`, 404),
//     );
//   }
//   //2- if user exists, gnerate hashed reset random 6 digists save it in db
//   const resetCode = Math.floor(100000 + Math.random() * 900000).toString();
//   const hashedResetCode = crypto
//     .createHash("sha256")
//     .update(resetCode)
//     .digest("hex");
//   // save hashed password reset code in DB
//   user.passwordResetCode = hashedResetCode;
//   user.passwordResetExpires = Date.now() + 15 * 60 * 1000;
//   user.passwordResetVerified = false;
//   await user.save();

//   //3- send the reset code via email
//   const message = `
//     <h2>Hello ${user.name}</h2>
//     <p>We received a request to reset your password.</p>
//     <h1>${resetCode}</h1>
//     <p>This code is valid for <strong>15 minutes</strong>.</p>
//     <p>If you didn't request a password reset, you can ignore this email.</p>
//     <p>Bakery Team</p>
//     `;
//   try {
//     await sendEmail({
//       email: user.email,
//       subject: "Your password reset code (valid for 15 minutes)",
//       message,
//     });
//   } catch (err) {
//     console.error(err);

//     user.passwordResetCode = undefined;
//     user.passwordResetExpires = undefined;
//     user.passwordResetVerified = undefined;
//     await user.save({ validateBeforeSave: false });

//     return next(new ApiError("Something went wrong while sending email", 500));
//   }
//   res.status(200).json({
//     status: "success",
//     message: "Reset code has been sent to your email, check your inbox",
//   });
// };
// // @desc   Verify reset code
// // @route  post /api/v1/auth/verifyResetcode
// // @access Public
// exports.verifyResetcode = async (req, res, next) => {
//   //1- Get user based on reet code
//   const hashedResetCode = crypto
//     .createHash("sha256")
//     .update(req.body.resetCode)
//     .digest("hex");

//   const user = await User.findOne({
//     passwordResetCode: hashedResetCode,
//     passwordResetExpires: { $gt: Date.now() },
//   });

//   if (!user) {
//     return next(new ApiError("Invalid or expired reset code", 404));
//   }

//   //2- valid reset code
//   user.passwordResetVerified = true;
//   await user.save();
//   res.status(200).json({ status: "success" });
// };
// // @desc   Reset password
// // @route  post /api/v1/auth/resetPassword
// // @access Public
// exports.resetPassword = async (req, res, next) => {
//   const user = await User.findOne({ email: req.body.email });
//   if (!user)
//     return next(new ApiError("There is not user with this email", 404));
//   if (!user.passwordResetVerified)
//     return next(
//       new ApiError("Reset code is not verified, check you email", 400),
//     );

//   user.password = req.body.newPassword;
//   user.passwordResetCode = undefined;
//   user.passwordResetExpires = undefined;
//   user.passwordResetVerified = false;

//   await user.save();
//   const token = generateToken(user._id);

//   res.status(200).json({ status: "success", token });
// };
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
      proivder: "google",
    });
  }

  const token = generateToken(user._id);

  res.status(200).json({
    status: "success",
    data: user,
    token,
  });
};

// @desc   Forgot password
// @route  POST /api/v1/auth/forgotPassword
// @access Public
exports.forgotPassword = async (req, res, next) => {
  // 1- Get user by email
  const user = await User.findOne({ email: req.body.email });

  if (!user) {
    return next(
      new ApiError(`There is no user with that email ${req.body.email}`, 404),
    );
  }

  // 2- Generate random 6-digit reset code
  const resetCode = Math.floor(100000 + Math.random() * 900000).toString();

  // Hash the reset code
  const hashedResetCode = crypto
    .createHash("sha256")
    .update(resetCode)
    .digest("hex");

  // Save hashed reset code in Redis for 15 minutes
  await redisClient.set(`resetCode:${user.email}`, hashedResetCode, {
    EX: 15 * 60,
  });

  // Reset verification status
  await redisClient.del(`resetVerified:${user.email}`);

  // 3- Send reset code via email
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
    console.error(err);

    // Delete reset data from Redis if email fails
    await redisClient.del(`resetCode:${user.email}`);
    await redisClient.del(`resetVerified:${user.email}`);

    return next(new ApiError("Something went wrong while sending email", 500));
  }

  res.status(200).json({
    status: "success",
    message: "Reset code has been sent to your email, check your inbox",
  });
};
// @desc   Verify reset code
// @route  POST /api/v1/auth/verifyResetcode
// @access Public
exports.verifyResetcode = async (req, res, next) => {
  const { email, resetCode } = req.body;

  // 1- Hash the reset code entered by the user
  const hashedResetCode = crypto
    .createHash("sha256")
    .update(resetCode)
    .digest("hex");

  // 2- Get stored hashed code from Redis
  const storedResetCode = await redisClient.get(`resetCode:${email}`);

  // Code doesn't exist or expired
  if (!storedResetCode) {
    return next(new ApiError("Invalid or expired reset code", 404));
  }

  // Code doesn't match
  if (storedResetCode !== hashedResetCode) {
    return next(new ApiError("Invalid or expired reset code", 404));
  }

  // 3- Mark reset code as verified
  await redisClient.set(`resetVerified:${email}`, "true", {
    EX: 15 * 60,
  });

  res.status(200).json({
    status: "success",
  });
};
// @desc   Reset password
// @route  POST /api/v1/auth/resetPassword
// @access Public
exports.resetPassword = async (req, res, next) => {
  const { email, newPassword } = req.body;

  // 1- Get user by email
  const user = await User.findOne({ email });

  if (!user) {
    return next(new ApiError("There is no user with this email", 404));
  }

  // 2- Check if reset code was verified
  const isVerified = await redisClient.get(`resetVerified:${email}`);

  if (isVerified !== "true") {
    return next(
      new ApiError("Reset code is not verified, check your email", 400),
    );
  }

  // 3- Update password in MongoDB
  user.password = newPassword;

  await user.save();

  // 4- Delete reset data from Redis
  await redisClient.del(`resetCode:${email}`);
  await redisClient.del(`resetVerified:${email}`);

  // 5- Generate JWT
  const token = generateToken(user._id);

  res.status(200).json({
    status: "success",
    token,
  });
};
