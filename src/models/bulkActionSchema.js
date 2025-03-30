const mongoose = require("mongoose");

const BulkActionSchema = new mongoose.Schema({
  accountId: String,
  status: {
    type: String,
    enum: ["queued", "processing", "completed", "failed"],
    default: "queued",
  },
  operationType: {
    type: String,
    required: true,
    enum: ["insert", "update", "delete"],
  },
  totalEntities: Number,
  successCount: { type: Number, default: 0 },
  failureCount: { type: Number, default: 0 },
  skippedCount: { type: Number, default: 0 },
  totalRecords: { type: Number, defult: 0 },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("BulkAction", BulkActionSchema);
