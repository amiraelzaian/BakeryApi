const dns = require("dns");
dns.setServers(["8.8.8.8", "8.8.4.4"]);

require("dotenv").config();
const cors = require("cors");
const path = require("path");
const morgan = require("morgan");
const express = require("express");
const { connectRedis } = require("./redis");
const mongoose = require("mongoose");
const ApiError = require("./utils/apiError");
const globalError = require("./middlewares/globalErrorMiddleware");
const dbConnection = require("./database");
//routes
const userRoute = require("./routes/user.route");
const authRoute = require("./routes/auth.route");
const categoryRoute = require("./routes/category.route");
const productRoute = require("./routes/product.route");
const cartRoute = require("./routes/cart.route");
const couponRoute = require("./routes/coupon.route");

//db connection
dbConnection();
//express app
const app = express();
connectRedis();

//enable other domains to access your app
app.use(cors());
app.options("*all", cors());

// middlewares
app.use(express.json());
app.set("query parser", "extended");
if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}

// routes
app.get("/", (req, res, next) => {
  res.send("test, route is mounted");
});
app.use("/api/v1/users", userRoute);
app.use("/api/v1/auth", authRoute);
app.use("/api/v1/categories", categoryRoute);
app.use("/api/v1/products", productRoute);
app.use("/api/v1/cart", cartRoute);
app.use("/api/v1/coupons", couponRoute);

// not found routes
app.all("*all", (req, res, next) => {
  next(new ApiError(`could not find this route: ${req.originalUrl}`, 400));
});

//global error handling middleware
app.use(globalError);

// run
const server = app.listen(process.env.PORT, () => {
  console.log(`running on port ${process.env.PORT}`);
});

// handle rejection outside express
process.on("unhandledRejection", (err) => {
  console.log(`unhandledRejection Errors: ${err.name} | ${err.message}`);
  server.close(() => {
    console.error("Shutting down");
    process.exit(1);
  });
});
