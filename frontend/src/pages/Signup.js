import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import api from "../services/api";

function Signup({ showToast }) {
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: ""
  });
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();
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

    if (!form.name.trim() || !form.email.trim() || !form.password.trim()) {
      showToast("Please fill in all fields", "error");
      return;
    }

    if (form.password.length < 6) {
      showToast("Password must be at least 6 characters", "error");
      return;
    }

    try {
      setLoading(true);
      const res = await api.post("/auth/signup", form);
      
      // Let user know that verification link was printed to logs
      showToast(res.data.message || "Registration successful! Verification link sent.", "success");
      
      // Redirect to login tab after success
      setTimeout(() => {
        navigate("/");
      }, 2000);
    } catch (error) {
      const message = error.response?.data?.message || error.message || "Signup failed";
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
              <button className="tab-btn" onClick={() => navigate("/")}>
                Sign In
              </button>
              <button className="tab-btn active">Create Account</button>
            </div>

            <div className="auth-card-body">
              <form onSubmit={handleSubmit} className="auth-form">
                <h2>Create Account</h2>
                <p className="form-subtitle">Register to manage your corporate assets & attendance</p>

                <div className="input-group">
                  <label htmlFor="signup-name">Full Name</label>
                  <input
                    id="signup-name"
                    name="name"
                    type="text"
                    placeholder="John Doe"
                    value={form.name}
                    onChange={handleChange}
                  />
                </div>

                <div className="input-group">
                  <label htmlFor="signup-email">Email Address</label>
                  <input
                    id="signup-email"
                    name="email"
                    type="email"
                    placeholder="john@example.com"
                    value={form.email}
                    onChange={handleChange}
                  />
                </div>

                <div className="input-group">
                  <label htmlFor="signup-password">Password</label>
                  <input
                    id="signup-password"
                    name="password"
                    type="password"
                    placeholder="••••••••"
                    value={form.password}
                    onChange={handleChange}
                  />
                </div>

                <button type="submit" disabled={loading} className="btn-primary">
                  {loading ? "Registering..." : "Register"}
                </button>

                <p className="form-toggle-link">
                  Already have an account?{" "}
                  <span onClick={() => navigate("/")} className="link-span">
                    Login here
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

export default Signup;
