import { useState, useCallback } from "react";
import api from "../services/api";

export function useLeave(showToast) {
  const [balances, setBalances] = useState([]);
  const [leaves, setLeaves] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchBalances = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get("/leaves/balances");
      setBalances(res.data);
    } catch (error) {
      if (showToast) {
        showToast(error.response?.data?.message || "Failed to fetch leave balances", "error");
      }
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  const fetchLeaves = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get("/leaves");
      setLeaves(res.data);
    } catch (error) {
      if (showToast) {
        showToast(error.response?.data?.message || "Failed to fetch leave applications", "error");
      }
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  const fetchAuditLogs = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get("/leaves/audit-logs");
      setAuditLogs(res.data);
    } catch (error) {
      if (showToast) {
        showToast(error.response?.data?.message || "Failed to fetch audit logs", "error");
      }
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  const applyLeave = useCallback(async (formData) => {
    try {
      setLoading(true);
      const res = await api.post("/leaves", {
        leaveTypeId: parseInt(formData.leaveTypeId),
        fromDate: formData.fromDate,
        toDate: formData.toDate,
        reason: formData.reason
      });
      if (showToast) {
        showToast(res.data.message || "Leave applied successfully", "success");
      }
      fetchBalances();
      fetchLeaves();
      return true;
    } catch (error) {
      if (showToast) {
        showToast(error.response?.data?.message || "Failed to apply for leave", "error");
      }
      return false;
    } finally {
      setLoading(false);
    }
  }, [fetchBalances, fetchLeaves, showToast]);

  const reviewLeave = useCallback(async (id, action, remarks) => {
    try {
      setLoading(true);
      const res = await api.post(`/leaves/${id}/approve`, { action, remarks });
      if (showToast) {
        showToast(res.data.message || `Leave successfully ${action.toLowerCase()}ed`, "success");
      }
      fetchLeaves();
      return true;
    } catch (error) {
      if (showToast) {
        showToast(error.response?.data?.message || `Failed to ${action.toLowerCase()} leave`, "error");
      }
      return false;
    } finally {
      setLoading(false);
    }
  }, [fetchLeaves, showToast]);

  return {
    balances,
    leaves,
    auditLogs,
    loading,
    fetchBalances,
    fetchLeaves,
    fetchAuditLogs,
    applyLeave,
    reviewLeave
  };
}

export default useLeave;
