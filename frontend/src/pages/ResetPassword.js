import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import api from "../services/api";

function ResetPassword({ showToast }) {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const token = searchParams.get("token");

  useEffect(() => {
    if (!token) {
      showToast("Reset token is missing from URL.", "error");
      navigate("/");
    }
  }, [token, navigate, showToast]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!newPassword.trim()) {
      showToast("Please enter a new password", "error");
      return;
    }

    if (newPassword.length < 6) {
      showToast("Password must be at least 6 characters long", "error");
      return;
    }

    if (newPassword !== confirmPassword) {
      showToast("Passwords do not match", "error");
      return;
    }

    try {
      setLoading(true);
      const res = await api.post("/auth/reset-password", {
        token,
        newPassword
      });
      showToast(res.data.message || "Password reset successful!", "success");
      setTimeout(() => {
        navigate("/");
      }, 1500);
    } catch (error) {
      const message = error.response?.data?.message || "Failed to reset password";
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
            <h2>Reset Password</h2>
            <p className="form-subtitle">Choose a new password for your account</p>

            <div className="input-group">
              <label htmlFor="new-pass">New Password</label>
              <input
                id="new-pass"
                name="newPassword"
                type="password"
                placeholder="••••••••"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
            </div>

            <div className="input-group">
              <label htmlFor="confirm-pass">Confirm Password</label>
              <input
                id="confirm-pass"
                name="confirmPassword"
                type="password"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </div>

            <button type="submit" disabled={loading} className="btn-primary">
              {loading ? "Resetting..." : "Update Password"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default ResetPassword;
