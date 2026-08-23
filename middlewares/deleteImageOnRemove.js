const cloudinary = require("../config/cloudinary");

const deleteImageOnRemove = (Model) => async (req, res, next) => {
  try {
    const doc = await Model.findById(req.params.id);

    if (doc && doc.imagePublicId) {
      await cloudinary.uploader.destroy(doc.imagePublicId);
    }

    next();
  } catch (err) {
    console.error("Failed to delete image from Cloudinary:", err.message);
    next();
  }
};

module.exports = deleteImageOnRemove;
