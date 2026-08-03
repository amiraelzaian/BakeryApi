const ApiError = require("../utils/apiError");
const ApiFeatures = require("../utils/apiFeatures");

exports.createOne = (Model) => async (req, res, next) => {
  const document = await Model.create(req.body);
  if (!document) {
    return next(new ApiError("Couldn't create this document", 400));
  }
  res.status(201).json({ data: document });
};

exports.getAll = (Model) => async (req, res, next) => {
  let filter = {};
  if (req.filterObj) {
    filter = req.filterObj;
  }

  const docsCount = await Model.countDocuments();
  let apiFeatures = new ApiFeatures(Model.find(filter), req.query)
    .paginate(docsCount)
    .filter()
    .search(Model.modelName)
    .limitFields()
    .sort();

  const documents = await apiFeatures.mongooseQuery;
  if (!documents)
    return next(
      new ApiError(`Could not get documents for ${Model} model`, 404),
    );
  res.status(200).json({
    results: documents.length,
    page: apiFeatures.paginationResult,
    data: documents,
  });
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
