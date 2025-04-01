const Queue = require("bull");
const bulkQueue = new Queue(
  "bulk-processing",
  `redis://${process.env.REDIS_HOST || "127.0.0.1"}:${
    process.env.REDIS_PORT || 6379
  }`
);
module.exports = bulkQueue;
