const express = require("express");
const bulkService = require("../service/bulkService")
const router = express.Router();

router.post("/bulk-actions", async (req, res) => {
  const { accountId, records, operationType } = req.body;

  if (!accountId || !records || !Array.isArray(records)) {
    return res.status(400).json({ message: "Invalid request body" });
  }

  if (!["insert", "update", "delete"].includes(operationType)) {
    return res.status(400).json({
      message: "Invalid operation type. Choose from insert, update, or delete.",
    });
  }

  bulkService.bulkPushToQueue({ accountId, operationType, records });

  res.status(201).json({ message: "Bulk action queued for processing" });
});

router.get("/bulk-status", async (req, res) => {
  const { accountId } = req.query;

  const bulkActions = await BulkAction.find({ accountId });

  res.json(bulkActions);
});

module.exports = router;
