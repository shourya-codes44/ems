import React, { useState, useRef, useEffect } from "react";
import useNotifications from "../hooks/useNotifications";

const NotificationBell = () => {
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef(null);
  const { unreadCount, notifications, loading, fetchNotifications, markRead, markAllRead } =
    useNotifications();

  // Load notifications when panel opens
  const handleToggle = () => {
    if (!open) fetchNotifications();
    setOpen((prev) => !prev);
  };

  // Close on outside click
  useEffect(() => {
    const handleClick = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const formatTime = (ts) => {
    const d = new Date(ts);
    const now = new Date();
    const diffMin = Math.floor((now - d) / 60000);
    if (diffMin < 1) return "Just now";
    if (diffMin < 60) return `${diffMin}m ago`;
    const diffH = Math.floor(diffMin / 60);
    if (diffH < 24) return `${diffH}h ago`;
    return d.toLocaleDateString();
  };

  const eventIcon = (type) => {
    const icons = {
      ASSET_ALLOCATED: "💻",
      ASSET_RETURNED: "📦",
      LEAVE_APPROVED: "✅",
      LEAVE_REJECTED: "❌",
      GENERAL: "🔔",
    };
    return icons[type] || "🔔";
  };

  return (
    <div className="notif-bell-wrapper" ref={dropdownRef}>
      {/* Bell Button */}
      <button
        id="notification-bell-btn"
        className="notif-bell-btn"
        onClick={handleToggle}
        aria-label="Notifications"
      >
        <span className="notif-bell-icon">🔔</span>
        {unreadCount > 0 && (
          <span className="notif-badge">{unreadCount > 9 ? "9+" : unreadCount}</span>
        )}
      </button>

      {/* Dropdown Panel */}
      {open && (
        <div className="notif-dropdown" id="notification-dropdown">
          {/* Header */}
          <div className="notif-header">
            <h4 className="notif-title">Notifications</h4>
            {unreadCount > 0 && (
              <button className="notif-mark-all-btn" onClick={markAllRead}>
                Mark all read
              </button>
            )}
          </div>

          {/* Body */}
          <div className="notif-body">
            {loading ? (
              <div className="notif-empty">Loading…</div>
            ) : notifications.length === 0 ? (
              <div className="notif-empty">
                <span style={{ fontSize: "2rem" }}>🔕</span>
                <p>No notifications yet</p>
              </div>
            ) : (
              notifications.map((notif) => (
                <div
                  key={notif.id}
                  className={`notif-item ${!notif.isRead ? "notif-item-unread" : ""}`}
                  onClick={() => !notif.isRead && markRead(notif.id)}
                >
                  <span className="notif-item-icon">{eventIcon(notif.eventType)}</span>
                  <div className="notif-item-content">
                    <p className="notif-item-title">{notif.title}</p>
                    <p className="notif-item-msg">{notif.message}</p>
                    <span className="notif-item-time">{formatTime(notif.createdAt)}</span>
                  </div>
                  {!notif.isRead && <span className="notif-unread-dot" />}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
