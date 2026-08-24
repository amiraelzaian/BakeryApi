const { createClient } = require("redis");

const redisClient = createClient({
  url: process.env.REDIS_URL || "redis://127.0.0.1:6379",
  socket: {
    tls: process.env.REDIS_URL?.startsWith("rediss://"),
    connectTimeout: 10000,
    reconnectStrategy: (retries) => {
      if (retries > 3) return new Error("Redis: too many retries");
      return Math.min(retries * 100, 3000);
    },
  },
});

redisClient.on("error", (err) => {
  console.error("Redis Client Error:", err);
});

async function connectRedis() {
  if (redisClient.isOpen) {
    return;
  }
  try {
    await redisClient.connect();
    console.log("Redis connected successfully");
  } catch (err) {
    console.error("Failed to connect to Redis:", err.message);
  }
}

async function ensureRedisConnected() {
  if (!redisClient.isOpen) {
    await connectRedis();
  }
}

module.exports = {
  redisClient,
  connectRedis,
  ensureRedisConnected,
};
