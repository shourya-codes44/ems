import React from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { logout } from "../redux/authSlice";
import api from "../services/api";
import NotificationBell from "./NotificationBell";
import GlobalSearch from "./GlobalSearch";

function Navbar({ showToast }) {
  const { user, refreshToken, accessToken } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await api.post("/auth/logout", { refreshToken });
    } catch (err) {
      // Ignore network errors on logout
    }
    dispatch(logout());
    showToast("Logged out successfully", "success");
    navigate("/");
  };

  // Do not render sidebar if user is not logged in
  if (!accessToken) return null;

  return (
    <aside className="sidebar-nav">
      {/* Brand */}
      <div className="sidebar-brand">
        <span className="brand-icon">💼</span>
        <h2>EMS Portal</h2>
      </div>

      {/* Global Search */}
      <div className="sidebar-search">
        <GlobalSearch />
      </div>

      {/* User Info + Notification Bell */}
      {user && (
        <div className="sidebar-user-info">
          <div className="user-avatar">{user.name.charAt(0).toUpperCase()}</div>
          <div className="user-meta">
            <span className="user-name">{user.name}</span>
            <span className="user-role-badge">{user.role}</span>
          </div>
          <NotificationBell />
        </div>
      )}

      {/* Navigation Menu */}
      <nav className="sidebar-menu">
        <NavLink
          to="/dashboard"
          className={({ isActive }) => `menu-item ${isActive ? "active" : ""}`}
        >
          <span className="menu-icon">📊</span> Dashboard
        </NavLink>

        <NavLink
          to="/employees"
          className={({ isActive }) => `menu-item ${isActive ? "active" : ""}`}
        >
          <span className="menu-icon">👥</span> Employees List
        </NavLink>

        {user && (user.role === "admin" || user.role === "manager") && (
          <NavLink
            to="/employees/create"
            className={({ isActive }) => `menu-item ${isActive ? "active" : ""}`}
          >
            <span className="menu-icon">➕</span> Add Employee
          </NavLink>
        )}

        <NavLink
          to="/departments"
          className={({ isActive }) => `menu-item ${isActive ? "active" : ""}`}
        >
          <span className="menu-icon">🏢</span> Departments
        </NavLink>

        <NavLink
          to="/skills"
          className={({ isActive }) => `menu-item ${isActive ? "active" : ""}`}
        >
          <span className="menu-icon">🛠️</span> Skills Master
        </NavLink>

        <NavLink
          to="/leaves"
          className={({ isActive }) => `menu-item ${isActive ? "active" : ""}`}
        >
          <span className="menu-icon">🌴</span> My Leaves
        </NavLink>

        {user && (user.role === "admin" || user.role === "manager" || user.role === "hr") && (
          <NavLink
            to="/approvals"
            className={({ isActive }) => `menu-item ${isActive ? "active" : ""}`}
          >
            <span className="menu-icon">✅</span> Leave Approvals
          </NavLink>
        )}

        {/* Asset Management — Admin/HR only */}
        {user && (user.role === "admin" || user.role === "hr") && (
          <NavLink
            to="/assets"
            className={({ isActive }) => `menu-item ${isActive ? "active" : ""}`}
          >
            <span className="menu-icon">💼</span> Asset Management
          </NavLink>
        )}

        {user && (user.role === "admin" || user.role === "hr") && (
          <NavLink
            to="/reports"
            className={({ isActive }) => `menu-item ${isActive ? "active" : ""}`}
          >
            <span className="menu-icon">📈</span> HR Reports
          </NavLink>
        )}
      </nav>

      <div className="sidebar-footer">
        <button onClick={handleLogout} className="btn-logout">
          <span className="menu-icon">🚪</span> Sign Out
        </button>
      </div>
    </aside>
  );
}

export default Navbar;
