import React from "react";

/**
 * Reusable select dropdown component with label and error display.
 * Props: id, label, value, onChange, options (array of {value, label}), error, required, disabled, placeholder
 */
const FormSelect = ({
  id,
  label,
  value,
  onChange,
  options = [],
  placeholder = "-- Select --",
  error = "",
  required = false,
  disabled = false,
  className = "",
}) => {
  return (
    <div className={`form-group ${className}`}>
      {label && (
        <label htmlFor={id} className="form-label">
          {label}
          {required && <span className="required-star"> *</span>}
        </label>
      )}
      <select
        id={id}
        value={value}
        onChange={onChange}
        disabled={disabled}
        className={`form-control form-select ${error ? "form-control-error" : ""}`}
      >
        <option value="">{placeholder}</option>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      {error && <span className="form-error-msg">{error}</span>}
    </div>
  );
};

export default FormSelect;
