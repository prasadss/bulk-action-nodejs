const bulkQueue = require("../config/queue");
const recordProcessingRateLimiter = require("../middlewares/rateLimiter");
const { processRecords } = require("../services/bulkService");
const BulkAction = require("../models/bulkActionSchema");
const logger = require("../utils/logger");

const REQUEUE_IN_SECONDS = process.env.REQUEUE_IN_SECONDS || 60;

const bulkProcessor = async (job, done) => {
  const { accountId, operationType, records, actionId } = job.data;

  const { allowed, remaining } = await recordProcessingRateLimiter(
    accountId,
    records.length
  );

  if (allowed === 0) {
    logger.info(`Rate limit exceeded. Requeueing ${records.length} records...`);
    bulkQueue.add(
      { accountId, records, operationType, actionId },
      { delay: REQUEUE_IN_SECONDS * 1000 }
    );
    return done();
  }

  logger.info(`Processing ${allowed} records now...`);
  const { successCount, failureCount } = await processRecords(
    operationType,
    records.slice(0, allowed),
    accountId
  );
  const updateResult = await BulkAction.findByIdAndUpdate(
    actionId,
    {
      $inc: { failureCount, successCount },
      $set: { status: "processing" },
    },
    { new: true }
  );

  if (
    updateResult &&
    updateResult.totalRecords ===
      updateResult.successCount + updateResult.failureCount
  ) {
    await BulkAction.findByIdAndUpdate(actionId, { status: "complete" });
  }

  if (remaining > 0) {
    logger.info(`Requeueing ${remaining} records for later processing...`);
    bulkQueue.add(
      { accountId, operationType, records: records.slice(allowed), actionId },
      { delay: REQUEUE_IN_SECONDS * 1000 }
    );
  }

  done();
};

bulkQueue.process(bulkProcessor);

module.exports = { bulkQueue, bulkProcessor };
