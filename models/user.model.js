const mongoose = require("mongoose");

const userShcema = new mongoose.Schema(
  {
    name: {
      type: String,
      require: [true, "User name is required"],
      trim: true,
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: [true, "Email must be unique -Eamil is already in use"],
      trim: true,
    },
    password: {
      type: String,
      // required only for local accounts - Google accounts won't have one
      required: function () {
        return this.provider === "local";
      },
      select: false, // never raturn pass by default in queries
    },
    provider: {
      type: String,
      enum: ["local", "google"],
      default: "local",
    },
    googleId: {
      type: String,
      unique: true,
      sparse: true, //allows multipe docs with null google id
    },
    role: {
      type: String,
      enum: ["customer", "admin", "baker", "delivery"],
      default: "customer",
    },
    phone: {
      type: String,
      trime: true,
    },
    address: {
      governorate: String,
      city: String,
      street: String,
      zipCode: String,
      postalCode: String,
    },
    avatarUrl: {
      type: String,
      default: null,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model("User", userSchema);
