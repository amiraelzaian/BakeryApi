const setImageUrlToBody = (urlField, publicIdField) => (req, res, next) => {
  if (req.file) {
    req.body[urlField] = req.file.path;
    if (publicIdField) req.body[publicIdField] = req.file.filename;
  }
  next();
};

const setImagesToBody = (fieldName) => (req, res, next) => {
  if (req.files && req.files.length > 0) {
    req.body[fieldName] = req.files.map((file) => ({
      url: file.path,
      public_id: file.filename,
    }));
  }
  next();
};

module.exports = { setImageUrlToBody, setImagesToBody };
