import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { loginSuccess } from "../redux/authSlice";
import api from "../services/api";

function Login({ showToast }) {
  const [form, setForm] = useState({
    email: "",
    password: ""
  });
  const [loading, setLoading] = useState(false);
  
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { accessToken } = useSelector((state) => state.auth);

  // Redirect if already logged in
  useEffect(() => {
    if (accessToken) {
      navigate("/dashboard");
    }
  }, [accessToken, navigate]);

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.email.trim() || !form.password.trim()) {
      showToast("Please enter both email and password", "error");
      return;
    }

    try {
      setLoading(true);
      const res = await api.post("/auth/login", form);
      
      // Dispatch both tokens to Redux (handles localstorage save)
      dispatch(
        loginSuccess({
          accessToken: res.data.accessToken,
          refreshToken: res.data.refreshToken
        })
      );
      
      showToast("Login Successful!", "success");
      navigate("/dashboard");
    } catch (error) {
      const message = error.response?.data?.message || error.message || "Login failed";
      showToast(message, "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page-container">
      <div className="auth-form-section">
        <div className="auth-wrapper animate-fade-in">
          <div className="brand-logo-container">
            <span className="brand-icon">💼</span>
            <h1>EMS Portal</h1>
          </div>

          <div className="auth-card">
            <div className="auth-tabs">
              <button className="tab-btn active">Sign In</button>
              <button className="tab-btn" onClick={() => navigate("/signup")}>
                Create Account
              </button>
            </div>

            <div className="auth-card-body">
              <form onSubmit={handleSubmit} className="auth-form">
                <h2>Welcome Back</h2>
                <p className="form-subtitle">Enter credentials to access your dashboard</p>

                <div className="input-group">
                  <label htmlFor="login-email">Email Address</label>
                  <input
                    id="login-email"
                    name="email"
                    type="email"
                    placeholder="john@example.com"
                    value={form.email}
                    onChange={handleChange}
                  />
                </div>

                <div className="input-group">
                  <div style={{ display: "flex", justifyContent: "between", alignItems: "center" }}>
                    <label htmlFor="login-password" style={{ flexGrow: 1 }}>Password</label>
                    <span 
                      onClick={() => navigate("/forgot-password")} 
                      className="link-span"
                      style={{ fontSize: "0.8rem", cursor: "pointer" }}
                    >
                      Forgot Password?
                    </span>
                  </div>
                  <input
                    id="login-password"
                    name="password"
                    type="password"
                    placeholder="••••••••"
                    value={form.password}
                    onChange={handleChange}
                    style={{ marginTop: "4px" }}
                  />
                </div>

                <button type="submit" disabled={loading} className="btn-primary">
                  {loading ? "Logging in..." : "Login"}
                </button>

                <p className="form-toggle-link">
                  Don't have an account?{" "}
                  <span onClick={() => navigate("/signup")} className="link-span">
                    Register here
                  </span>
                </p>
              </form>
            </div>
          </div>
        </div>
      </div>

      <div className="auth-showcase-section">
        <div className="showcase-content">
          <div className="showcase-logo">💼</div>
          <h1 className="showcase-title">Enterprise Management System</h1>
          <p className="showcase-subtitle">
            A premium, unified hub to seamlessly track company assets, manage leave requests, and optimize workforce insights.
          </p>
          <div className="showcase-features">
            <div className="feature-item">
              <span className="feature-icon">📊</span>
              <div className="feature-text">
                <h4>Live Operational Analytics</h4>
                <p>Real-time telemetry on resource allocations, hiring trends, and attendance flow.</p>
              </div>
            </div>
            <div className="feature-item">
              <span className="feature-icon">💼</span>
              <div className="feature-text">
                <h4>Smart Asset Lifecycle</h4>
                <p>Track hardware deployments, request returns, and maintain clean audit trails.</p>
              </div>
            </div>
            <div className="feature-item">
              <span className="feature-icon">🌴</span>
              <div className="feature-text">
                <h4>Leave Pipeline & Approvals</h4>
                <p>Frictionless application flow for employees and multi-stage evaluation tools for HR.</p>
              </div>
            </div>
          </div>
          <div className="showcase-footer">
            © 2026 EMS Portal. All rights reserved. Secure RSA-256 data protection.
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;
