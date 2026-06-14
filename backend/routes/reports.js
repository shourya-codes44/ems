const express = require("express");
const router = express.Router();
const reportController = require("../controllers/reportController");
const authMiddleware = require("../middleware/auth");
const authorize = require("../middleware/rbac");

// ─── Dashboard KPIs (all authenticated users) ────────────────────────────────
router.get("/stats", authMiddleware, reportController.getStats.bind(reportController));

// ─── Chart Data Endpoints (all authenticated users) ──────────────────────────
router.get("/department-stats", authMiddleware, reportController.getDepartmentStats.bind(reportController));
router.get("/monthly-leaves", authMiddleware, reportController.getMonthlyLeaves.bind(reportController));
router.get("/hiring-trend", authMiddleware, reportController.getHiringTrend.bind(reportController));

// ─── HR Reports (Admin & HR only) ────────────────────────────────────────────
router.get("/hr", authMiddleware, authorize("admin", "hr"), reportController.getHRReports.bind(reportController));

// ─── Advanced SQL Sandbox (Admin & HR only) ───────────────────────────────────
router.get("/sql-sandbox", authMiddleware, authorize("admin", "hr"), reportController.getSQLSandbox.bind(reportController));

// ─── Export Endpoints (Admin & HR only) ──────────────────────────────────────
router.get("/export/employees", authMiddleware, authorize("admin", "hr"), reportController.exportEmployees.bind(reportController));
router.get("/export/leaves", authMiddleware, authorize("admin", "hr"), reportController.exportLeaves.bind(reportController));

module.exports = router;
