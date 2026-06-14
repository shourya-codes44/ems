import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";

function ForgotPassword({ showToast }) {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!email.trim()) {
      showToast("Please enter your email address", "error");
      return;
    }

    try {
      setLoading(true);
      const res = await api.post("/auth/forgot-password", { email });
      showToast(res.data.message || "Password reset link logged in your backend server logs.", "success");
    } catch (error) {
      const message = error.response?.data?.message || "Failed to submit request";
      showToast(message, "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-wrapper animate-fade-in">
      <div className="brand-logo-container">
        <span className="brand-icon">⚡</span>
        <h1>EMS Portal</h1>
      </div>

      <div className="auth-card">
        <div className="auth-card-body">
          <form onSubmit={handleSubmit} className="auth-form">
            <h2>Forgot Password</h2>
            <p className="form-subtitle">Enter your email and we'll log a recovery link to the backend console logs</p>

            <div className="input-group">
              <label htmlFor="reset-email">Email Address</label>
              <input
                id="reset-email"
                name="email"
                type="email"
                placeholder="john@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <button type="submit" disabled={loading} className="btn-primary">
              {loading ? "Sending link..." : "Send Reset Link"}
            </button>

            <p className="form-toggle-link">
              Back to{" "}
              <span onClick={() => navigate("/")} className="link-span">
                Login
              </span>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}

export default ForgotPassword;
