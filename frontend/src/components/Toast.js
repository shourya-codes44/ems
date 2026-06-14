import React, { useEffect } from "react";

function Toast({ message, type, onClose }) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 4000);
    return () => clearTimeout(timer);
  }, [onClose]);

  if (!message) return null;

  return (
    <div className={`toast-container ${type || "success"}`}>
      <span className="toast-icon">
        {type === "success" ? "✓" : "⚡"}
      </span>
      <span className="toast-message">{message}</span>
      <button className="toast-close-btn" onClick={onClose}>
        &times;
      </button>
    </div>
  );
}

export default Toast;
