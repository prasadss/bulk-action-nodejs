const mongoose = require("mongoose");

const FailedRecordsSchema = new mongoose.Schema({
  accountId: { type: String, required: true },
  email: { type: String },
  name: { type: String },
  errorMessage: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("FailedRecords", FailedRecordsSchema);
