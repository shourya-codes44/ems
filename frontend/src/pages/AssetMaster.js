import React, { useState, useEffect, useCallback } from "react";
import api from "../services/api";
import Pagination from "../components/common/Pagination";
import FormInput from "../components/common/FormInput";
import FormSelect from "../components/common/FormSelect";

const STATUS_COLORS = {
  AVAILABLE: { bg: "#dcfce7", color: "#166534", label: "✅ Available" },
  ALLOCATED: { bg: "#dbeafe", color: "#1e40af", label: "🔵 Allocated" },
  RETURNED: { bg: "#f3f4f6", color: "#374151", label: "↩️ Returned" },
  DAMAGED: { bg: "#fef3c7", color: "#92400e", label: "⚠️ Damaged" },
  LOST: { bg: "#fee2e2", color: "#991b1b", label: "🔴 Lost" },
};

const ASSET_TYPES = [
  "Laptop", "Monitor", "Peripheral", "Mobile Device",
  "Furniture", "AV Equipment", "Office Equipment", "Other"
];

export default function AssetMaster() {
  const [assets, setAssets] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [stats, setStats] = useState({ total: 0, byStatus: [] });
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterType, setFilterType] = useState("");

  // Modal states
  const [showCreate, setShowCreate] = useState(false);
  const [showAllocate, setShowAllocate] = useState(null); // assetId
  const [showHistory, setShowHistory] = useState(null); // asset object
  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [allocEmployee, setAllocEmployee] = useState("");
  const [toast, setToast] = useState(null);

  // Form state
  const [form, setForm] = useState({
    assetCode: "", assetName: "", assetType: "",
    purchaseCost: "", purchaseDate: ""
  });
  const [formErrors, setFormErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const LIMIT = 8;
  const totalPages = Math.ceil(total / LIMIT);

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const fetchAssets = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page,
        limit: LIMIT,
        ...(search && { search }),
        ...(filterStatus && { status: filterStatus }),
        ...(filterType && { type: filterType }),
      });
      const { data } = await api.get(`/assets?${params}`);
      setAssets(data.assets || []);
      setTotal(data.total || 0);
    } catch (err) {
      showToast("Failed to load assets", "error");
    } finally {
      setLoading(false);
    }
  }, [page, search, filterStatus, filterType]);

  const fetchStats = useCallback(async () => {
    try {
      const { data } = await api.get("/assets/stats");
      setStats(data.data || { total: 0, byStatus: [] });
    } catch (_) {}
  }, []);

  const fetchEmployees = useCallback(async () => {
    try {
      const { data } = await api.get("/employees");
      setEmployees(data.employees || data || []);
    } catch (_) {}
  }, []);

  useEffect(() => {
    fetchAssets();
  }, [fetchAssets]);

  useEffect(() => {
    fetchStats();
    fetchEmployees();
  }, [fetchStats, fetchEmployees]);

  // Debounced search
  useEffect(() => {
    const t = setTimeout(() => setPage(1), 400);
    return () => clearTimeout(t);
  }, [search]);

  // ─── Create Asset ──────────────────────────────────────────────────────────
  const validateForm = () => {
    const errs = {};
    if (!form.assetCode.trim()) errs.assetCode = "Asset code is required";
    if (!form.assetName.trim()) errs.assetName = "Asset name is required";
    if (!form.assetType) errs.assetType = "Asset type is required";
    setFormErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    setSubmitting(true);
    try {
      await api.post("/assets", {
        assetCode: form.assetCode,
        assetName: form.assetName,
        assetType: form.assetType,
        purchaseCost: form.purchaseCost ? parseFloat(form.purchaseCost) : null,
        purchaseDate: form.purchaseDate || null,
        status: "AVAILABLE",
      });
      showToast("Asset created successfully!");
      setShowCreate(false);
      setForm({ assetCode: "", assetName: "", assetType: "", purchaseCost: "", purchaseDate: "" });
      fetchAssets();
      fetchStats();
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to create asset", "error");
    } finally {
      setSubmitting(false);
    }
  };

  // ─── Allocate ─────────────────────────────────────────────────────────────
  const handleAllocate = async () => {
    if (!allocEmployee) return showToast("Please select an employee", "error");
    try {
      await api.post(`/assets/${showAllocate}/allocate`, { employeeId: allocEmployee });
      showToast("Asset allocated successfully!");
      setShowAllocate(null);
      setAllocEmployee("");
      fetchAssets();
      fetchStats();
    } catch (err) {
      showToast(err.response?.data?.message || "Allocation failed", "error");
    }
  };

  // ─── Return ───────────────────────────────────────────────────────────────
  const handleReturn = async (assetId) => {
    if (!window.confirm("Mark this asset as returned?")) return;
    try {
      await api.post(`/assets/${assetId}/return`, {});
      showToast("Asset returned successfully!");
      fetchAssets();
      fetchStats();
    } catch (err) {
      showToast(err.response?.data?.message || "Return failed", "error");
    }
  };

  // ─── View History ─────────────────────────────────────────────────────────
  const handleViewHistory = async (asset) => {
    setShowHistory(asset);
    setHistoryLoading(true);
    try {
      const { data } = await api.get(`/assets/${asset.id}/history`);
      setHistory(data.data || []);
    } catch (_) {
      setHistory([]);
    } finally {
      setHistoryLoading(false);
    }
  };

  // ─── Export ───────────────────────────────────────────────────────────────
  const handleExport = async (type) => {
    try {
      const res = await api.get(`/assets?export=${type}`, {
        responseType: "blob",
      });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `asset-report.${type}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (_) {
      showToast("Export failed", "error");
    }
  };

  const getStatCount = (status) =>
    stats.byStatus?.find((s) => s.status === status)?.count || 0;

  const empOptions = employees.map((e) => ({
    value: e.id || e.employeeId,
    label: `${e.name || e.userName} — ${e.designation || ""}`,
  }));

  return (
    <div className="page-container">
      {/* Toast */}
      {toast && (
        <div className={`toast-msg ${toast.type === "error" ? "toast-error" : "toast-success"}`}>
          {toast.msg}
        </div>
      )}

      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">💼 Asset Management</h1>
          <p className="page-subtitle">Track company assets from inventory to allocation</p>
        </div>
        <div className="page-header-actions">
          <button className="btn btn-outline-sm" onClick={() => handleExport("xlsx")}>
            ⬇️ Export XLSX
          </button>
          <button className="btn btn-outline-sm" onClick={() => handleExport("csv")}>
            ⬇️ Export CSV
          </button>
          <button className="btn btn-primary" id="add-asset-btn" onClick={() => setShowCreate(true)}>
            ➕ Add Asset
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="stats-grid-5">
        <div className="stat-card stat-primary">
          <div className="stat-value">{stats.total}</div>
          <div className="stat-label">Total Assets</div>
        </div>
        {["AVAILABLE", "ALLOCATED", "RETURNED", "DAMAGED"].map((s) => (
          <div
            key={s}
            className="stat-card"
            style={{ borderLeft: `4px solid ${STATUS_COLORS[s]?.color}` }}
          >
            <div className="stat-value" style={{ color: STATUS_COLORS[s]?.color }}>
              {getStatCount(s)}
            </div>
            <div className="stat-label">{STATUS_COLORS[s]?.label}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="filter-bar">
        <input
          type="text"
          className="filter-search"
          placeholder="🔍 Search by name, code, or type..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          id="asset-search-input"
        />
        <select
          className="filter-select"
          value={filterStatus}
          onChange={(e) => { setFilterStatus(e.target.value); setPage(1); }}
        >
          <option value="">All Statuses</option>
          {Object.keys(STATUS_COLORS).map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
        <select
          className="filter-select"
          value={filterType}
          onChange={(e) => { setFilterType(e.target.value); setPage(1); }}
        >
          <option value="">All Types</option>
          {ASSET_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
        </select>
        {(search || filterStatus || filterType) && (
          <button className="btn btn-outline-sm" onClick={() => { setSearch(""); setFilterStatus(""); setFilterType(""); setPage(1); }}>
            ✖ Clear
          </button>
        )}
      </div>

      {/* Asset Table */}
      <div className="table-card">
        {loading ? (
          <div className="table-loading">Loading assets…</div>
        ) : assets.length === 0 ? (
          <div className="table-empty">
            <span style={{ fontSize: "3rem" }}>📦</span>
            <p>No assets found</p>
          </div>
        ) : (
          <>
            <table className="data-table" id="assets-table">
              <thead>
                <tr>
                  <th>Asset Code</th>
                  <th>Name</th>
                  <th>Type</th>
                  <th>Status</th>
                  <th>Allocated To</th>
                  <th>Purchase Cost</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {assets.map((asset) => {
                  const statusStyle = STATUS_COLORS[asset.status] || STATUS_COLORS.AVAILABLE;
                  const activeAlloc = asset.allocations?.[0];
                  return (
                    <tr key={asset.id}>
                      <td>
                        <code className="asset-code-badge">{asset.assetCode}</code>
                      </td>
                      <td><strong>{asset.assetName}</strong></td>
                      <td>
                        <span className="type-chip">{asset.assetType}</span>
                      </td>
                      <td>
                        <span
                          className="status-badge"
                          style={{ backgroundColor: statusStyle.bg, color: statusStyle.color }}
                        >
                          {statusStyle.label}
                        </span>
                      </td>
                      <td>
                        {activeAlloc
                          ? activeAlloc.employee?.user?.name || "—"
                          : <span className="text-muted">—</span>
                        }
                      </td>
                      <td>
                        {asset.purchaseCost
                          ? `₹${Number(asset.purchaseCost).toLocaleString("en-IN")}`
                          : "—"
                        }
                      </td>
                      <td>
                        <div className="action-buttons">
                          {asset.status === "AVAILABLE" && (
                            <button
                              className="btn-action btn-allocate"
                              onClick={() => setShowAllocate(asset.id)}
                              title="Allocate to Employee"
                            >
                              📋 Allocate
                            </button>
                          )}
                          {asset.status === "ALLOCATED" && (
                            <button
                              className="btn-action btn-return"
                              onClick={() => handleReturn(asset.id)}
                              title="Mark as Returned"
                            >
                              ↩️ Return
                            </button>
                          )}
                          <button
                            className="btn-action btn-history"
                            onClick={() => handleViewHistory(asset)}
                            title="View History"
                          >
                            📜 History
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            <div className="table-footer">
              <span className="table-count">
                Showing {Math.min((page - 1) * LIMIT + 1, total)}–{Math.min(page * LIMIT, total)} of {total} assets
              </span>
              <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
            </div>
          </>
        )}
      </div>

      {/* ─── Create Asset Modal ─────────────────────────────────────────────── */}
      {showCreate && (
        <div className="modal-overlay" onClick={() => setShowCreate(false)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>➕ Add New Asset</h3>
              <button className="modal-close" onClick={() => setShowCreate(false)}>✕</button>
            </div>
            <form onSubmit={handleCreate} className="modal-form">
              <div className="form-grid-2">
                <FormInput
                  id="asset-code"
                  label="Asset Code"
                  value={form.assetCode}
                  onChange={(e) => setForm({ ...form, assetCode: e.target.value })}
                  placeholder="e.g. LAPTOP-005"
                  error={formErrors.assetCode}
                  required
                />
                <FormSelect
                  id="asset-type"
                  label="Asset Type"
                  value={form.assetType}
                  onChange={(e) => setForm({ ...form, assetType: e.target.value })}
                  options={ASSET_TYPES.map((t) => ({ value: t, label: t }))}
                  error={formErrors.assetType}
                  required
                />
              </div>
              <FormInput
                id="asset-name"
                label="Asset Name"
                value={form.assetName}
                onChange={(e) => setForm({ ...form, assetName: e.target.value })}
                placeholder="e.g. Dell XPS 15 Laptop"
                error={formErrors.assetName}
                required
              />
              <div className="form-grid-2">
                <FormInput
                  id="purchase-cost"
                  label="Purchase Cost (₹)"
                  type="number"
                  value={form.purchaseCost}
                  onChange={(e) => setForm({ ...form, purchaseCost: e.target.value })}
                  placeholder="e.g. 85000"
                />
                <FormInput
                  id="purchase-date"
                  label="Purchase Date"
                  type="date"
                  value={form.purchaseDate}
                  onChange={(e) => setForm({ ...form, purchaseDate: e.target.value })}
                />
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-outline" onClick={() => setShowCreate(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={submitting} id="submit-asset-btn">
                  {submitting ? "Creating…" : "Create Asset"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── Allocate Modal ──────────────────────────────────────────────────── */}
      {showAllocate && (
        <div className="modal-overlay" onClick={() => setShowAllocate(null)}>
          <div className="modal-box modal-sm" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>📋 Allocate Asset</h3>
              <button className="modal-close" onClick={() => setShowAllocate(null)}>✕</button>
            </div>
            <div className="modal-form">
              <FormSelect
                id="alloc-employee"
                label="Select Employee"
                value={allocEmployee}
                onChange={(e) => setAllocEmployee(e.target.value)}
                options={empOptions}
                placeholder="-- Choose Employee --"
                required
              />
              <div className="modal-footer">
                <button className="btn btn-outline" onClick={() => setShowAllocate(null)}>Cancel</button>
                <button className="btn btn-primary" onClick={handleAllocate} id="confirm-allocate-btn">
                  Allocate
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── History Modal ───────────────────────────────────────────────────── */}
      {showHistory && (
        <div className="modal-overlay" onClick={() => setShowHistory(null)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>📜 Asset History — {showHistory.assetCode}</h3>
              <button className="modal-close" onClick={() => setShowHistory(null)}>✕</button>
            </div>
            <div className="history-body">
              {historyLoading ? (
                <div className="table-loading">Loading history…</div>
              ) : history.length === 0 ? (
                <div className="table-empty">
                  <span style={{ fontSize: "2rem" }}>📋</span>
                  <p>No history yet</p>
                </div>
              ) : (
                <div className="history-timeline">
                  {history.map((h) => (
                    <div key={h.id} className="history-item">
                      <div className={`history-dot history-${h.action.toLowerCase()}`} />
                      <div className="history-content">
                        <div className="history-action">{h.action}</div>
                        <div className="history-remarks">{h.remarks || "—"}</div>
                        <div className="history-time">
                          {new Date(h.createdAt).toLocaleString()}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
