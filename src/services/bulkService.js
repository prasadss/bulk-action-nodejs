const bulkQueue = require("../config/queue");
const Records = require("../models/recordsSchema");
const FailedRecords = require("../models/failedRecordSchema");
const logger = require("../utils/logger");

const chunkArray = (array, size) => {
  const result = [];
  for (let i = 0; i < array.length; i += size) {
    result.push(array.slice(i, i + size));
  }
  return result;
};

async function bulkPushToQueue({
  accountId,
  operationType,
  records,
  actionId,
}) {
  //Size 10 is predefined but logic can be added to get user rate limit as per the subscription
  const recordChunks = chunkArray(
    records,
    process.env.RECORDS_TO_PROCESS_PER_MIN || 10
  );

  for (const chunk of recordChunks) {
    await bulkQueue.add(
      { accountId, operationType, records: chunk, actionId },
      { jobId: `${accountId}-${Date.now()}` }
    );
  }
}

const validateRecords = (records) => {
  const validRecords = [];
  const failedRecords = [];
  console.log( records)

  for (const record of records) {
    if (!record.email || !record.name) {
      failedRecords.push({
        accountId: record.accountId,
        email: record.email || "",
        name: record.name || "",
        errorMessage: "Missing required fields",
      });
    } else {
      validRecords.push(record);
    }
  }

  return { validRecords, failedRecords };
};

const handleFailure = async (records, error) => {
  try {
    logger.error(error.message);
    await FailedRecords.insertMany(
      records.map((data) => ({ ...data, errorMessage: error.message }))
    );
  } catch (error) {
    logger.error("soething went wrong", error.messag);
  }
};
const insertRecords = async (records, accountId) => {
  const { validRecords, failedRecords } = validateRecords(records);
  try {
    if (validRecords.length > 0) {
      await Records.insertMany(validRecords);
    }
    if (failedRecords.length > 0) {
      await FailedRecords.insertMany(failedRecords);
    }
    return {
      successCount: validRecords.length,
      failureCount: failedRecords.length,
    };
  } catch (error) {
    handleFailure(records, error);
    return {
      successCount: 0,
      failureCount: failedRecords.length,
    };
  }
};

const updateRecords = async (records, accountId) => {
  const { validRecords, failedRecords } = validateRecords(records);

  try {
    const bulkUpdates = validRecords.map((record) => ({
      updateOne: { filter: { email: record.email }, update: { $set: record } },
    }));

    if (bulkUpdates.length > 0) {
      await Records.bulkWrite(bulkUpdates);
    }
    if (failedRecords.length > 0) {
      await FailedRecords.insertMany(failedRecords);
    }
    return {
      successCount: validRecords.length,
      failureCount: failedRecords.length,
    };
  } catch (error) {
    handleFailure(records, error);
    return {
      successCount: 0,
      failureCount: failedRecords.length,
    };
  }
};

const processRecords = async (operationType, records, accountId) => {
  if (operationType === "insert") {
    return await insertRecords(
      records.map((data) => ({ ...data, accountId })),
      accountId
    );
  } else if (operationType === "update") {
    return await updateRecords(records, accountId);
  }
  return { failureCount: 0, successCount: 0 };
};

module.exports = {
  bulkPushToQueue,
  processRecords,
};
