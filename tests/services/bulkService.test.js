const { processRecords } = require("../../src/services/bulkService");
const Records = require("../../src/models/recordsSchema");
const FailedRecords = require("../../src/models/failedRecordSchema");

jest.mock("../../src/models/recordsSchema");
jest.mock("../../src/models/failedRecordSchema");

describe("Bulk Processor Service", () => {
  test("Should process bulk insert successfully", async () => {
    Records.insertMany.mockResolvedValue(true);
    const result = await processRecords(
      "insert",
      [{ email: "test@example.com", name: "test name" }],
      "acc123"
    );
    expect(result.successCount).toBe(1);
    expect(result.failureCount).toBe(0);
  });

  test("Should process bulk update successfully", async () => {
    Records.bulkWrite.mockResolvedValue({ modifiedCount: 1 });
    const result = await processRecords(
      "update",
      [{ email: "test@example.com", name: "test name" }],
      "acc123"
    );
    expect(result.successCount).toBe(1);
    expect(result.failureCount).toBe(0);
  });

  test("Should log failed records if validation fails", async () => {
    FailedRecords.insertMany.mockResolvedValue(true);
    const result = await processRecords("insert", [{ email: "" }], "acc123");
    expect(result.successCount).toBe(0);
    expect(result.failureCount).toBe(1);
  });
});
