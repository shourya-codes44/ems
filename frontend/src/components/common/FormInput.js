import React from "react";

/**
 * Reusable text input component with label and error display.
 * Props: id, label, type, value, onChange, placeholder, error, required, disabled
 */
const FormInput = ({
  id,
  label,
  type = "text",
  value,
  onChange,
  placeholder = "",
  error = "",
  required = false,
  disabled = false,
  className = "",
  ...rest
}) => {
  return (
    <div className={`form-group ${className}`}>
      {label && (
        <label htmlFor={id} className="form-label">
          {label}
          {required && <span className="required-star"> *</span>}
        </label>
      )}
      <input
        id={id}
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        disabled={disabled}
        className={`form-control ${error ? "form-control-error" : ""}`}
        {...rest}
      />
      {error && <span className="form-error-msg">{error}</span>}
    </div>
  );
};

export default FormInput;
