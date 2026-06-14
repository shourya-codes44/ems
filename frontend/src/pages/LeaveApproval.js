import React, { useState, useEffect, useCallback } from "react";
import { useSelector } from "react-redux";
import useLeave from "../hooks/useLeave";
import Table from "../components/common/Table";
import Button from "../components/common/Button";
import Modal from "../components/common/Modal";
import Card from "../components/common/Card";

export function LeaveApproval({ showToast }) {
  const { user } = useSelector((state) => state.auth);
  const {
    leaves,
    auditLogs,
    loading,
    fetchLeaves,
    fetchAuditLogs,
    reviewLeave
  } = useLeave(showToast);

  const [activeTab, setActiveTab] = useState("pending"); // pending, history, audit
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [actionType, setActionType] = useState(""); // APPROVED or REJECTED
  const [remarks, setRemarks] = useState("");
  const [modalLoading, setModalLoading] = useState(false);

  const refreshData = useCallback(() => {
    fetchLeaves();
    if (user && user.role === "admin") {
      fetchAuditLogs();
    }
  }, [fetchLeaves, fetchAuditLogs, user]);

  useEffect(() => {
    refreshData();
  }, [refreshData]);

  // Filters
  const pendingRequests = leaves.filter((l) => {
    if (user?.role === "manager") {
      return l.status === "PENDING_MANAGER";
    }
    if (user?.role === "hr") {
      return l.status === "PENDING_HR";
    }
    if (user?.role === "admin") {
      return l.status === "PENDING_MANAGER" || l.status === "PENDING_HR";
    }
    return false;
  });

  const processedHistory = leaves.filter((l) => {
    if (user?.role === "manager") {
      // Show requests manager approved or rejected
      return l.status !== "PENDING_MANAGER";
    }
    if (user?.role === "hr") {
      return l.status === "APPROVED" || l.status === "REJECTED";
    }
    return l.status === "APPROVED" || l.status === "REJECTED";
  });

  const handleOpenActionModal = (request, type) => {
    setSelectedRequest(request);
    setActionType(type);
    setRemarks("");
  };

  const handleCloseModal = () => {
    setSelectedRequest(null);
    setActionType("");
    setRemarks("");
  };

  const handleConfirmAction = async () => {
    if (!selectedRequest) return;
    setModalLoading(true);
    const success = await reviewLeave(selectedRequest.id, actionType, remarks);
    setModalLoading(false);
    if (success) {
      handleCloseModal();
      refreshData();
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

  return (
    <div className="master-panel-container animate-fade-in">
      <div className="welcome-banner">
        <h2>Leave Workflows & Approvals</h2>
        <p>Manage pending applications, check history, and review enterprise logs.</p>
      </div>

      {/* Tabs Layout */}
      <div style={{ display: "flex", borderBottom: "1px solid var(--color-border)", marginBottom: "24px", gap: "8px" }}>
        <button
          onClick={() => setActiveTab("pending")}
          className={`tab-btn ${activeTab === "pending" ? "active" : ""}`}
          style={{ flex: "none", padding: "12px 24px" }}
        >
          Awaiting Review ({pendingRequests.length})
        </button>
        <button
          onClick={() => setActiveTab("history")}
          className={`tab-btn ${activeTab === "history" ? "active" : ""}`}
          style={{ flex: "none", padding: "12px 24px" }}
        >
          Processed History ({processedHistory.length})
        </button>
        {user?.role === "admin" && (
          <button
            onClick={() => setActiveTab("audit")}
            className={`tab-btn ${activeTab === "audit" ? "active" : ""}`}
            style={{ flex: "none", padding: "12px 24px" }}
          >
            System Audit Trails ({auditLogs.length})
          </button>
        )}
      </div>

      {/* Awaiting Review Content */}
      {activeTab === "pending" && (
        <Card title="Requests Requiring Action">
          <Table
            headers={["Employee", "Leave Type", "Duration", "Days", "Current Status", "Review Action"]}
            data={pendingRequests}
            loading={loading && leaves.length === 0}
            emptyMessage="No pending leave applications requiring your review."
            renderRow={(req) => (
              <tr key={req.id}>
                <td>
                  <div style={{ fontWeight: 700 }}>{req.employee?.user?.name}</div>
                  <div style={{ fontSize: "0.8rem", color: "var(--color-text-muted)" }}>{req.employee?.user?.email}</div>
                </td>
                <td>{req.leaveType?.leaveName}</td>
                <td style={{ fontSize: "0.85rem", color: "var(--color-text-muted)" }}>
                  {formatDate(req.fromDate)} - {formatDate(req.toDate)}
                </td>
                <td style={{ fontWeight: 600 }}>{req.totalDays} Days</td>
                <td>
                  <span style={getStatusBadgeStyle(req.status)}>
                    {req.status.replace("_", " ")}
                  </span>
                </td>
                <td>
                  <div style={{ display: "flex", gap: "8px" }}>
                    <Button
                      variant="success"
                      onClick={() => handleOpenActionModal(req, "APPROVED")}
                      style={{ padding: "6px 12px", fontSize: "0.82rem" }}
                    >
                      Approve
                    </Button>
                    <Button
                      variant="danger"
                      onClick={() => handleOpenActionModal(req, "REJECTED")}
                      style={{ padding: "6px 12px", fontSize: "0.82rem" }}
                    >
                      Reject
                    </Button>
                  </div>
                </td>
              </tr>
            )}
          />
        </Card>
      )}

      {/* Processed History Content */}
      {activeTab === "history" && (
        <Card title="Resolved Applications Log">
          <Table
            headers={["Employee", "Leave Type", "Duration", "Total Days", "Outcome Status"]}
            data={processedHistory}
            loading={loading && leaves.length === 0}
            emptyMessage="No historical reviews recorded."
            renderRow={(req) => (
              <tr key={req.id}>
                <td>
                  <div style={{ fontWeight: 700 }}>{req.employee?.user?.name}</div>
                  <div style={{ fontSize: "0.8rem", color: "var(--color-text-muted)" }}>{req.employee?.user?.email}</div>
                </td>
                <td>{req.leaveType?.leaveName}</td>
                <td style={{ fontSize: "0.85rem", color: "var(--color-text-muted)" }}>
                  {formatDate(req.fromDate)} - {formatDate(req.toDate)}
                </td>
                <td style={{ fontWeight: 600 }}>{req.totalDays} Days</td>
                <td>
                  <span style={getStatusBadgeStyle(req.status)}>
                    {req.status}
                  </span>
                </td>
              </tr>
            )}
          />
        </Card>
      )}

      {/* System Audit Trails Content */}
      {activeTab === "audit" && user?.role === "admin" && (
        <Card title="Corporate Audit Log Ledger">
          <div className="card-desc">
            This ledger captures database triggers, multi-level checks, and final ACID transactions.
          </div>
          <Table
            headers={["Timestamp", "Action Type", "Logged Description", "User"]}
            data={auditLogs}
            loading={loading && auditLogs.length === 0}
            emptyMessage="No system audit logs found."
            renderRow={(log) => (
              <tr key={log.id}>
                <td style={{ fontSize: "0.82rem", color: "var(--color-text-muted)" }}>
                  {new Date(log.createdAt).toLocaleString()}
                </td>
                <td>
                  <span
                    style={{
                      fontFamily: "var(--font-mono)",
                      fontSize: "0.78rem",
                      backgroundColor: "var(--color-primary-light)",
                      color: "var(--color-primary)",
                      padding: "2px 6px",
                      borderRadius: "4px",
                      fontWeight: 600
                    }}
                  >
                    {log.action}
                  </span>
                </td>
                <td style={{ fontSize: "0.88rem" }}>{log.details}</td>
                <td>
                  {log.user ? (
                    <div>
                      <div style={{ fontWeight: 600 }}>{log.user.name}</div>
                      <div style={{ fontSize: "0.75rem", color: "var(--color-text-muted)" }}>{log.user.role}</div>
                    </div>
                  ) : (
                    <span style={{ fontStyle: "italic", color: "var(--color-text-muted)" }}>System Action</span>
                  )}
                </td>
              </tr>
            )}
          />
        </Card>
      )}

      {/* Interactive Remarks Modal */}
      {selectedRequest && (
        <Modal
          isOpen={!!selectedRequest}
          onClose={handleCloseModal}
          title={`${actionType === "APPROVED" ? "Approve" : "Reject"} Leave Application`}
          footer={
            <>
              <Button variant="secondary" onClick={handleCloseModal}>
                Cancel
              </Button>
              <Button
                variant={actionType === "APPROVED" ? "success" : "danger"}
                onClick={handleConfirmAction}
                loading={modalLoading}
              >
                Confirm {actionType === "APPROVED" ? "Approval" : "Rejection"}
              </Button>
            </>
          }
        >
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            <p style={{ margin: 0 }}>
              You are about to <strong>{actionType.toLowerCase()}</strong> the leave request for{" "}
              <strong>{selectedRequest.employee?.user?.name}</strong>:
            </p>
            <div
              style={{
                backgroundColor: "var(--bg-input)",
                padding: "12px",
                borderRadius: "var(--radius-sm)",
                fontSize: "0.9rem"
              }}
            >
              <div><strong>Type:</strong> {selectedRequest.leaveType?.leaveName}</div>
              <div><strong>Dates:</strong> {formatDate(selectedRequest.fromDate)} - {formatDate(selectedRequest.toDate)} ({selectedRequest.totalDays} Days)</div>
              <div><strong>Reason:</strong> "{selectedRequest.reason}"</div>
            </div>

            <div className="input-group" style={{ margin: 0 }}>
              <label>Reviewer Remarks</label>
              <textarea
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                placeholder="Enter comments, conditions, or reasons for decision..."
                rows="3"
                style={{
                  padding: "10px",
                  borderRadius: "var(--radius-sm)",
                  border: "1px solid var(--color-border)",
                  backgroundColor: "var(--bg-input)",
                  fontFamily: "var(--font-sans)",
                  fontSize: "0.9rem",
                  resize: "vertical"
                }}
              />
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

export default LeaveApproval;
