const redisClient = require("../../src/config/redisClient");
const recordProcessingRateLimiter = require("../../src/middlewares/rateLimiter");

jest.mock("../../src/config/redisClient", () => ({
  get: jest.fn(),
  incrBy: jest.fn(),
  expire: jest.fn(),
}));

describe("recordProcessingRateLimiter", () => {
  const accountId = "testAccount";
  const totalRecords = 15;
  const MAX_RECORDS_PER_MINUTE = process.env.RECORDS_TO_PROCESS_PER_MIN || 10;
  const REQUEUE_IN_SECONDS = process.env.RECORDS_TO_PROCESS_PER_MIN || 60;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should allow processing if under rate limit", async () => {
    redisClient.get.mockResolvedValue("5"); // Already processed 5 records

    const result = await recordProcessingRateLimiter(accountId, totalRecords);

    expect(redisClient.get).toHaveBeenCalledWith(`record-processing-limit:${accountId}`);
    expect(redisClient.incrBy).toHaveBeenCalledWith(
      `record-processing-limit:${accountId}`,
      MAX_RECORDS_PER_MINUTE - 5,
      expect.any(Function)
    );
    expect(result).toEqual({ allowed: MAX_RECORDS_PER_MINUTE - 5, remaining: totalRecords - (MAX_RECORDS_PER_MINUTE - 5) });
  });

  it("should reject if rate limit is exceeded", async () => {
    redisClient.get.mockResolvedValue(`${MAX_RECORDS_PER_MINUTE}`); // Already processed max limit

    const result = await recordProcessingRateLimiter(accountId, totalRecords);

    expect(redisClient.get).toHaveBeenCalledWith(`record-processing-limit:${accountId}`);
    expect(result).toEqual({ allowed: 0, remaining: totalRecords });
  });

  it("should handle cases where there is no existing key in Redis", async () => {
    redisClient.get.mockResolvedValue(null); // No previous record
    redisClient.incrBy.mockImplementation((key, value, callback) => callback(null));

    const result = await recordProcessingRateLimiter(accountId, totalRecords);

    expect(redisClient.get).toHaveBeenCalledWith(`record-processing-limit:${accountId}`);
    expect(redisClient.incrBy).toHaveBeenCalledWith(
      `record-processing-limit:${accountId}`,
      MAX_RECORDS_PER_MINUTE,
      expect.any(Function)
    );
    expect(redisClient.expire).toHaveBeenCalledWith(`record-processing-limit:${accountId}`, REQUEUE_IN_SECONDS);
    expect(result).toEqual({ allowed: MAX_RECORDS_PER_MINUTE, remaining: totalRecords - MAX_RECORDS_PER_MINUTE });
  });

  it("should reject on Redis error", async () => {
    redisClient.get.mockResolvedValue("3");
    redisClient.incrBy.mockImplementation((key, value, callback) => callback(new Error("Redis error")));

    await expect(recordProcessingRateLimiter(accountId, totalRecords)).rejects.toThrow("Redis error");
  });
});
