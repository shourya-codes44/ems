import React from "react";

export function Table({
  headers = [],
  data = [],
  renderRow,
  loading = false,
  emptyMessage = "No records found",
  className = ""
}) {
  return (
    <div className={`admin-table-wrapper ${className}`} style={{ overflowX: "auto" }}>
      <table className="admin-table" style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
        <thead>
          <tr>
            {headers.map((h, idx) => (
              <th key={idx} style={{ borderBottom: "1px solid var(--color-border)" }}>
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <tr>
              <td colSpan={headers.length} style={{ textAlign: "center", padding: "40px" }}>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "12px" }}>
                  <div className="spinner"></div>
                  <span style={{ color: "var(--color-text-muted)", fontSize: "0.9rem" }}>Loading records...</span>
                </div>
              </td>
            </tr>
          ) : data.length === 0 ? (
            <tr>
              <td colSpan={headers.length} style={{ textAlign: "center", padding: "40px", color: "var(--color-text-muted)" }}>
                {emptyMessage}
              </td>
            </tr>
          ) : (
            data.map((row, idx) => renderRow(row, idx))
          )}
        </tbody>
      </table>
    </div>
  );
}

export default Table;
