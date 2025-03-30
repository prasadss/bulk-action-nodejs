const mongoose = require("mongoose");
const logger = require("../utils/logger");

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    logger.info("✅ Connected to MongoDB");
  } catch (err) {
    logger.error("❌ MongoDB Connection Error:", err);
    process.exit(1);
  }
};
module.exports = connectDB;
