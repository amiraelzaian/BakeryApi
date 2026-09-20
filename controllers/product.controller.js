const Product = require("../models/product.model");
const ApiError = require("../utils/apiError");
const factory = require("./factory");
const { redisClient, ensureRedisConnected } = require("../redis.js");
const ApiFeatures = require("../utils/apiFeatures.js");
const { attachOfferPricing } = require("./seasonalOffer.controller.js");


// parse the sizes to convert it to array as forntend send it as string
exports.parseProductSizes = (req, res, next) => {
  if (typeof req.body.sizes === "string") {
    try {
      req.body.sizes = JSON.parse(req.body.sizes);
    } catch (err) {
      return res.status(400).json({
        errors: [{ msg: "Sizes must be valid JSON", path: "sizes", location: "body" }],
      });
    }
  }
  next();
};


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

exports.getProduct = async (req, res, next) => {
  const product = await Product.findById(req.params.id).populate(
    "categoryId",
    "name description",
  );

  if (!product) {
    return next(new ApiError("Product not found", 404));
  }

  const productWithPricing = await attachOfferPricing(product);

  res.status(200).json({ status: "success", data: productWithPricing });
};

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
  const cacheKey = `products:${JSON.stringify({
    baseFilter,
    query: req.query,
  })}`;

  let cachedProducts = null;
  try {
    await ensureRedisConnected();
    cachedProducts = await redisClient.get(cacheKey);
  } catch (err) {
    console.error("Redis read failed, continuing without cache:", err.message);
  }

  if (cachedProducts) {
    return res.status(200).json({
      status: "success",
      source: "cache",
      ...JSON.parse(cachedProducts),
    });
  }

  // 1. Build the query WITH filter + search first, no pagination yet
  const apiFeatures = new ApiFeatures(
    Product.find().populate("categoryId", "name"),
    req.query,
    baseFilter,
  )
    .filter()
    .search("Product");

  // 2. Count against the actual merged filter (base + query filters + search)
  const docsCount = await Product.countDocuments(
    apiFeatures.mongooseQuery.getFilter(),
  );

  // 3. Now paginate using the correct count, then finish the pipeline
  apiFeatures.paginate(docsCount).limitFields().sort();

  const products = await apiFeatures.mongooseQuery;

  const productsWithPricing = await attachOfferPricing(products);

  const response = {
    results: products.length,
    page: apiFeatures.paginationResult,
    data: productsWithPricing,
  };

  try {
    await ensureRedisConnected();
    await redisClient.set(cacheKey, JSON.stringify(response), {
      EX: 3600,
    });
  } catch (err) {
    console.error(
      "Redis write failed, response sent without caching:",
      err.message,
    );
  }

  res.status(200).json({
    status: "success",
    source: "database",
    ...response,
  });
};


exports.getAllProducts = (req, res, next) => {
  return getProducts(req, res, next, { isAvailable: true });
};

// =========================
// ADMIN PRODUCTS
// =========================

exports.getAllProductsAdmin = (req, res, next) => {
  return getProducts(req, res, next, {});
};

exports.invalidateProductsCache = invalidateProductsCache;
