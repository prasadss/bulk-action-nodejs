const bulkQueue = require("../config/queue");
const Records = require("../models/recordsSchema");
const FailedRecords = require("../models/failedRecordSchema");

const chunkArray = (array, size) => {
  const result = [];
  for (let i = 0; i < array.length; i += size) {
    result.push(array.slice(i, i + size));
  }
  return result;
};

async function bulkPushToQueue({ accountId, operationType, records }) {
  //Size 10 is predefined but logic can be added to get user rate limit as per the subscription
  const recordChunks = chunkArray(
    records,
    process.env.RECORDS_TO_PROCESS_PER_MIN || 10
  );
  console.log(recordChunks.length);
  for (const chunk of recordChunks) {
    await bulkQueue.add(
      { accountId, operationType, records: chunk },
      { jobId: `${accountId}-${Date.now()}` }
    );
  }
}

const validateRecords = (records) => {
  const validRecords = [];
  const failedRecords = [];

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

const insertRecords = async (records, accountId) => {
  const { validRecords, failedRecords } = validateRecords(records);

  try {
    if (validRecords.length > 0) {
      await Records.insertMany(validRecords);
    }
    if (failedRecords.length > 0) {
      await FailedRecords.insertMany(failedRecords);
    }
  } catch (error) {
    await FailedRecords.insertMany(
      records.map((data) => ({ ...data, errorMessage: error.message }))
    );
  }
};

const updateRecords = async (records, accountId) => {
  //TODO: validation for unique key and id for updating
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
  } catch (error) {
    console.error(`Update failed for ${accountId}:`, error);
  }
};

const processRecords = async (operationType, records, accountId) => {
  if (operationType === "insert") {
    await insertRecords(
      records.map((data) => ({ ...data, accountId })),
      accountId
    );
  } else if (operationType === "update") {
    await updateRecords(records, accountId);
  }
};

module.exports = {
  bulkPushToQueue,
  processRecords,
};
