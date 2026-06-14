import React, { useState, useEffect } from "react";
import useLeave from "../hooks/useLeave";
import Card from "../components/common/Card";
import Table from "../components/common/Table";
import Button from "../components/common/Button";
import Modal from "../components/common/Modal";
import Loader from "../components/common/Loader";

export function LeaveApplication({ showToast }) {
  const {
    balances,
    leaves,
    loading,
    fetchBalances,
    fetchLeaves,
    applyLeave
  } = useLeave(showToast);

  const [formData, setFormData] = useState({
    leaveTypeId: "",
    fromDate: "",
    toDate: "",
    reason: ""
  });

  const [selectedLeave, setSelectedLeave] = useState(null);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);

  useEffect(() => {
    fetchBalances();
    fetchLeaves();
  }, [fetchBalances, fetchLeaves]);

  // Set default leave type once balances load
  useEffect(() => {
    if (balances.length > 0 && !formData.leaveTypeId) {
      setFormData((prev) => ({ ...prev, leaveTypeId: balances[0].leaveTypeId }));
    }
  }, [balances, formData.leaveTypeId]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.leaveTypeId || !formData.fromDate || !formData.toDate || !formData.reason.trim()) {
      showToast("Please fill in all details", "error");
      return;
    }

    const success = await applyLeave(formData);
    if (success) {
      setFormData({
        leaveTypeId: balances[0]?.leaveTypeId || "",
        fromDate: "",
        toDate: "",
        reason: ""
      });
    }
  };

  const getStatusBadgeStyle = (status) => {
    const base = {
      padding: "4px 10px",
      borderRadius: "12px",
      fontSize: "0.8rem",
      fontWeight: "700",
      textTransform: "uppercase",
      display: "inline-block"
    };

    switch (status) {
      case "APPROVED":
        return { ...base, backgroundColor: "var(--color-success-bg)", color: "var(--color-success)", border: "1px solid var(--color-success-border)" };
      case "REJECTED":
        return { ...base, backgroundColor: "var(--color-error-bg)", color: "var(--color-error)", border: "1px solid var(--color-error-border)" };
      case "PENDING_MANAGER":
        return { ...base, backgroundColor: "#fffbeb", color: "#d97706", border: "1px solid #fde68a" };
      case "PENDING_HR":
        return { ...base, backgroundColor: "#eff6ff", color: "#2563eb", border: "1px solid #bfdbfe" };
      default:
        return base;
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric"
    });
  };

  const openHistoryModal = (leave) => {
    setSelectedLeave(leave);
    setIsHistoryModalOpen(true);
  };

  return (
    <div className="master-panel-container animate-fade-in">
      <div className="welcome-banner">
        <h2>My Leave Management</h2>
        <p>Apply for leaves, monitor review pipelines, and view active balances.</p>
      </div>

      {/* Balance Section */}
      <h3 style={{ fontSize: "1.2rem", fontWeight: 700, marginBottom: "16px", color: "var(--color-text-main)" }}>
        Current Leave Balances
      </h3>
      {loading && balances.length === 0 ? (
        <Loader message="Loading balances..." />
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: "20px", marginBottom: "32px" }}>
          {balances.map((b) => (
            <Card
              key={b.id}
              title={b.leaveType.leaveName}
              value={`${b.availableDays} / ${b.leaveType.totalDays} Days`}
              icon="📅"
              trend="Available Days"
            />
          ))}
          {balances.length === 0 && (
            <div className="card" style={{ gridColumn: "1 / -1", textAlign: "center", color: "var(--color-text-muted)" }}>
              No leave balances initialized. Please ensure your employee profile is configured.
            </div>
          )}
        </div>
      )}

      <div className="master-grid">
        {/* Leave Apply Form */}
        <Card title="Apply for Leave">
          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <div className="input-group">
              <label>Leave Type</label>
              <select
                name="leaveTypeId"
                value={formData.leaveTypeId}
                onChange={handleInputChange}
                style={{
                  padding: "12px",
                  borderRadius: "var(--radius-sm)",
                  border: "1px solid var(--color-border)",
                  backgroundColor: "var(--bg-input)",
                  fontFamily: "var(--font-sans)",
                  fontSize: "0.95rem"
                }}
              >
                {balances.map((b) => (
                  <option key={b.leaveTypeId} value={b.leaveTypeId}>
                    {b.leaveType.leaveName} (Available: {b.availableDays} days)
                  </option>
                ))}
              </select>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
              <div className="input-group">
                <label>From Date</label>
                <input
                  type="date"
                  name="fromDate"
                  value={formData.fromDate}
                  onChange={handleInputChange}
                  style={{
                    padding: "12px",
                    borderRadius: "var(--radius-sm)",
                    border: "1px solid var(--color-border)",
                    backgroundColor: "var(--bg-input)",
                    fontFamily: "var(--font-sans)",
                    fontSize: "0.95rem"
                  }}
                />
              </div>

              <div className="input-group">
                <label>To Date</label>
                <input
                  type="date"
                  name="toDate"
                  value={formData.toDate}
                  onChange={handleInputChange}
                  style={{
                    padding: "12px",
                    borderRadius: "var(--radius-sm)",
                    border: "1px solid var(--color-border)",
                    backgroundColor: "var(--bg-input)",
                    fontFamily: "var(--font-sans)",
                    fontSize: "0.95rem"
                  }}
                />
              </div>
            </div>

            <div className="input-group">
              <label>Reason for Leave</label>
              <textarea
                name="reason"
                rows="4"
                value={formData.reason}
                onChange={handleInputChange}
                placeholder="State your reason for leave application..."
                style={{
                  padding: "12px",
                  borderRadius: "var(--radius-sm)",
                  border: "1px solid var(--color-border)",
                  backgroundColor: "var(--bg-input)",
                  fontFamily: "var(--font-sans)",
                  fontSize: "0.95rem",
                  resize: "vertical"
                }}
              />
            </div>

            <Button type="submit" loading={loading} style={{ width: "100%" }}>
              Submit Application
            </Button>
          </form>
        </Card>

        {/* Leave Requests History */}
        <Card title="Application History">
          <Table
            headers={["Leave Type", "Duration", "Days", "Status", "Actions"]}
            data={leaves}
            loading={loading && leaves.length === 0}
            emptyMessage="No leave requests submitted yet."
            renderRow={(leave) => (
              <tr key={leave.id}>
                <td>
                  <div style={{ fontWeight: 600 }}>{leave.leaveType.leaveName}</div>
                </td>
                <td style={{ fontSize: "0.85rem", color: "var(--color-text-muted)" }}>
                  {formatDate(leave.fromDate)} - {formatDate(leave.toDate)}
                </td>
                <td style={{ fontWeight: 600 }}>{leave.totalDays}</td>
                <td>
                  <span style={getStatusBadgeStyle(leave.status)}>
                    {leave.status.replace("_", " ")}
                  </span>
                </td>
                <td>
                  <Button
                    variant="secondary"
                    onClick={() => openHistoryModal(leave)}
                    style={{ padding: "6px 12px", fontSize: "0.8rem" }}
                  >
                    View Status
                  </Button>
                </td>
              </tr>
            )}
          />
        </Card>
      </div>

      {/* History Details Modal */}
      {selectedLeave && (
        <Modal
          isOpen={isHistoryModalOpen}
          onClose={() => setIsHistoryModalOpen(false)}
          title={`Leave Application #${selectedLeave.id} Details`}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <div>
              <span className="detail-label">Reason for Request</span>
              <p style={{ marginTop: "4px", padding: "12px", backgroundColor: "var(--bg-input)", borderRadius: "var(--radius-sm)", fontSize: "0.95rem" }}>
                {selectedLeave.reason}
              </p>
            </div>

            <div>
              <span className="detail-label">Current Pipeline Status</span>
              <div style={{ marginTop: "4px" }}>
                <span style={getStatusBadgeStyle(selectedLeave.status)}>
                  {selectedLeave.status.replace("_", " ")}
                </span>
              </div>
            </div>

            <div>
              <span className="detail-label" style={{ display: "block", marginBottom: "8px" }}>Workflow Audit Trail</span>
              {selectedLeave.approvalHistories && selectedLeave.approvalHistories.length > 0 ? (
                <div style={{ display: "flex", flexDirection: "column", gap: "12px", paddingLeft: "8px", borderLeft: "2px solid var(--color-border)" }}>
                  {selectedLeave.approvalHistories.map((log) => (
                    <div key={log.id} style={{ position: "relative" }}>
                      <div
                        style={{
                          position: "absolute",
                          left: "-14px",
                          top: "4px",
                          width: "10px",
                          height: "10px",
                          borderRadius: "50%",
                          backgroundColor: "var(--color-primary)",
                          border: "2px solid #ffffff"
                        }}
                      ></div>
                      <div style={{ fontSize: "0.9rem" }}>
                        <span style={{ fontWeight: 700 }}>{log.user.name}</span>{" "}
                        <span style={{ fontSize: "0.75rem", padding: "2px 6px", borderRadius: "4px", backgroundColor: "var(--color-primary-light)", color: "var(--color-primary)", fontWeight: 600 }}>
                          {log.user.role.toUpperCase()}
                        </span>{" "}
                        marked request as <span style={{ fontWeight: 600, color: log.action === "REJECTED" ? "var(--color-error)" : "var(--color-success)" }}>{log.action}</span>.
                      </div>
                      {log.remarks && (
                        <div style={{ fontStyle: "italic", color: "var(--color-text-muted)", fontSize: "0.85rem", marginTop: "2px" }}>
                          Remarks: "{log.remarks}"
                        </div>
                      )}
                      <div style={{ fontSize: "0.75rem", color: "var(--color-text-muted)", marginTop: "2px" }}>
                        {new Date(log.createdAt).toLocaleString()}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p style={{ color: "var(--color-text-muted)", fontStyle: "italic", margin: 0 }}>
                  This application is currently pending initial manager evaluation.
                </p>
              )}
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

export default LeaveApplication;
