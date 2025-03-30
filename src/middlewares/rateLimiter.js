const redisClient = require("../config/redisClient");

const MAX_RECORDS_PER_MINUTE = process.env.RECORDS_TO_PROCESS_PER_MIN || 10;
const REQUEUE_IN_SECONDS = process.env.RECORDS_TO_PROCESS_PER_MIN || 60;
const recordProcessingRateLimiter = async (accountId, totalRecords) => {
  return new Promise((resolve, reject) => {
    const key = `record-processing-limit:${accountId}`;
    redisClient.get(key).then(async (currentCount) => {
      currentCount = parseInt(currentCount) || 0;

      if (currentCount >= MAX_RECORDS_PER_MINUTE) {
        return resolve({ allowed: 0, remaining: totalRecords });
      }

      const allowedNow = Math.min(
        MAX_RECORDS_PER_MINUTE - currentCount,
        totalRecords
      );
      const remaining = totalRecords - allowedNow;

      redisClient.incrBy(key, allowedNow, (err) => {
        if (err) return reject(err);
      });

      if (currentCount === 0) {
        redisClient.expire(key, REQUEUE_IN_SECONDS);
      }
      resolve({ allowed: allowedNow, remaining });
    });
  });
};

module.exports = recordProcessingRateLimiter;
