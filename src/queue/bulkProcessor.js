const bulkQueue = require("../config/queue");
const recordProcessingRateLimiter = require("../middleware/rateLimiter");
const { processRecords } = require("../service/bulkService");

const REQUEUE_IN_SECONDS = process.env.REQUEUE_IN_SECONDS || 60;

bulkQueue.process(async (job, done) => {
  const { accountId, operationType, records } = job.data;

  const { allowed, remaining } = await recordProcessingRateLimiter(
    accountId,
    records.length
  );

  if (allowed === 0) {
    console.log(`Rate limit exceeded. Requeueing ${records.length} records...`);
    bulkQueue.add({ accountId, records }, { delay: REQUEUE_IN_SECONDS * 1000 });
    return done();
  }

  console.log(`Processing ${allowed} records now...`);
  processRecords(operationType, records.slice(0, allowed), accountId);

  if (remaining > 0) {
    console.log(`Requeueing ${remaining} records for later processing...`);
    bulkQueue.add(
      { accountId, records: records.slice(allowed) },
      { delay: REQUEUE_IN_SECONDS * 1000 }
    );
  }

  done();
});

module.exports = bulkQueue;
