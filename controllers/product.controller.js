const Product = require("../models/product.model");
const ApiError = require("../utils/apiError");
const factory = require("./factory");
const { redisClient } = require("../redis.js");
const ApiFeatures = require("../utils/apiFeatures.js");

// @desc   Create product
// @route  post /api/v1/products
// @access protected/admin
exports.createProduct = factory.createOne(Product);
