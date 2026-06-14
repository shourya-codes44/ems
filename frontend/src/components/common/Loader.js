import React from "react";

export function Loader({
  message = "Loading...",
  fullPage = false,
  size = "medium" // small, medium, large
}) {
  const spinnerSize = size === "small" ? "20px" : size === "large" ? "60px" : "40px";
  const borderThickness = size === "small" ? "2px" : size === "large" ? "4px" : "3px";

  const loaderContent = (
    <div
      className="dashboard-loading"
      style={{
        minHeight: fullPage ? "100vh" : "200px",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: "16px",
        color: "var(--color-text-muted)"
      }}
    >
      <div
        className="spinner"
        style={{
          width: spinnerSize,
          height: spinnerSize,
          borderWidth: borderThickness,
          borderStyle: "solid",
          borderColor: "#cbd5e1",
          borderTopColor: "var(--color-primary)",
          borderRadius: "50%",
          animation: "spin 0.8s linear infinite"
        }}
      ></div>
      {message && <span style={{ fontSize: size === "small" ? "0.85rem" : "0.95rem", fontWeight: 500 }}>{message}</span>}
    </div>
  );

  if (fullPage) {
    return (
      <div
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: "var(--bg-app)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 2000
        }}
      >
        {loaderContent}
      </div>
    );
  }

  return loaderContent;
}

export default Loader;
