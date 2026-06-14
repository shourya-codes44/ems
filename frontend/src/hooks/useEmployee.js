import { useState, useCallback } from "react";
import api from "../services/api";

export function useEmployee(showToast) {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchEmployees = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get("/employees");
      setEmployees(res.data);
    } catch (error) {
      if (showToast) {
        showToast("Failed to fetch employee list", "error");
      }
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  const deleteEmployee = useCallback(async (id, name) => {
    try {
      setLoading(true);
      await api.delete(`/employees/${id}`);
      if (showToast) {
        showToast(`Employee profile for ${name} deleted`, "success");
      }
      fetchEmployees();
      return true;
    } catch (error) {
      if (showToast) {
        showToast("Failed to delete employee profile", "error");
      }
      return false;
    } finally {
      setLoading(false);
    }
  }, [fetchEmployees, showToast]);

  return {
    employees,
    loading,
    fetchEmployees,
    deleteEmployee
  };
}

export default useEmployee;
