const reportRepository = require("../repositories/reportRepository");

class ReportService {
  async getDashboardStats() {
    return reportRepository.getDashboardAnalytics();
  }

  async getHRReports() {
    const [employeeLeaves, departmentLeaves, leaveBalances] = await Promise.all([
      reportRepository.getEmployeeWiseLeaves(),
      reportRepository.getDepartmentWiseLeaves(),
      reportRepository.getLeaveBalancesReport()
    ]);

    return {
      employeeLeaves,
      departmentLeaves,
      leaveBalances
    };
  }

  // Advanced SQL Sandbox Executions
  async getAdvancedSQLSandbox() {
    const [windowFunctionResults, subqueryResults, groupByResults] = await Promise.all([
      reportRepository.executeWindowFunction(),
      reportRepository.executeSubQuery(),
      reportRepository.executeGroupByAggregate()
    ]);

    const formatRow = (row) => {
      const formatted = { ...row };
      if (row.salary) formatted.salary = parseFloat(row.salary);
      if (row.total_salary) formatted.total_salary = parseFloat(row.total_salary);
      if (row.average_salary) formatted.average_salary = parseFloat(row.average_salary);
      if (row.max_salary) formatted.max_salary = parseFloat(row.max_salary);
      if (row.min_salary) formatted.min_salary = parseFloat(row.min_salary);
      if (row.salary_rank) formatted.salary_rank = parseInt(row.salary_rank);
      if (row.employee_count) formatted.employee_count = parseInt(row.employee_count);
      return formatted;
    };

    return {
      windowRank: windowFunctionResults.map(formatRow),
      salaryAboveAverage: subqueryResults.map(formatRow),
      departmentAggregates: groupByResults.map(formatRow)
    };
  }

  async getDepartmentStats() {
    return reportRepository.getDepartmentStats();
  }

  async getMonthlyLeaves() {
    return reportRepository.getMonthlyLeaves();
  }

  async getHiringTrend() {
    return reportRepository.getHiringTrend();
  }

  async getEmployeeExportData() {
    const rows = await reportRepository.getEmployeeExportData();
    return rows.map((r) => ({
      ...r,
      Salary: r.Salary ? parseFloat(r.Salary) : null,
      "Joined On": r["Joined On"] ? new Date(r["Joined On"]).toLocaleDateString() : null,
    }));
  }

  async getLeaveExportData() {
    const rows = await reportRepository.getLeaveExportData();
    return rows.map((r) => ({
      ...r,
      From: r.From ? new Date(r.From).toLocaleDateString() : null,
      To: r.To ? new Date(r.To).toLocaleDateString() : null,
      "Applied On": r["Applied On"] ? new Date(r["Applied On"]).toLocaleDateString() : null,
    }));
  }
}

module.exports = new ReportService();
