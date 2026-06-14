import React, { useState, useEffect, useCallback } from "react";
import api from "../services/api";
import Table from "../components/common/Table";
import Card from "../components/common/Card";
import Loader from "../components/common/Loader";
import Button from "../components/common/Button";

const rawApiUrl = process.env.REACT_APP_API_URL || "https://ems-backend-60cl.onrender.com/api";
const API_URL = rawApiUrl.endsWith("/api") ? rawApiUrl : `${rawApiUrl.replace(/\/$/, "")}/api`;

export function Reports({ showToast }) {
  const [activeTab, setActiveTab] = useState("hr"); // hr, sandbox, export
  const [hrData, setHrData] = useState(null);
  const [sandboxData, setSandboxData] = useState(null);
  const [loadingHR, setLoadingHR] = useState(false);
  const [loadingSandbox, setLoadingSandbox] = useState(false);
  const [exporting, setExporting] = useState("");

  // Queries explanations and SQL snippets
  const sqlQueries = {
    window: {
      title: "1. Window Functions (DENSE_RANK)",
      desc: "Rank employee salaries within each department without skipping ranks.",
      sql: `SELECT 
  u.name,
  d.department_name,
  ep.designation,
  ep.salary,
  DENSE_RANK() OVER (PARTITION BY ep.department_id ORDER BY ep.salary DESC) as salary_rank
FROM employee_profiles ep
INNER JOIN users u ON ep.user_id = u.id
INNER JOIN departments d ON ep.department_id = d.id;`
    },
    subquery: {
      title: "2. Subqueries in WHERE Clause",
      desc: "Retrieve profiles of employees earning more than the company's average salary.",
      sql: `SELECT 
  u.name,
  ep.designation,
  ep.salary
FROM employee_profiles ep
INNER JOIN users u ON ep.user_id = u.id
WHERE ep.salary > (
  SELECT AVG(salary) FROM employee_profiles
)
ORDER BY ep.salary DESC;`
    },
    groupBy: {
      title: "3. GROUP BY & Aggregation Functions",
      desc: "Calculate department totals, employee counts, average, maximum, and minimum salaries.",
      sql: `SELECT 
  d.department_name,
  COUNT(ep.id) as employee_count,
  SUM(ep.salary) as total_salary,
  ROUND(AVG(ep.salary), 2) as average_salary,
  MAX(ep.salary) as max_salary,
  MIN(ep.salary) as min_salary
FROM departments d
LEFT JOIN employee_profiles ep ON ep.department_id = d.id
GROUP BY d.id, d.department_name
ORDER BY employee_count DESC;`
    }
  };

  const fetchHRReports = useCallback(async () => {
    try {
      setLoadingHR(true);
      const res = await api.get("/reports/hr");
      setHrData(res.data);
    } catch (error) {
      if (showToast) {
        showToast(error.response?.data?.message || "Failed to fetch HR reports", "error");
      }
    } finally {
      setLoadingHR(false);
    }
  }, [showToast]);

  const fetchSandboxReports = useCallback(async () => {
    try {
      setLoadingSandbox(true);
      const res = await api.get("/reports/sql-sandbox");
      setSandboxData(res.data);
    } catch (error) {
      if (showToast) {
        showToast(error.response?.data?.message || "Failed to run sandbox queries", "error");
      }
    } finally {
      setLoadingSandbox(false);
    }
  }, [showToast]);

  const handleExport = useCallback(async (type, format) => {
    setExporting(`${type}-${format}`);
    try {
      const res = await api.get(`/reports/export/${type}?format=${format}`, {
        responseType: "blob"
      });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `${type}-report.${format}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      if (showToast) showToast(`${type} report downloaded!`, "success");
    } catch (_) {
      if (showToast) showToast("Export failed. Please try again.", "error");
    } finally {
      setExporting("");
    }
  }, [showToast]);

  useEffect(() => {
    if (activeTab === "hr") {
      fetchHRReports();
    } else if (activeTab === "sandbox") {
      fetchSandboxReports();
    }
  }, [activeTab, fetchHRReports, fetchSandboxReports]);

  return (
    <div className="master-panel-container animate-fade-in">
      <div className="welcome-banner">
        <h2>HR Analytics & SQL Playground</h2>
        <p>Analyze leave summaries, department performance metrics, and try raw SQL triggers.</p>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", borderBottom: "1px solid var(--color-border)", marginBottom: "24px", gap: "8px" }}>
        <button
          onClick={() => setActiveTab("hr")}
          className={`tab-btn ${activeTab === "hr" ? "active" : ""}`}
          style={{ flex: "none", padding: "12px 24px" }}
        >
          HR Absence Analytics
        </button>
        <button
          onClick={() => setActiveTab("sandbox")}
          className={`tab-btn ${activeTab === "sandbox" ? "active" : ""}`}
          style={{ flex: "none", padding: "12px 24px" }}
        >
          PostgreSQL SQL Sandbox
        </button>
        <button
          onClick={() => setActiveTab("export")}
          className={`tab-btn ${activeTab === "export" ? "active" : ""}`}
          style={{ flex: "none", padding: "12px 24px" }}
          id="export-tab-btn"
        >
          ⬇️ Export Reports
        </button>
      </div>

      {/* Tab: Export Reports */}
      {activeTab === "export" && (
        <div className="export-panel">
          <h3 style={{ marginBottom: "8px" }}>📥 Download Reports</h3>
          <p style={{ color: "var(--color-text-muted)", marginBottom: "24px" }}>
            Export company data in Excel (XLSX) or CSV format for offline analysis.
          </p>

          <div className="export-grid">
            {/* Employee Report */}
            <div className="export-card">
              <div className="export-card-icon">👥</div>
              <h4>Employee Report</h4>
              <p>All employees with profile, designation, department, salary, and join date.</p>
              <div className="export-card-actions">
                <button
                  className="btn btn-primary"
                  onClick={() => handleExport("employees", "xlsx")}
                  disabled={exporting === "employees-xlsx"}
                  id="export-employees-xlsx"
                >
                  {exporting === "employees-xlsx" ? "Exporting…" : "📊 Export XLSX"}
                </button>
                <button
                  className="btn btn-outline"
                  onClick={() => handleExport("employees", "csv")}
                  disabled={exporting === "employees-csv"}
                  id="export-employees-csv"
                >
                  {exporting === "employees-csv" ? "Exporting…" : "📄 Export CSV"}
                </button>
              </div>
            </div>

            {/* Leave Report */}
            <div className="export-card">
              <div className="export-card-icon">🌴</div>
              <h4>Leave Report</h4>
              <p>All leave applications with employee name, type, dates, reason, and approval status.</p>
              <div className="export-card-actions">
                <button
                  className="btn btn-primary"
                  onClick={() => handleExport("leaves", "xlsx")}
                  disabled={exporting === "leaves-xlsx"}
                  id="export-leaves-xlsx"
                >
                  {exporting === "leaves-xlsx" ? "Exporting…" : "📊 Export XLSX"}
                </button>
                <button
                  className="btn btn-outline"
                  onClick={() => handleExport("leaves", "csv")}
                  disabled={exporting === "leaves-csv"}
                  id="export-leaves-csv"
                >
                  {exporting === "leaves-csv" ? "Exporting…" : "📄 Export CSV"}
                </button>
              </div>
            </div>

            {/* Asset Report */}
            <div className="export-card">
              <div className="export-card-icon">💼</div>
              <h4>Asset Report</h4>
              <p>All company assets with type, status, allocation info, and purchase cost.</p>
              <div className="export-card-actions">
                <a
                  className="btn btn-primary"
                  href={`${API_URL}/assets?export=xlsx`}
                  download="asset-report.xlsx"
                  id="export-assets-xlsx"
                  style={{ textDecoration: "none", display: "inline-block", textAlign: "center" }}
                >
                  📊 Export XLSX
                </a>
                <a
                  className="btn btn-outline"
                  href={`${API_URL}/assets?export=csv`}
                  download="asset-report.csv"
                  id="export-assets-csv"
                  style={{ textDecoration: "none", display: "inline-block", textAlign: "center" }}
                >
                  📄 Export CSV
                </a>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab: HR Absence Analytics */}
      {activeTab === "hr" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "28px" }}>
          {loadingHR && !hrData ? (
            <Loader message="Synthesizing HR summaries..." />
          ) : (
            <>
              {/* Department Leave Analytics */}
              <Card title="Absenteeism by Department">
                <Table
                  headers={["Department", "Approved Leaves Count", "Accumulated Absent Days"]}
                  data={hrData?.departmentLeaves || []}
                  loading={loadingHR}
                  emptyMessage="No departmental leaves recorded yet."
                  renderRow={(row, idx) => (
                    <tr key={idx}>
                      <td style={{ fontWeight: 700 }}>{row.department_name}</td>
                      <td>{row.total_leaves} requests</td>
                      <td style={{ fontWeight: 600, color: "var(--color-primary)" }}>{row.total_days_absent} Days</td>
                    </tr>
                  )}
                />
              </Card>

              {/* Employee Absenteeism Rank */}
              <Card title="Absenteeism Ranks (Top Leaves Taken)">
                <Table
                  headers={["Rank", "Employee Name", "Email", "Approved Leaves Count", "Total Days Absent"]}
                  data={hrData?.employeeLeaves || []}
                  loading={loadingHR}
                  emptyMessage="No employee leaves recorded yet."
                  renderRow={(row, idx) => (
                    <tr key={idx}>
                      <td style={{ fontWeight: 600, color: "var(--color-text-muted)" }}>#{idx + 1}</td>
                      <td style={{ fontWeight: 700 }}>{row.name}</td>
                      <td>{row.email}</td>
                      <td>{row.total_leaves} applications</td>
                      <td style={{ fontWeight: 600, color: "var(--color-primary)" }}>{row.total_days_absent} Days</td>
                    </tr>
                  )}
                />
              </Card>

              {/* General Balance Audit List */}
              <Card title="Corporate Leave Balance Ledger">
                <Table
                  headers={["Employee Name", "Leave Type", "Remaining Balance"]}
                  data={hrData?.leaveBalances || []}
                  loading={loadingHR}
                  emptyMessage="No balance sheets initialized."
                  renderRow={(row, idx) => (
                    <tr key={idx}>
                      <td>{row.name}</td>
                      <td style={{ fontWeight: 600 }}>{row.leave_name}</td>
                      <td>
                        <span style={{ fontWeight: 700, padding: "2px 8px", backgroundColor: "var(--bg-input)", borderRadius: "4px" }}>
                          {row.available_days} Days
                        </span>
                      </td>
                    </tr>
                  )}
                />
              </Card>
            </>
          )}
        </div>
      )}

      {/* Tab: PostgreSQL SQL Sandbox */}
      {activeTab === "sandbox" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "32px" }}>
          {loadingSandbox && !sandboxData ? (
            <Loader message="Interrogating PostgreSQL schema..." />
          ) : (
            <>
              {/* Window Function Panel */}
              <Card>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                  <div>
                    <h3 style={{ margin: 0, fontSize: "1.1rem", fontWeight: 700 }}>{sqlQueries.window.title}</h3>
                    <p style={{ color: "var(--color-text-muted)", fontSize: "0.85rem", margin: "4px 0 0 0" }}>{sqlQueries.window.desc}</p>
                  </div>
                  <Button variant="secondary" onClick={fetchSandboxReports} loading={loadingSandbox}>
                    Re-run Query
                  </Button>
                </div>
                <pre
                  style={{
                    backgroundColor: "var(--color-primary-light)",
                    padding: "16px",
                    borderRadius: "var(--radius-sm)",
                    fontFamily: "var(--font-mono)",
                    fontSize: "0.82rem",
                    overflowX: "auto",
                    color: "var(--color-primary)",
                    border: "1px solid rgba(5, 150, 105, 0.1)",
                    marginBottom: "20px"
                  }}
                >
                  {sqlQueries.window.sql}
                </pre>
                <h4 style={{ fontSize: "0.9rem", fontWeight: 700, marginBottom: "12px" }}>Execution Results:</h4>
                <Table
                  headers={["Salary Rank", "Name", "Department", "Designation", "Salary"]}
                  data={sandboxData?.windowRank || []}
                  loading={loadingSandbox}
                  emptyMessage="No profiles available for salary ranking."
                  renderRow={(row, idx) => (
                    <tr key={idx}>
                      <td style={{ fontWeight: 700, color: "var(--color-primary)" }}>#{row.salary_rank}</td>
                      <td style={{ fontWeight: 600 }}>{row.name}</td>
                      <td>{row.department_name}</td>
                      <td>{row.designation}</td>
                      <td style={{ fontFamily: "var(--font-mono)", fontWeight: 500 }}>${row.salary?.toLocaleString()}</td>
                    </tr>
                  )}
                />
              </Card>

              {/* Subquery Panel */}
              <Card>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                  <div>
                    <h3 style={{ margin: 0, fontSize: "1.1rem", fontWeight: 700 }}>{sqlQueries.subquery.title}</h3>
                    <p style={{ color: "var(--color-text-muted)", fontSize: "0.85rem", margin: "4px 0 0 0" }}>{sqlQueries.subquery.desc}</p>
                  </div>
                  <Button variant="secondary" onClick={fetchSandboxReports} loading={loadingSandbox}>
                    Re-run Query
                  </Button>
                </div>
                <pre
                  style={{
                    backgroundColor: "var(--color-primary-light)",
                    padding: "16px",
                    borderRadius: "var(--radius-sm)",
                    fontFamily: "var(--font-mono)",
                    fontSize: "0.82rem",
                    overflowX: "auto",
                    color: "var(--color-primary)",
                    border: "1px solid rgba(5, 150, 105, 0.1)",
                    marginBottom: "20px"
                  }}
                >
                  {sqlQueries.subquery.sql}
                </pre>
                <h4 style={{ fontSize: "0.9rem", fontWeight: 700, marginBottom: "12px" }}>Execution Results:</h4>
                <Table
                  headers={["Employee Name", "Designation", "Salary"]}
                  data={sandboxData?.salaryAboveAverage || []}
                  loading={loadingSandbox}
                  emptyMessage="No employee exceeds the average salary threshold."
                  renderRow={(row, idx) => (
                    <tr key={idx}>
                      <td style={{ fontWeight: 600 }}>{row.name}</td>
                      <td>{row.designation}</td>
                      <td style={{ fontFamily: "var(--font-mono)", fontWeight: 500 }}>${row.salary?.toLocaleString()}</td>
                    </tr>
                  )}
                />
              </Card>

              {/* Group By Panel */}
              <Card>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                  <div>
                    <h3 style={{ margin: 0, fontSize: "1.1rem", fontWeight: 700 }}>{sqlQueries.groupBy.title}</h3>
                    <p style={{ color: "var(--color-text-muted)", fontSize: "0.85rem", margin: "4px 0 0 0" }}>{sqlQueries.groupBy.desc}</p>
                  </div>
                  <Button variant="secondary" onClick={fetchSandboxReports} loading={loadingSandbox}>
                    Re-run Query
                  </Button>
                </div>
                <pre
                  style={{
                    backgroundColor: "var(--color-primary-light)",
                    padding: "16px",
                    borderRadius: "var(--radius-sm)",
                    fontFamily: "var(--font-mono)",
                    fontSize: "0.82rem",
                    overflowX: "auto",
                    color: "var(--color-primary)",
                    border: "1px solid rgba(5, 150, 105, 0.1)",
                    marginBottom: "20px"
                  }}
                >
                  {sqlQueries.groupBy.sql}
                </pre>
                <h4 style={{ fontSize: "0.9rem", fontWeight: 700, marginBottom: "12px" }}>Execution Results:</h4>
                <Table
                  headers={["Department", "Employees", "Total Budget", "Average Salary", "Max Salary", "Min Salary"]}
                  data={sandboxData?.departmentAggregates || []}
                  loading={loadingSandbox}
                  emptyMessage="No departmental metrics computed."
                  renderRow={(row, idx) => (
                    <tr key={idx}>
                      <td style={{ fontWeight: 700 }}>{row.department_name}</td>
                      <td>{row.employee_count} members</td>
                      <td style={{ fontFamily: "var(--font-mono)" }}>${row.total_salary?.toLocaleString() || "0"}</td>
                      <td style={{ fontFamily: "var(--font-mono)", fontWeight: 600 }}>${row.average_salary?.toLocaleString() || "0"}</td>
                      <td style={{ fontFamily: "var(--font-mono)" }}>${row.max_salary?.toLocaleString() || "0"}</td>
                      <td style={{ fontFamily: "var(--font-mono)" }}>${row.min_salary?.toLocaleString() || "0"}</td>
                    </tr>
                  )}
                />
              </Card>
            </>
          )}
        </div>
      )}
    </div>
  );
}

export default Reports;
