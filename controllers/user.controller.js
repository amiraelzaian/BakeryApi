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
