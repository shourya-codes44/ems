import React, { useState, useCallback, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";

const GlobalSearch = () => {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const debounceRef = useRef(null);
  const wrapperRef = useRef(null);
  const navigate = useNavigate();

  const search = useCallback(async (q) => {
    if (q.trim().length < 2) {
      setResults(null);
      setOpen(false);
      return;
    }
    setLoading(true);
    try {
      const { data } = await api.get(`/search?q=${encodeURIComponent(q)}`);
      setResults(data.results);
      setOpen(true);
    } catch (_) {
      setResults(null);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleChange = (e) => {
    const val = e.target.value;
    setQuery(val);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => search(val), 350);
  };

  // Close on outside click
  useEffect(() => {
    const handler = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const hasResults =
    results &&
    (results.employees?.length > 0 || results.departments?.length > 0 || results.skills?.length > 0);

  return (
    <div className="global-search-wrapper" ref={wrapperRef}>
      <div className="global-search-input-wrap">
        <span className="global-search-icon">🔍</span>
        <input
          id="global-search-input"
          type="text"
          className="global-search-input"
          placeholder="Search employees, departments, skills…"
          value={query}
          onChange={handleChange}
          onFocus={() => query.length >= 2 && setOpen(true)}
          autoComplete="off"
        />
        {loading && <span className="global-search-spinner">⟳</span>}
      </div>

      {open && (
        <div className="global-search-dropdown" id="global-search-results">
          {!hasResults ? (
            <div className="search-no-result">No results for "{query}"</div>
          ) : (
            <>
              {results.employees?.length > 0 && (
                <div className="search-group">
                  <div className="search-group-label">👤 Employees</div>
                  {results.employees.map((emp) => (
                    <div
                      key={emp.id}
                      className="search-item"
                      onClick={() => {
                        navigate("/employees");
                        setOpen(false);
                        setQuery("");
                      }}
                    >
                      <strong>{emp.name}</strong>
                      <span className="search-item-sub">
                        {emp.employeeProfile?.designation || emp.role} ·{" "}
                        {emp.employeeProfile?.department?.departmentName || "No Dept"}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {results.departments?.length > 0 && (
                <div className="search-group">
                  <div className="search-group-label">🏢 Departments</div>
                  {results.departments.map((dept) => (
                    <div
                      key={dept.id}
                      className="search-item"
                      onClick={() => {
                        navigate("/departments");
                        setOpen(false);
                        setQuery("");
                      }}
                    >
                      <strong>{dept.departmentName}</strong>
                      <span className="search-item-sub">
                        {dept._count?.employeeProfiles || 0} employees
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {results.skills?.length > 0 && (
                <div className="search-group">
                  <div className="search-group-label">🛠️ Skills</div>
                  {results.skills.map((skill) => (
                    <div
                      key={skill.id}
                      className="search-item"
                      onClick={() => {
                        navigate("/skills");
                        setOpen(false);
                        setQuery("");
                      }}
                    >
                      <strong>{skill.skillName}</strong>
                      <span className="search-item-sub">
                        {skill._count?.employeeSkills || 0} employees
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default GlobalSearch;
