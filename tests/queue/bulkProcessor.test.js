const { bulkProcessor } = require("../../src/queue/bulkProcessor");
const recordProcessingRateLimiter = require("../../src/middlewares/rateLimiter");
const bulkQueue = require("../../src/config/queue");
const { processRecords } = require("../../src/services/bulkService");
const BulkAction = require("../../src/models/bulkActionSchema");
require("../../src/config/redisClient.js");

jest.mock("../../src/config/redisClient", () => ({
  get: jest.fn(),
  incrBy: jest.fn(),
  expire: jest.fn(),
}));

jest.mock("../../src/middlewares/rateLimiter");
jest.mock("../../src/config/queue", () => ({
  add: jest.fn(),
  process: jest.fn()
}));

jest.mock("../../src/services/bulkService");
jest.mock("../../src/models/bulkActionSchema");
// jest.mock("../../src/utils/logger");

describe("Bulk Queue Processor", () => {
  const mockJob = {
    data: {
      accountId: "testAccount",
      operationType: "testOperation",
      records: [{ id: 1 }, { id: 2 }, { id: 3 }],
      actionId: "testActionId",
    },
  };
  const mockDone = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should requeue records if rate limit is exceeded", async () => {
    recordProcessingRateLimiter.mockResolvedValue({ allowed: 0, remaining: 3 });
    await bulkProcessor(mockJob, mockDone);

    expect(bulkQueue.add).toHaveBeenCalledWith(mockJob.data, {
      delay: process.env.REQUEUE_IN_SECONDS * 1000 || 60000,
    });
    expect(mockDone).toHaveBeenCalled();
  });

    it("should process allowed records and update BulkAction", async () => {
      recordProcessingRateLimiter.mockResolvedValue({ allowed: 2, remaining: 1 });
      processRecords.mockResolvedValue({ successCount: 2, failureCount: 0 });
      BulkAction.findByIdAndUpdate.mockResolvedValue({
        totalRecords: 3,
        successCount: 2,
        failureCount: 0,
      });

      await bulkProcessor(mockJob, mockDone);

      expect(processRecords).toHaveBeenCalledWith(
        "testOperation",
        [{ id: 1 }, { id: 2 }],
        "testAccount"
      );
      expect(BulkAction.findByIdAndUpdate).toHaveBeenCalledWith(
        "testActionId",
        {
          $inc: { failureCount: 0, successCount: 2 },
          $set: { status: "processing" },
        },
        { new: true }
      );
      expect(mockDone).toHaveBeenCalled();
    });

    it("should mark action as complete if all records are processed", async () => {
      recordProcessingRateLimiter.mockResolvedValue({ allowed: 3, remaining: 0 });
      processRecords.mockResolvedValue({ successCount: 3, failureCount: 0 });
      BulkAction.findByIdAndUpdate.mockResolvedValue({
        totalRecords: 3,
        successCount: 3,
        failureCount: 0,
      });

      await bulkProcessor(mockJob, mockDone);

      expect(BulkAction.findByIdAndUpdate).toHaveBeenCalledWith(
        "testActionId",
        { status: "complete" }
      );
      expect(mockDone).toHaveBeenCalled();
    });

    it("should requeue remaining records if not all are processed", async () => {
      recordProcessingRateLimiter.mockResolvedValue({ allowed: 2, remaining: 1 });
      processRecords.mockResolvedValue({ successCount: 2, failureCount: 0 });
      BulkAction.findByIdAndUpdate.mockResolvedValue({
        totalRecords: 3,
        successCount: 2,
        failureCount: 0,
      });

      await bulkProcessor(mockJob, mockDone);

      expect(bulkQueue.add).toHaveBeenCalledWith(
        {
          accountId: "testAccount",
          operationType: "testOperation",
          records: [{ id: 3 }],
          actionId: "testActionId",
        },
        { delay: process.env.REQUEUE_IN_SECONDS * 1000 || 60000 }
      );
      expect(mockDone).toHaveBeenCalled();
    });
});
