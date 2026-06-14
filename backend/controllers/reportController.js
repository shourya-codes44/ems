const reportService = require("../services/reportService");
const { generateExcel, generateCSV, sendFile } = require("../utils/exporter");

class ReportController {
  async getStats(req, res, next) {
    try {
      const stats = await reportService.getDashboardStats();
      res.json(stats);
    } catch (err) {
      next(err);
    }
  }

  async getHRReports(req, res, next) {
    try {
      const reports = await reportService.getHRReports();
      res.json(reports);
    } catch (err) {
      next(err);
    }
  }

  async getSQLSandbox(req, res, next) {
    try {
      const sandbox = await reportService.getAdvancedSQLSandbox();
      res.json(sandbox);
    } catch (err) {
      next(err);
    }
  }

  // Chart endpoints
  async getDepartmentStats(req, res, next) {
    try {
      const data = await reportService.getDepartmentStats();
      res.json(data);
    } catch (err) {
      next(err);
    }
  }

  async getMonthlyLeaves(req, res, next) {
    try {
      const data = await reportService.getMonthlyLeaves();
      res.json(data);
    } catch (err) {
      next(err);
    }
  }

  async getHiringTrend(req, res, next) {
    try {
      const data = await reportService.getHiringTrend();
      res.json(data);
    } catch (err) {
      next(err);
    }
  }

  // Export endpoints
  async exportEmployees(req, res, next) {
    try {
      const { format = "xlsx" } = req.query;
      const data = await reportService.getEmployeeExportData();
      if (format === "csv") {
        return sendFile(res, generateCSV(data), "employee-report.csv", "text/csv");
      }
      return sendFile(
        res, generateExcel(data, "Employees"), "employee-report.xlsx",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      );
    } catch (err) {
      next(err);
    }
  }

  async exportLeaves(req, res, next) {
    try {
      const { format = "xlsx" } = req.query;
      const data = await reportService.getLeaveExportData();
      if (format === "csv") {
        return sendFile(res, generateCSV(data), "leave-report.csv", "text/csv");
      }
      return sendFile(
        res, generateExcel(data, "Leaves"), "leave-report.xlsx",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      );
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new ReportController();
