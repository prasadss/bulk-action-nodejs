require("dotenv").config();
const logger = require('./utils/logger')
const app = require("./app");

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  logger.info(`Server is running on port ${PORT}`);
});
