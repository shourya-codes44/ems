import { useState, useEffect, useCallback, useRef } from "react";
import api from "../services/api";

/**
 * useNotifications hook
 * Polls unread count every 30s, fetches full list on demand.
 */
const useNotifications = () => {
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const intervalRef = useRef(null);

  const getToken = () => localStorage.getItem("accessToken");

  const fetchUnreadCount = useCallback(async () => {
    const token = getToken();
    if (!token) return;
    try {
      const { data } = await api.get("/notifications/unread-count");
      setUnreadCount(data.count || 0);
    } catch (_) {}
  }, []);

  const fetchNotifications = useCallback(async () => {
    const token = getToken();
    if (!token) return;
    setLoading(true);
    try {
      const { data } = await api.get("/notifications");
      setNotifications(data.data || []);
      // Sync badge count from list
      setUnreadCount((data.data || []).filter((n) => !n.isRead).length);
    } catch (_) {} finally {
      setLoading(false);
    }
  }, []);

  const markRead = useCallback(async (id) => {
    try {
      await api.patch(`/notifications/${id}/read`);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
      );
      setUnreadCount((c) => Math.max(0, c - 1));
    } catch (_) {}
  }, []);

  const markAllRead = useCallback(async () => {
    try {
      await api.patch("/notifications/read-all");
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (_) {}
  }, []);

  // Start polling on mount
  useEffect(() => {
    fetchUnreadCount();
    intervalRef.current = setInterval(fetchUnreadCount, 30000);
    return () => clearInterval(intervalRef.current);
  }, [fetchUnreadCount]);

  return {
    unreadCount,
    notifications,
    loading,
    fetchNotifications,
    markRead,
    markAllRead,
  };
};

export default useNotifications;
