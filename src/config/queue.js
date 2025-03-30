const Queue = require("bull");
const bulkQueue = new Queue('bulk-processing', 'redis://127.0.0.1:6379');
module.exports = bulkQueue;