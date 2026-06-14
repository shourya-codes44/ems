import React, { useState, useEffect } from "react";
import api from "../services/api";

function DepartmentMaster({ showToast }) {
  const [departments, setDepartments] = useState([]);
  const [newDeptName, setNewDeptName] = useState("");
  const [loading, setLoading] = useState(false);
  const [listLoading, setListLoading] = useState(true);

  const fetchDepartments = async () => {
    try {
      setListLoading(true);
      const res = await api.get("/departments");
      setDepartments(res.data);
    } catch (error) {
      showToast("Failed to fetch departments", "error");
    } finally {
      setListLoading(false);
    }
  };

  useEffect(() => {
    fetchDepartments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!newDeptName.trim()) {
      showToast("Please enter a department name", "error");
      return;
    }

    try {
      setLoading(true);
      const res = await api.post("/departments", {
        departmentName: newDeptName
      });
      showToast(`Department "${res.data.departmentName}" created successfully!`, "success");
      setNewDeptName("");
      fetchDepartments();
    } catch (error) {
      const message = error.response?.data?.message || "Failed to create department";
      showToast(message, "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="master-panel-container animate-fade-in">
      <div className="welcome-banner">
        <h2>🏢 Department Master Directory</h2>
        <p>Register and view corporate departments linked to employee profiles.</p>
      </div>

      <div className="master-grid">
        {/* Form Column */}
        <div className="card">
          <h3>Create Department</h3>
          <form onSubmit={handleSubmit} style={{ marginTop: "15px" }}>
            <div className="input-group">
              <label htmlFor="dept-name">Department Name</label>
              <input
                id="dept-name"
                type="text"
                placeholder="e.g. Quality Assurance"
                value={newDeptName}
                onChange={(e) => setNewDeptName(e.target.value)}
              />
            </div>
            <button type="submit" disabled={loading} className="btn-primary">
              {loading ? "Creating..." : "Add Department"}
            </button>
          </form>
        </div>

        {/* List Column */}
        <div className="card">
          <h3>Active Departments</h3>
          
          {listLoading ? (
            <div style={{ padding: "20px 0", textAlign: "center" }}>
              <div className="spinner" style={{ margin: "10px auto" }}></div>
              <p>Loading departments...</p>
            </div>
          ) : (
            <div className="admin-table-wrapper">
              <table className="admin-table" style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr>
                    <th style={{ width: "80px" }}>ID</th>
                    <th>Department Name</th>
                  </tr>
                </thead>
                <tbody>
                  {departments.length === 0 ? (
                    <tr>
                      <td colSpan="2" style={{ textAlign: "center", color: "var(--color-text-muted)" }}>
                        No departments registered.
                      </td>
                    </tr>
                  ) : (
                    departments.map((dept) => (
                      <tr key={dept.id} style={{ borderBottom: "1px solid var(--color-border)" }}>
                        <td style={{ fontFamily: "var(--font-mono)", fontSize: "0.85rem" }}>{dept.id}</td>
                        <td style={{ fontWeight: "600" }}>{dept.departmentName}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default DepartmentMaster;
