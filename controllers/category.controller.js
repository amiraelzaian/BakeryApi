const Category = require("../models/category.model");
const ApiError = require("../utils/apiError");
const factory = require("./factory");
const { redisClient } = require("../redis.js");
const ApiFeatures = require("../utils/apiFeatures.js");

// invalidate cache
const invalidateCategoriesCache = async () => {
  let cursor = "0";

  do {
    const result = await redisClient.scan(cursor, {
      MATCH: "categories:*",
      COUNT: 100,
    });

    cursor = result.cursor;

    const keys = result.keys;

    if (keys.length > 0) {
      await redisClient.del(keys);
    }
  } while (cursor !== "0");
};

// @desc   Create category
// @route  post /api/v1/categories
// @access protected/admin
exports.createCategory = factory.createOne(Category, {
  invalidateCache: invalidateCategoriesCache,
});

// @desc   get category
// @route  post /api/v1/categories/:id
// @access protected/
exports.getCategory = factory.getOne(Category);

// @desc   update category
// @route  patch /api/v1/categories/:id
// @access protected/amdin
exports.updateCategory = factory.updateOne(Category, {
  invalidateCache: invalidateCategoriesCache,
});

// @desc   delete category
// @route  delete /api/v1/categories/:id
// @access protected/admin
exports.deleteCategory = factory.deleteOne(Category, {
  invalidateCache: invalidateCategoriesCache,
});

// @desc   get categories
// @route  get /api/v1/categories
// @access public

const getCategories = async (req, res, next, baseFilter = {}) => {
  //1- create cache key
  const cacheKey = `categories:${JSON.stringify(req.query)}`;
  //2- check redist
  const cachedCategories = await redisClient.get(cacheKey);
  if (cachedCategories) {
    //return cached response
    return res.status(200).json({
      status: "success",
      source: "cache",
      ...JSON.parse(cachedCategories),
    });
  }

  //3- count documents
  const docsCount = await Category.countDocuments(baseFilter);

  //4- create ApiFeatures
  let apiFeatures = new ApiFeatures(Category.find(baseFilter), req.query)
    .paginate(docsCount)
    .filter()
    .search("Category")
    .limitFields()
    .sort();

  //5- excute query
  const categories = await apiFeatures.mongooseQuery;
  if (!categories)
    return next(
      new ApiError("Categories not found, something went wrong", 404),
    );
  //6- create response object
  const response = {
    results: categories.length,
    page: apiFeatures.paginationResult,
    data: categories,
  };

  //7- Store the result in Redis
  await redisClient.set(cacheKey, JSON.stringify(response), {
    EX: 3600,
  });

  //8- Send response
  res.status(200).json({
    status: "success",
    source: "database",
    ...response,
  });
};

//for customers
exports.getAllCategories = (req, res, next) => {
  return getCategories(req, res, next, { isActive: true });
};
// for admin
exports.getAllCategoriesAdmin = (req, res, next) => {
  return getCategories(req, res, next, {});
};
