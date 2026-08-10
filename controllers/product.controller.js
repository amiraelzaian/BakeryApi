const Product = require("../models/product.model");
const ApiError = require("../utils/apiError");
const factory = require("./factory");
const { redisClient } = require("../redis.js");
const ApiFeatures = require("../utils/apiFeatures.js");

// =========================
// INVALIDATE PRODUCT CACHE
// =========================

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

// =========================
// CREATE
// =========================

exports.createProduct = factory.createOne(Product, {
  invalidateCache: invalidateProductsCache,
});

// =========================
// GET ONE
// =========================

exports.getProduct = factory.getOne(Product);

// =========================
// UPDATE
// =========================

exports.updateProduct = factory.updateOne(Product, {
  invalidateCache: invalidateProductsCache,
});

// =========================
// DELETE
// =========================

exports.deleteProduct = factory.deleteOne(Product, {
  invalidateCache: invalidateProductsCache,
});

// =========================
// GET PRODUCTS
// =========================

const getProducts = async (req, res, next, baseFilter = {}) => {
  // 1. Create cache key
  const cacheKey = `products:${JSON.stringify({
    baseFilter,
    query: req.query,
  })}`;

  // 2. Check Redis
  const cachedProducts = await redisClient.get(cacheKey);

  if (cachedProducts) {
    return res.status(200).json({
      status: "success",
      source: "cache",
      ...JSON.parse(cachedProducts),
    });
  }

  // 3. Count documents
  const docsCount = await Product.countDocuments(baseFilter);

  // 4. Create ApiFeatures
  const apiFeatures = new ApiFeatures(Product.find(), req.query, baseFilter)
    .paginate(docsCount)
    .filter()
    .search("Product")
    .limitFields()
    .sort();

  // 5. Execute query
  const products = await apiFeatures.mongooseQuery;

  // 6. Create response
  const response = {
    results: products.length,
    page: apiFeatures.paginationResult,
    data: products,
  };

  // 7. Store in Redis
  await redisClient.set(cacheKey, JSON.stringify(response), {
    EX: 3600,
  });

  // 8. Send response
  res.status(200).json({
    status: "success",
    source: "database",
    ...response,
  });
};

// =========================
// CUSTOMER PRODUCTS
// =========================

exports.getAllProducts = (req, res, next) => {
  return getProducts(req, res, next, { isAvailable: true });
};

// =========================
// ADMIN PRODUCTS
// =========================

exports.getAllProductsAdmin = (req, res, next) => {
  return getProducts(req, res, next, {});
};
