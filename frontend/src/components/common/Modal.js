import React, { useEffect } from "react";

export function Modal({
  isOpen,
  onClose,
  title,
  children,
  footer,
  maxWidth = "500px"
}) {
  // Disable body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(15, 23, 42, 0.4)",
        backdropFilter: "blur(4px)",
        WebkitBackdropFilter: "blur(4px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1100,
        padding: "16px",
        animation: "fadeIn 0.2s ease-out"
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: "#ffffff",
          borderRadius: "var(--radius-md)",
          boxShadow: "var(--shadow-lg)",
          width: "100%",
          maxWidth: maxWidth,
          display: "flex",
          flexDirection: "column",
          maxHeight: "90vh",
          border: "1px solid var(--color-border)",
          transform: "translateY(0)",
          transition: "transform var(--transition-normal)",
          overflow: "hidden"
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "16px 24px",
            borderBottom: "1px solid var(--color-border)",
            backgroundColor: "rgba(248, 250, 252, 0.5)"
          }}
        >
          <h3 style={{ margin: 0, fontSize: "1.15rem", fontWeight: 700, color: "var(--color-text-main)" }}>
            {title}
          </h3>
          <button
            onClick={onClose}
            style={{
              background: "transparent",
              border: "none",
              fontSize: "1.5rem",
              cursor: "pointer",
              color: "var(--color-text-muted)",
              lineHeight: 1,
              padding: "4px",
              borderRadius: "50%",
              transition: "all var(--transition-fast)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: "32px",
              height: "32px"
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = "var(--bg-input)";
              e.currentTarget.style.color = "var(--color-text-main)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "transparent";
              e.currentTarget.style.color = "var(--color-text-muted)";
            }}
          >
            &times;
          </button>
        </div>

        {/* Content */}
        <div style={{ padding: "24px", overflowY: "auto", fontSize: "0.95rem", color: "var(--color-text-main)" }}>
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <div
            style={{
              padding: "16px 24px",
              borderTop: "1px solid var(--color-border)",
              backgroundColor: "rgba(248, 250, 252, 0.5)",
              display: "flex",
              justifyContent: "flex-end",
              gap: "12px"
            }}
          >
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}

export default Modal;
