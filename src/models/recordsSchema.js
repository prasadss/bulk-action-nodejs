const mongoose = require("mongoose");

const RecordsSchema = new mongoose.Schema({
  accountId: { type: String, required: true },
  email: { type: String, required: true },
  name: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Records", RecordsSchema);
