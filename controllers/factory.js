const ApiError = require("../utils/apiError");

exports.createOne = (Model) => async (req, res, next) => {
  const document = await Model.create(req.body);
  if (!document) {
    return next(new ApiError("Couldn't create this document", 400));
  }
  res.status(201).json({ data: document });
};

exports.getAll = (Model) => async (req, res, next) => {
  const documents = await Model.find({}, { __v: false, password: false });
  if (!documents)
    return next(
      new ApiError(`Could not get documents for ${Model} model`, 404),
    );
  res.status(200).json({ status: "success", data: documents });
};

exports.getOne = (Model) => async (req, res, next) => {
  const document = await Model.findById(req.params.id, {
    __v: false,
    password: false,
  });
  if (!document) {
    return next(
      new ApiError(`Could not get document for ${req.params.id} id`, 404),
    );
  }
  res.status(200).json({ status: "success", data: document });
};

exports.updateOne = (Model) => async (req, res, next) => {
  const document = await Model.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
  }).select("-__v,-password");
  if (!document)
    return next(
      new ApiError(`Could not update document for ${req.params.id} id`, 400),
    );
  res.status(200).json({ status: "success", data: document });
};

exports.deleteOne = (Model) => async (req, res, next) => {
  const document = await Model.findOneAndDelete({ _id: req.params.id });
  if (!document)
    return next(
      new ApiError(`No matched docment for  ${req.params.id} id`, 404),
    );
  res.status(204).json({ status: "success to delete" });
};
