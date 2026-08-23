const bcrypt = require("bcryptjs");
const factory = require("./factory");
const ApiError = require("../utils/apiError");
const User = require("../models/user.model");

// @desc   create user
// @route  POST /api/v1/users
// @access Private
exports.createUser = factory.createOne(User);

// @desc   Get all users
// @route  GET /api/v1/users
// @access Private
exports.getAllUsers = factory.getAll(User);

// @desc   Get specific user by Id
// @route  GET /api/v1/users/id
// @access Private
exports.getUser = factory.getOne(User);

// @desc   Update specific user by Id
// @route  patch /api/v1/users/id
// @access Private
exports.updateUser = factory.updateOne(User);

// @desc   delete specific user by Id
// @route  Delete /api/v1/users/id
// @access Private
exports.deleteUser = factory.deleteOne(User);
// @desc   change specific user by Id
// @route  patch /api/v1/users/id
// @access Private/admin
exports.changeUserPassword = async (req, res, next) => {
  const document = await User.findByIdAndUpdate(
    req.params.id,
    {
      password: await bcrypt.hash(req.body.password, 10),
      passwordChangedAt: Date.now(),
    },
    {
      new: true,
    },
  );
  if (!document) {
    return next(new ApiError(`No document for this id ${req.params.id}`, 404));
  }
  res.status(200).json({ staus: "success", data: document });
};
// @desc   Get logged user data
// @route  GET /api/v1/users/getMe
// @access Private/Protected

exports.getLoggedUserData = async (req, res, next) => {
  req.params.id = req.user._id;
  next();
};

// @desc   Update Logged user data except( role, password )
// @route  Patch /api/v1/users/updateMe
// @access Private/Protected
exports.updateLoggedUserData = async (req, res, next) => {
  const updateBody = {
    name: req.body.name,
    email: req.body.email,
    phone: req.body.phone,
    address: req.body.address,
  };

  if (req.file) {
    updateBody.avatarUrl = req.file.path;
  }

  const updatedUser = await User.findByIdAndUpdate(req.user._id, updateBody, {
    new: true,
  });

  if (!updatedUser) {
    return next(new ApiError("Error: could not find user to update", 404));
  }
  res.status(200).json({ status: "success", data: updatedUser });
};

// @desc   delete logged user
// @route  delete /api/v1/users/deleteMe
// @access Private/Protected

exports.deleteLoggedUserData = async (req, res, next) => {
  await User.findByIdAndDelete(req.user._id);
  res.status(204).send();
};
// @desc   Deactivate logged user
// @route  Patch /api/v1/users/activation
// @access Private/Protected

exports.reverseUserActivation = async (req, res, next) => {
  const user = await User.findById(req.user._id);
  user.isActive = req.body.isActive;
  await user.save();
  res.status(200).json({ status: "success", data: user });
};
