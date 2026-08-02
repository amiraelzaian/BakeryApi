const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.DB_URI);
    console.log(`✅ MongoDB connected: ${conn.connection.host}`);
  } catch (error) {
    console.error("❌ Database connection failed.");

    if (
      error.message.includes("querySrv") ||
      error.message.includes("ECONNREFUSED")
    ) {
      console.error(
        "   → This usually means DNS SRV lookups are being blocked by your network (common on some Wi-Fi/campus networks).\n" +
          "   → Try switching networks, using DNS 8.8.8.8, or using the non-SRV connection string from Atlas.",
      );
    } else if (
      error.message.includes("bad auth") ||
      error.message.includes("Authentication failed")
    ) {
      console.error(
        "   → Check your DB_URI username/password in .env — they may be wrong or the password was rotated.",
      );
    } else if (error.message.includes("IP")) {
      console.error(
        "   → Your current IP may not be whitelisted in MongoDB Atlas → Network Access.",
      );
    } else {
      console.error(`   → ${error.message}`);
    }

    process.exit(1); // don't let the app run with no database
  }
};

module.exports = connectDB;
