require("dotenv").config();

const mongoose = require("mongoose");

const User = require("../models/user.model");
const Category = require("../models/category.model");
const Product = require("../models/product.model");
const Review = require("../models/review.model");
const Wishlist = require("../models/wishlist.model");
const SeasonalOffer = require("../models/seasonalOffers.model");
const Coupon = require("../models/coupon.model");
const Cart = require("../models/cart.model");

const {
  categories,
  products,
  coupons,
  seasonalOffers,
  users,
  reviews,
} = require("./data");

const MONGO_URI = process.env.DB_URI;

if (!MONGO_URI) {
  console.error("❌ MONGO_URI is missing from .env");
  process.exit(1);
}

async function seed() {
  try {
    console.log("🔌 Connecting to MongoDB...");

    await mongoose.connect(MONGO_URI);

    console.log("✅ MongoDB connected");

    // ----------------------------------
    // CLEAR DEVELOPMENT DATA
    // ----------------------------------

    console.log("🧹 Clearing existing seed data...");

    await Wishlist.deleteMany({});
    await Review.deleteMany({});
    await Cart.deleteMany({});
    await SeasonalOffer.deleteMany({});
    await Product.deleteMany({});
    await Category.deleteMany({});
    await Coupon.deleteMany({});

    // Only remove our development users.
    await User.deleteMany({
      email: {
        $in: users.map((user) => user.email),
      },
    });

    // ----------------------------------
    // USERS
    // ----------------------------------

    console.log("👤 Creating users...");

    const createdUsers = {};

    for (const userData of users) {
      const user = await User.create(userData);
      createdUsers[user.email] = user;
    }

    const admin = createdUsers["admin@skumjehbakery.com"];

    // ----------------------------------
    // CATEGORIES
    // ----------------------------------

    console.log("📂 Creating categories...");

    const categoryMap = {};

    for (const categoryData of categories) {
      const category = await Category.create(categoryData);

      categoryMap[category.name] = category;
    }

    // ----------------------------------
    // PRODUCTS
    // ----------------------------------

    console.log("🍰 Creating products...");

    const productMap = {};

    for (const productData of products) {
      const category = categoryMap[productData.category];

      if (!category) {
        throw new Error(
          `Category not found for product: ${productData.name}`,
        );
      }

      const product = await Product.create({
        name: productData.name,
        description: productData.description,

        price: productData.price,

        imageUrl: productData.imageUrl,
        imagePublicId: productData.imagePublicId,

        categoryId: category._id,

        sizes: productData.sizes,

        stockQuantity: productData.stockQuantity,

        createdBy: admin._id,
      });

      productMap[product.name] = product;
    }

    // ----------------------------------
    // COUPONS
    // ----------------------------------

    console.log("🎟️ Creating coupons...");

    await Coupon.insertMany(coupons);

    // ----------------------------------
    // SEASONAL OFFERS
    // ----------------------------------

    console.log("🔥 Creating seasonal offers...");

    for (const offerData of seasonalOffers) {
      const offerProducts = offerData.productNames
        .map((productName) => productMap[productName]?._id)
        .filter(Boolean);

      let categoryId = null;

      if (offerData.categoryName) {
        categoryId = categoryMap[offerData.categoryName]?._id;
      }

      await SeasonalOffer.create({
        name: offerData.name,
        description: offerData.description,
        bannerImage: offerData.bannerImage,

        discountPercentage: offerData.discountPercentage,

        startDate: offerData.startDate,
        endDate: offerData.endDate,

        products: offerProducts,

        category: categoryId,

        isActive: offerData.isActive,
      });
    }

    // ----------------------------------
    // REVIEWS
    // ----------------------------------

    console.log("⭐ Creating reviews...");

    for (const reviewData of reviews) {
      const user = createdUsers[reviewData.userEmail];
      const product = productMap[reviewData.productName];

      if (!user) {
        console.warn(
          `⚠️ User not found for review: ${reviewData.userEmail}`,
        );
        continue;
      }

      if (!product) {
        console.warn(
          `⚠️ Product not found for review: ${reviewData.productName}`,
        );
        continue;
      }

      await Review.create({
        user: user._id,
        product: product._id,
        rating: reviewData.rating,
        comment: reviewData.comment,
      });
    }

    // ----------------------------------
    // WISHLIST
    // ----------------------------------

    console.log("❤️ Creating wishlist examples...");

    const mariam = createdUsers["mariam@example.com"];
    const nour = createdUsers["nour@example.com"];

    await Wishlist.create([
      {
        user: mariam._id,
        product: productMap["Lotus Biscoff Cake"]._id,
      },
      {
        user: mariam._id,
        product: productMap["Iced Spanish Latte"]._id,
      },
      {
        user: nour._id,
        product: productMap["Red Velvet Cake"]._id,
      },
      {
        user: nour._id,
        product: productMap["Chocolate Croissant"]._id,
      },
    ]);

    // ----------------------------------
    // SAMPLE CART
    // ----------------------------------

    console.log("🛒 Creating sample customer cart...");

    await Cart.create({
      userId: mariam._id,

      cartItems: [
        {
          productId: productMap["Classic Chocolate Cake"]._id,
          quantity: 1,
          size: "medium",
          price: 550,
        },
        {
          productId: productMap["Iced Spanish Latte"]._id,
          quantity: 2,
          size: "medium",
          price: 110,
        },
        {
          productId: productMap["Chocolate Chip Cookies"]._id,
          quantity: 1,
          price: 90,
        },
      ],

      totalCartPrice: 860,
      totalPriceAfterDiscount: null,
    });

    // ----------------------------------
    // SUMMARY
    // ----------------------------------

    console.log("");
    console.log("======================================");
    console.log("🎉 SEED COMPLETED SUCCESSFULLY");
    console.log("======================================");

    console.log(`👤 Users: ${await User.countDocuments()}`);
    console.log(`📂 Categories: ${await Category.countDocuments()}`);
    console.log(`🍰 Products: ${await Product.countDocuments()}`);
    console.log(`⭐ Reviews: ${await Review.countDocuments()}`);
    console.log(`❤️ Wishlist items: ${await Wishlist.countDocuments()}`);
    console.log(
      `🔥 Seasonal offers: ${await SeasonalOffer.countDocuments()}`,
    );
    console.log(`🎟️ Coupons: ${await Coupon.countDocuments()}`);
    console.log(`🛒 Carts: ${await Cart.countDocuments()}`);

    console.log("");
    console.log("🔐 Development accounts:");
    console.log("Admin:    admin@skumjehbakery.com / Admin123456");
    console.log("Baker:    baker@skumjehbakery.com / Baker123456");
    console.log("Delivery: delivery@skumjehbakery.com / Delivery123456");
    console.log("Customer: mariam@example.com / Customer123456");
    console.log("");

    await mongoose.disconnect();

    console.log("🔌 MongoDB disconnected");
    process.exit(0);
  } catch (error) {
    console.error("");
    console.error("❌ SEED FAILED");
    console.error(error);

    await mongoose.disconnect();

    process.exit(1);
  }
}

seed();