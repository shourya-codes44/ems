import React, { useState, useEffect } from "react";
import api from "../services/api";

function SkillMaster({ showToast }) {
  const [skills, setSkills] = useState([]);
  const [newSkillName, setNewSkillName] = useState("");
  const [loading, setLoading] = useState(false);
  const [listLoading, setListLoading] = useState(true);

  const fetchSkills = async () => {
    try {
      setListLoading(true);
      const res = await api.get("/skills");
      setSkills(res.data);
    } catch (error) {
      showToast("Failed to fetch skills", "error");
    } finally {
      setListLoading(false);
    }
  };

  useEffect(() => {
    fetchSkills();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!newSkillName.trim()) {
      showToast("Please enter a skill name", "error");
      return;
    }

    try {
      setLoading(true);
      const res = await api.post("/skills", {
        skillName: newSkillName
      });
      showToast(`Skill "${res.data.skillName}" created successfully!`, "success");
      setNewSkillName("");
      fetchSkills();
    } catch (error) {
      const message = error.response?.data?.message || "Failed to create skill";
      showToast(message, "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="master-panel-container animate-fade-in">
      <div className="welcome-banner">
        <h2>🛠️ Technical Skills Directory</h2>
        <p>Define global capabilities that can be assigned to employee corporate sheets.</p>
      </div>

      <div className="master-grid">
        {/* Form Column */}
        <div className="card">
          <h3>Create Skill Tag</h3>
          <form onSubmit={handleSubmit} style={{ marginTop: "15px" }}>
            <div className="input-group">
              <label htmlFor="skill-name">Skill Name</label>
              <input
                id="skill-name"
                type="text"
                placeholder="e.g. Docker"
                value={newSkillName}
                onChange={(e) => setNewSkillName(e.target.value)}
              />
            </div>
            <button type="submit" disabled={loading} className="btn-primary">
              {loading ? "Creating..." : "Add Skill Tag"}
            </button>
          </form>
        </div>

        {/* List Column */}
        <div className="card">
          <h3>Registered Skill Tags</h3>
          
          {listLoading ? (
            <div style={{ padding: "20px 0", textAlign: "center" }}>
              <div className="spinner" style={{ margin: "10px auto" }}></div>
              <p>Loading skills...</p>
            </div>
          ) : (
            <div className="admin-table-wrapper">
              <table className="admin-table" style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr>
                    <th style={{ width: "80px" }}>ID</th>
                    <th>Skill Tag</th>
                  </tr>
                </thead>
                <tbody>
                  {skills.length === 0 ? (
                    <tr>
                      <td colSpan="2" style={{ textAlign: "center", color: "var(--color-text-muted)" }}>
                        No skills defined.
                      </td>
                    </tr>
                  ) : (
                    skills.map((skill) => (
                      <tr key={skill.id} style={{ borderBottom: "1px solid var(--color-border)" }}>
                        <td style={{ fontFamily: "var(--font-mono)", fontSize: "0.85rem" }}>{skill.id}</td>
                        <td>
                          <span className="skill-badge" style={{
                            padding: "4px 10px",
                            backgroundColor: "var(--color-primary-light)",
                            color: "var(--color-primary)",
                            borderRadius: "12px",
                            fontSize: "0.82rem",
                            fontWeight: "bold"
                          }}>
                            {skill.skillName}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default SkillMaster;
