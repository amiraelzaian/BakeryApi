exports.setCreatedBy = (req, res, next) => {
  req.body.createdBy = req.user._id;
  next();
};
