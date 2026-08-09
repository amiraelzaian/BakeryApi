const Product = require("../models/product.model");
const ApiError = require("../utils/apiError");
const factory = require("./factory");
const { redisClient } = require("../redis.js");
const ApiFeatures = require("../utils/apiFeatures.js");

// invalidate cache
const invalidateProductsCache = async () => {
  let cursor = "0";

  do {
    const result = await redisClient.scan(cursor, {
      MATCH: "products:*",
      COUNT: 100,
    });

    cursor = result.cursor;

    const keys = result.keys;

    if (keys.length > 0) {
      await redisClient.del(keys);
    }
  } while (cursor !== "0");
};

// @desc   Create product
// @route  post /api/v1/products
// @access protected/admin
exports.createProduct = factory.createOne(Product, {
  invalidateCache: invalidateProductsCache,
});
// @desc   get product
// @route  get /api/v1/products/:id
// @access protected/
exports.getProduct = factory.getOne(Product);
// @desc   update product
// @route  patch /api/v1/products/:id
// @access protected/admin
exports.updateProduct = factory.updateOne(Product, {
  invalidateCache: invalidateProductsCache,
});
// @desc   delete product
// @route  delete /api/v1/products/:id
// @access protected/admin
exports.deleteProduct = factory.deleteOne(Product, {
  invalidateCache: invalidateProductsCache,
});
// @desc   get products
// @route  delete /api/v1/products/:id
// @access protected
const getProducts = async (req, res, next, baseFilter = {}) => {
  //1- create cache key
  const cacheKey = `products:${JSON.stringify(req.query)}`;
  //2- check redist
  const cachedProducts = await redisClient.get(cacheKey);
  if (cachedProducts) {
    //return cached response
    return res.status(200).json({
      status: "success",
      source: "cache",
      ...JSON.parse(cachedProducts),
    });
  }

  //3- count documents
  const docsCount = await Product.countDocuments(baseFilter);

  //4- create ApiFeatures
  let apiFeatures = new ApiFeatures(Product.find(baseFilter), req.query)
    .paginate(docsCount)
    .filter()
    .search("Product")
    .limitFields()
    .sort();

  //5- excute query
  const products = await apiFeatures.mongooseQuery;
  if (!products)
    return next(
      new ApiError("Products are not found, something went wrong", 404),
    );
  //6- create response object
  const response = {
    results: products.length,
    page: apiFeatures.paginationResult,
    data: products,
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

exports.getAllProducts = (req, res, next) => {
  return getProducts(req, res, next, { isAvailable: true });
};
exports.getAllProductsAdmin = (req, res, next) => {
  return getProducts(req, res, next, {});
};
