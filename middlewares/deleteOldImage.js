const cloudinary = require("../config/cloudinary");
const ApiError = require("../utils/apiError");

const deleteOldImage = (Model) => async (req, res, next) => {
  try {
    if (!req.file) return next();

    const doc = await Model.findById(req.params.id);
    if (doc && doc.imagePublicId) {
      await cloudinary.uploader.destroy(doc.imagePublicId);
    }
    next();
  } catch (err) {
    return next(new ApiError("something went wrong", 400));
  }
};

module.exports = deleteOldImage;
