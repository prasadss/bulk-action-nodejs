const express = require("express");
const router = express.Router();
const {
  createBulkAction,
  getBulkAction,
  getBulkActionStats,
  getBulkActionList,
} = require("../controllers/bulkController");

router.post("/bulk-actions", createBulkAction);
router.get("/bulk-actions", getBulkActionList);
router.get("/bulk-actions/:actionId", getBulkAction);
router.get("/bulk-actions/:actionId/stats", getBulkActionStats);

module.exports = router;
