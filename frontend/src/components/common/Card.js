import React from "react";

export function Card({
  title,
  value,
  icon,
  trend,
  trendType = "neutral", // positive, negative, neutral
  children,
  className = "",
  onClick,
  style = {}
}) {
  const isMetricCard = value !== undefined || icon !== undefined;

  return (
    <div
      className={`card ${className}`}
      onClick={onClick}
      style={{
        transition: "transform var(--transition-fast), box-shadow var(--transition-fast)",
        cursor: onClick ? "pointer" : "default",
        ...style
      }}
      onMouseEnter={(e) => {
        if (onClick) {
          e.currentTarget.style.transform = "translateY(-2px)";
          e.currentTarget.style.boxShadow = "var(--shadow-md)";
        }
      }}
      onMouseLeave={(e) => {
        if (onClick) {
          e.currentTarget.style.transform = "translateY(0)";
          e.currentTarget.style.boxShadow = "var(--shadow-sm)";
        }
      }}
    >
      {isMetricCard ? (
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            <span style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.025em" }}>
              {title}
            </span>
            <span style={{ fontSize: "1.75rem", fontWeight: 800, color: "var(--color-text-main)", lineHeight: 1.1 }}>
              {value}
            </span>
            {trend && (
              <span
                style={{
                  fontSize: "0.8rem",
                  fontWeight: 600,
                  color: trendType === "positive" ? "var(--color-success)" : trendType === "negative" ? "var(--color-error)" : "var(--color-text-muted)"
                }}
              >
                {trend}
              </span>
            )}
          </div>
          {icon && (
            <div
              style={{
                fontSize: "1.5rem",
                width: "48px",
                height: "48px",
                borderRadius: "var(--radius-sm)",
                backgroundColor: "var(--color-primary-light)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "var(--color-primary)"
              }}
            >
              {icon}
            </div>
          )}
        </div>
      ) : (
        <>
          {title && <h3 style={{ margin: 0, paddingBottom: "12px", borderBottom: "1px solid var(--color-border)", marginBottom: "20px", fontSize: "1.1rem", fontWeight: 700 }}>{title}</h3>}
          {children}
        </>
      )}
    </div>
  );
}

export default Card;
