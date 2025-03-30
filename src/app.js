const express = require("express");
const bulkRoutes = require("./routes/bulkRoutes");
const connectDB = require("./config/db");
require("./config/redisClient");
connectDB()
require("./queue/bulkProcessor");

const app = express();

app.use(express.json());
app.use("/api", bulkRoutes);

module.exports = app;
