const factory = require("./factory");
const SeasonalOffer = require("../models/seasonalOffers.model");
const { invalidateProductsCache } = require("./product.controller");

exports.createSeasonalOffer = factory.createOne(SeasonalOffer, {
  invalidateCache: invalidateProductsCache,
});

exports.getSeasonalOffer = factory.getOne(SeasonalOffer);

exports.getAllSeasonalOffers = factory.getAll(SeasonalOffer);

exports.updateSeasonalOffer = factory.updateOne(SeasonalOffer, {
  invalidateCache: invalidateProductsCache,
});

exports.deleteSeasonalOffer = factory.deleteOne(SeasonalOffer, {
  invalidateCache: invalidateProductsCache,
});

const getActiveOffersForProducts = async (productIds, categoryIds = []) => {
  const now = new Date();

  const offers = await SeasonalOffer.find({
    isActive: true,
    startDate: { $lte: now },
    endDate: { $gte: now },
    $or: [
      { products: { $in: productIds } },
      { category: { $in: categoryIds } },
    ],
  });
  return offers;
};

const attachOfferPricing = async (products) => {
  const isArray = Array.isArray(products);
  const list = isArray ? products : [products];

  const productIds = list.map((p) => p._id);
  const categoryIds = list.map((p) => p.categoryId).filter(Boolean);

  const activeOffers = await getActiveOffersForProducts(
    productIds,
    categoryIds,
  );

  const result = list.map((product) => {
    const plain = product.toObject ? product.toObject() : product;

    const matchingOffer = activeOffers.find(
      (offer) =>
        offer.products?.some(
          (id) => id.toString() === product._id.toString(),
        ) ||
        (offer.category &&
          offer.category.toString() === product.categoryId?.toString()),
    );

    if (!matchingOffer) {
      return { ...plain, hasActiveOffer: false };
    }

    const discountPercentage = matchingOffer.discountPercentage;
    const applyDiscount = (price) =>
      Math.round(price * (1 - discountPercentage / 100) * 100) / 100;

    // case 1: product has no sizes - use 'price'
    if (!plain.sizes || plain.sizes.length === 0) {
      return {
        ...plain,
        priceAfterDiscount: applyDiscount(plain.price),
        hasActiveOffer: true,
        activeOfferName: matchingOffer.name,
        discountPercentage,
      };
    }

    // case 2: product has sizes - discount each size's price
    const sizesWithDiscount = plain.sizes.map((size) => ({
      ...size,
      priceAfterDiscount: applyDiscount(size.price),
    }));

    return {
      ...plain,
      sizes: sizesWithDiscount,
      hasActiveOffer: true,
      activeOfferName: matchingOffer.name,
      discountPercentage,
    };
  });

  return isArray ? result : result[0];
};

exports.getActiveOffersForProducts = getActiveOffersForProducts;
exports.attachOfferPricing = attachOfferPricing;
