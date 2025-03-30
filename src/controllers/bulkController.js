const BulkAction = require("../models/bulkActionSchema");
const bulkService = require("../services/bulkService");

const createBulkAction = async (req, res) => {
  try {
    const { accountId, operationType, records } = req.body;

    if (!accountId || !operationType || !records || !records.length) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const bulkAction = new BulkAction({
      accountId,
      operationType,
      status: "queued",
      totalRecords: records.length,
      successCount: 0,
      failureCount: 0,
      skippedCount: 0,
    });

    await bulkAction.save();

    // Add job to queue
    await bulkService.bulkPushToQueue({
      accountId,
      operationType,
      records,
      actionId: bulkAction._id,
    });

    res
      .status(201)
      .json({ actionId: bulkAction._id, message: "Bulk action initiated" });
  } catch (error) {
    console.error("Error creating bulk action:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

const getBulkAction = async (req, res) => {
  try {
    const { actionId } = req.params;
    const bulkAction = await BulkAction.findById(actionId, {
      accountId: 1,
      operationType: 1,
      status: 1,
    });

    if (!bulkAction) {
      return res.status(404).json({ error: "Bulk action not found" });
    }

    res.json({
      actionId: bulkAction._id,
      accountId: bulkAction.accountId,
      operationType: bulkAction.operationType,
      status: bulkAction.status,
    });
    res.json(bulkAction);
  } catch (error) {
    console.error("Error fetching bulk action:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

const getBulkActionStats = async (req, res) => {
  try {
    const { actionId } = req.params;
    const bulkAction = await BulkAction.findById(actionId);

    if (!bulkAction) {
      return res.status(404).json({ error: "Bulk action not found" });
    }

    res.json({
      actionId: bulkAction._id,
      totalRecords: bulkAction.totalRecords,
      successCount: bulkAction.successCount,
      failureCount: bulkAction.failureCount,
      skippedCount: bulkAction.skippedCount,
      status: bulkAction.status,
    });
  } catch (error) {
    console.error("Error fetching bulk action stats:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

const getBulkActionList = async (req, res) => {
  try {
    const bulkActions = await BulkAction.find({});

    if (!bulkActions) {
      return res.status(404).json({ error: "Bulk action not found" });
    }

    res.json(
      bulkActions.map((data) => ({
        actionId: data._id,
        totalRecords: data.totalRecords,
        successCount: data.successCount,
        failureCount: data.failureCount,
        skippedCount: data.skippedCount,
        status: data.status,
      }))
    );
  } catch (error) {
    console.error("Error fetching bulk action stats:", error);
    re;
  }
};
module.exports = {
  createBulkAction,
  getBulkAction,
  getBulkActionStats,
  getBulkActionList,
};
