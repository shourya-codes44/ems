import React, { useState, useEffect, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { logout, updateUser } from "../redux/authSlice";
import api from "../services/api";
import {
  BarChart, Bar, PieChart, Pie, Cell, AreaChart, Area,
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  Legend, ResponsiveContainer
} from "recharts";

// Chart Color Palettes
const BAR_COLORS = ["#059669", "#10b981", "#34d399", "#06b6d4", "#f59e0b", "#ef4444"];
const PIE_COLORS = {
  AVAILABLE: "#22c55e",
  ALLOCATED: "#3b82f6",
  RETURNED: "#94a3b8",
  DAMAGED: "#f59e0b",
  LOST: "#ef4444",
};

// Custom tooltip for recharts
const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="chart-tooltip">
        <p className="chart-tooltip-label">{label}</p>
        {payload.map((p, i) => (
          <p key={i} style={{ color: p.color, margin: "2px 0" }}>
            {p.name}: <strong>{p.value}</strong>
          </p>
        ))}
      </div>
    );
  }
  return null;
};

function Dashboard({ showToast }) {
  const { user, accessToken } = useSelector((state) => state.auth);
  const dispatch = useDispatch();

  const [stats, setStats] = useState({
    employees: 0, departments: 0, leavesTotal: 0,
    pendingApprovals: 0, approvedLeaves: 0, rejectedLeaves: 0
  });
  const [profileLoading, setProfileLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);

  // Chart data states
  const [deptBarData, setDeptBarData] = useState([]);
  const [assetPieData, setAssetPieData] = useState([]);
  const [leaveAreaData, setLeaveAreaData] = useState([]);
  const [hiringLineData, setHiringLineData] = useState([]);
  const [chartsLoading, setChartsLoading] = useState(true);

  // Admin users
  const [adminUsers, setAdminUsers] = useState([]);
  const [adminLoading, setAdminLoading] = useState(false);

  // Fetch Profile
  useEffect(() => {
    if (!accessToken) return;
    const fetchProfile = async () => {
      try {
        const res = await api.get("/user/profile");
        dispatch(updateUser(res.data));
      } catch {
        showToast("Session expired, please login again", "error");
        dispatch(logout());
      } finally {
        setProfileLoading(false);
      }
    };
    fetchProfile();
  }, [accessToken, dispatch, showToast]);

  // Fetch Dashboard KPI Stats
  useEffect(() => {
    if (!accessToken) return;
    const fetchStats = async () => {
      try {
        setStatsLoading(true);
        const res = await api.get("/reports/stats");
        setStats(res.data);
      } catch {
        showToast("Failed to fetch dashboard metrics", "error");
      } finally {
        setStatsLoading(false);
      }
    };
    fetchStats();
  }, [accessToken, showToast]);

  // Fetch Chart Data
  const fetchChartData = useCallback(async () => {
    if (!accessToken) return;
    setChartsLoading(true);
    try {
      // 1) Employees per Department (Bar Chart)
      const deptRes = await api.get("/reports/department-stats");
      const deptData = (deptRes.data || []).map((d) => ({
        name: d.departmentName || d.name,
        Employees: Number(d.employeeCount || d.count || 0),
      }));
      setDeptBarData(deptData);
    } catch (_) {}

    try {
      // 2) Asset Status (Pie Chart)
      const assetRes = await api.get("/assets/stats");
      const pieData = (assetRes.data?.data?.byStatus || []).map((s) => ({
        name: s.status,
        value: Number(s.count),
      }));
      setAssetPieData(pieData);
    } catch (_) {}

    try {
      // 3) Monthly Leave Applications (Area Chart)
      const leaveRes = await api.get("/reports/monthly-leaves");
      setLeaveAreaData(leaveRes.data || []);
    } catch (_) {}

    try {
      // 4) Monthly Hiring Trend (Line Chart)
      const hiringRes = await api.get("/reports/hiring-trend");
      setHiringLineData(hiringRes.data || []);
    } catch (_) {}

    setChartsLoading(false);
  }, [accessToken]);

  useEffect(() => {
    fetchChartData();
  }, [fetchChartData]);

  // Admin: Users list
  useEffect(() => {
    if (!user || (user.role !== "admin" && user.role !== "manager")) return;
    const fetchAdminUsers = async () => {
      try {
        setAdminLoading(true);
        const res = await api.get("/admin/users");
        setAdminUsers(res.data);
      } catch {
        showToast("Failed to fetch admin users list", "error");
      } finally {
        setAdminLoading(false);
      }
    };
    fetchAdminUsers();
  }, [user, showToast]);

  if (profileLoading) {
    return (
      <div className="dashboard-loading">
        <div className="spinner"></div>
        <p>Loading your profile...</p>
      </div>
    );
  }

  const KPI_CARDS = [
    { icon: "👥", label: "Total Employees", value: stats.employees, color: "var(--color-primary)" },
    { icon: "🏢", label: "Departments", value: stats.departments, color: "#8b5cf6" },
    { icon: "🌴", label: "Leave Requests", value: stats.leavesTotal, color: "#06b6d4" },
    { icon: "⏳", label: "Pending Approvals", value: stats.pendingApprovals, color: "#d97706" },
    { icon: "✅", label: "Approved Leaves", value: stats.approvedLeaves, color: "#16a34a" },
    { icon: "❌", label: "Rejected Leaves", value: stats.rejectedLeaves, color: "#dc2626" },
  ];

  return (
    <div className="page-container animate-fade-in">
      {/* Welcome Banner */}
      <div className="welcome-banner">
        <div>
          <h1 className="page-title">Welcome back, {user?.name}! 👋</h1>
          <p className="page-subtitle">
            Logged in as <strong>{user?.role}</strong> · Here's your EMS operational overview
          </p>
        </div>
        <div className="welcome-date">
          {new Date().toLocaleDateString("en-IN", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="kpi-grid">
        {KPI_CARDS.map((card, i) => (
          <div key={i} className="kpi-card" style={{ borderTop: `3px solid ${card.color}` }}>
            <span className="kpi-icon">{card.icon}</span>
            <div className="kpi-info">
              <div className="kpi-value" style={{ color: card.color }}>
                {statsLoading ? <span className="kpi-loading">—</span> : card.value}
              </div>
              <div className="kpi-label">{card.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* ─── Charts Grid ─────────────────────────────────────────────────────── */}
      <div className="charts-grid">

        {/* Chart 1: Employees per Department — Bar Chart */}
        <div className="chart-card">
          <div className="chart-header">
            <h3 className="chart-title">📊 Employees per Department</h3>
          </div>
          {chartsLoading ? (
            <div className="chart-loading">Loading chart…</div>
          ) : deptBarData.length === 0 ? (
            <div className="chart-empty">No department data yet</div>
          ) : (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={deptBarData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="Employees" radius={[4, 4, 0, 0]}>
                  {deptBarData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={BAR_COLORS[index % BAR_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Chart 2: Asset Status Breakdown — Pie Chart */}
        <div className="chart-card">
          <div className="chart-header">
            <h3 className="chart-title">💼 Asset Status Breakdown</h3>
          </div>
          {chartsLoading ? (
            <div className="chart-loading">Loading chart…</div>
          ) : assetPieData.length === 0 ? (
            <div className="chart-empty">No assets data yet</div>
          ) : (
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={assetPieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {assetPieData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={PIE_COLORS[entry.name] || BAR_COLORS[index % BAR_COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip formatter={(val, name) => [val, name]} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Chart 3: Monthly Leave Applications — Area Chart */}
        <div className="chart-card chart-wide">
          <div className="chart-header">
            <h3 className="chart-title">🌴 Monthly Leave Applications</h3>
          </div>
          {chartsLoading ? (
            <div className="chart-loading">Loading chart…</div>
          ) : leaveAreaData.length === 0 ? (
            <div className="chart-empty">No leave trend data yet</div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={leaveAreaData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                <defs>
                  <linearGradient id="leaveGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#059669" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#059669" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                <Tooltip content={<CustomTooltip />} />
                <Area
                  type="monotone"
                  dataKey="applications"
                  name="Applications"
                  stroke="#059669"
                  fill="url(#leaveGrad)"
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Chart 4: Monthly Hiring Trend — Line Chart */}
        <div className="chart-card chart-wide">
          <div className="chart-header">
            <h3 className="chart-title">📈 Monthly Hiring Trend</h3>
          </div>
          {chartsLoading ? (
            <div className="chart-loading">Loading chart…</div>
          ) : hiringLineData.length === 0 ? (
            <div className="chart-empty">No hiring trend data yet</div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={hiringLineData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                <Tooltip content={<CustomTooltip />} />
                <Line
                  type="monotone"
                  dataKey="newHires"
                  name="New Hires"
                  stroke="#10b981"
                  strokeWidth={2.5}
                  dot={{ fill: "#10b981", r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* ─── Admin Panel ─────────────────────────────────────────────────────── */}
      {(user?.role === "admin" || user?.role === "manager") && (
        <div className="card admin-panel-card" style={{ marginTop: "24px" }}>
          <h3>👑 Admin Panel: User Accounts Directory</h3>
          <p style={{ color: "var(--color-text-muted)", marginBottom: "16px" }}>
            As a <strong>{user?.role}</strong>, you have full visibility into all user accounts.
          </p>

          {adminLoading ? (
            <div className="table-loading"><div className="spinner"></div></div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table className="data-table admin-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Role</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {adminUsers.map((u) => (
                    <tr key={u.id}>
                      <td><code>{u.id}</code></td>
                      <td><strong>{u.name}</strong></td>
                      <td>{u.email}</td>
                      <td>
                        <span className={`user-role-badge ${u.role}`}>
                          {u.role.toUpperCase()}
                        </span>
                      </td>
                      <td>
                        <span style={{ color: u.verified ? "#16a34a" : "#dc2626", fontWeight: "600" }}>
                          {u.verified ? "✓ Verified" : "⚡ Pending"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default Dashboard;
