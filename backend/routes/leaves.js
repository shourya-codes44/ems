const express = require("express");
const router = express.Router();
const leaveController = require("../controllers/leaveController");
const authMiddleware = require("../middleware/auth");
const { validateBody, leaveApplicationSchema, leaveApprovalSchema } = require("../middleware/validation");

// Route: Apply for a Leave
router.post("/", authMiddleware, validateBody(leaveApplicationSchema), leaveController.apply);

// Route: Get all leaves for user / workflow approvals
router.get("/", authMiddleware, leaveController.getLeaves);

// Route: Get user leave balances
router.get("/balances", authMiddleware, leaveController.getBalances);

// Route: Approve or Reject leave request (Multi-level)
router.post("/:id/approve", authMiddleware, validateBody(leaveApprovalSchema), leaveController.review);

// Route: Fetch audit trails (Admin only)
router.get("/audit-logs", authMiddleware, leaveController.getAuditLogs);

module.exports = router;
