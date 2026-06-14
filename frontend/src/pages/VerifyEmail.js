import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../services/api";

function VerifyEmail({ showToast }) {
  const { token } = useParams();
  const [status, setStatus] = useState("verifying"); // "verifying" | "success" | "error"
  const [message, setMessage] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const verifyAccount = async () => {
      try {
        const res = await api.get(`/auth/verify-email/${token}`);
        setStatus("success");
        setMessage(res.data.message || "Email verified successfully!");
        showToast(res.data.message || "Email verified successfully!", "success");
      } catch (error) {
        setStatus("error");
        setMessage(error.response?.data?.message || "Invalid or expired verification link.");
        showToast(error.response?.data?.message || "Verification failed.", "error");
      }
    };

    if (token) {
      verifyAccount();
    }
  }, [token, showToast]);

  return (
    <div className="auth-wrapper animate-fade-in">
      <div className="brand-logo-container">
        <span className="brand-icon">⚡</span>
        <h1>EMS Portal</h1>
      </div>

      <div className="auth-card">
        <div className="auth-card-body text-center" style={{ textAlign: "center" }}>
          {status === "verifying" && (
            <div className="verification-state">
              <div className="spinner" style={{ margin: "20px auto" }}></div>
              <h2>Verifying Email...</h2>
              <p className="form-subtitle">Activating your account on the server...</p>
            </div>
          )}

          {status === "success" && (
            <div className="verification-state">
              <span style={{ fontSize: "3rem", display: "block", marginBottom: "15px" }}>✅</span>
              <h2 style={{ color: "var(--color-success)" }}>Verification Success!</h2>
              <p className="form-subtitle" style={{ margin: "10px 0 24px 0" }}>{message}</p>
              <button onClick={() => navigate("/")} className="btn-primary">
                Proceed to Sign In
              </button>
            </div>
          )}

          {status === "error" && (
            <div className="verification-state">
              <span style={{ fontSize: "3rem", display: "block", marginBottom: "15px" }}>❌</span>
              <h2 style={{ color: "var(--color-error)" }}>Verification Failed</h2>
              <p className="form-subtitle" style={{ margin: "10px 0 24px 0" }}>{message}</p>
              <button onClick={() => navigate("/")} className="btn-primary">
                Back to Login
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default VerifyEmail;
