const redis = require("redis");
const logger = require("../utils/logger");

const client = redis.createClient({
  host: process.env.REDIS_HOST || "127.0.0.1",
  port: process.env.REDIS_PORT || 6379,
});

client.on("connect", () => logger.info("✅ Connected to Redis"));
client.on("error", (err) => logger.error("Redis error:", err));

(async () => {
  await client.connect();
})();

module.exports = client;
