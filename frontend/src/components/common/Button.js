import React from "react";

export function Button({
  children,
  type = "button",
  variant = "primary", // primary, secondary, danger, success
  onClick,
  disabled = false,
  loading = false,
  className = "",
  ...props
}) {
  // Determine CSS class based on the variant
  let variantClass = "btn-primary";
  if (variant === "secondary") variantClass = "btn-secondary";
  if (variant === "danger") variantClass = "btn-danger";
  if (variant === "success") variantClass = "btn-success";

  return (
    <button
      type={type}
      className={`${variantClass} ${className}`}
      onClick={onClick}
      disabled={disabled || loading}
      style={{
        position: "relative",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        gap: "8px",
        cursor: (disabled || loading) ? "not-allowed" : "pointer"
      }}
      {...props}
    >
      {loading && (
        <span className="spinner" style={{ width: "16px", height: "16px", borderWidth: "2px", margin: 0 }}></span>
      )}
      <span>{children}</span>
    </button>
  );
}

export default Button;
