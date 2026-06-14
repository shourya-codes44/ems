import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useSelector } from "react-redux";
import api from "../services/api";

function EmployeeForm({ showToast }) {
  const { id } = useParams(); // Exists if we are in Edit mode
  const isEditMode = !!id;
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);

  // Form State
  const [formData, setFormData] = useState({
    userId: "",
    departmentId: "",
    phone: "",
    address: "",
    designation: "",
    salary: ""
  });
  const [selectedSkills, setSelectedSkills] = useState([]);
  const [images, setImages] = useState([]);
  
  // Data Loaders state
  const [usersList, setUsersList] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [skillsList, setSkillsList] = useState([]);
  
  const [loading, setLoading] = useState(false);
  const [dataLoading, setDataLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  // Fetch initial select lists (users, depts, skills)
  useEffect(() => {
    const fetchSelectData = async () => {
      try {
        setDataLoading(true);
        // Load depts and skills
        const [deptsRes, skillsRes] = await Promise.all([
          api.get("/departments"),
          api.get("/skills")
        ]);
        setDepartments(deptsRes.data);
        setSkillsList(skillsRes.data);

        // Load users (only needed in Create mode, and only accessible by admin/manager)
        if (!isEditMode) {
          try {
            const usersRes = await api.get("/admin/users");
            setUsersList(usersRes.data);
          } catch (err) {
            // Fallback if not admin (e.g. self-creating profile, though typically admin creates it)
            if (user) {
              setUsersList([user]);
              setFormData((prev) => ({ ...prev, userId: user.id }));
            }
          }
        }

        // If in Edit Mode, fetch current employee details
        if (isEditMode) {
          const empRes = await api.get(`/employees/${id}`);
          const emp = empRes.data;
          
          setFormData({
            userId: emp.userId,
            departmentId: emp.departmentId,
            phone: emp.phone,
            address: emp.address,
            designation: emp.designation,
            salary: emp.salary
          });
          setSelectedSkills(emp.skills.map(s => s.skillId));
          setImages(emp.images.map(img => img.imageUrl));
        }
      } catch (error) {
        showToast("Failed to load form lookup data", "error");
      } finally {
        setDataLoading(false);
      }
    };

    fetchSelectData();
  }, [id, isEditMode, showToast, user]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  // Toggle skills selections
  const handleSkillChange = (skillId) => {
    if (selectedSkills.includes(skillId)) {
      setSelectedSkills(selectedSkills.filter(id => id !== skillId));
    } else {
      setSelectedSkills([...selectedSkills, skillId]);
    }
  };

  // Handle Multer upload
  const handleFileUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    if (files.length > 5) {
      showToast("Maximum of 5 images allowed.", "error");
      return;
    }

    const uploadData = new FormData();
    files.forEach((file) => {
      uploadData.append("images", file);
    });

    try {
      setUploading(true);
      const res = await api.post("/employees/upload", uploadData, {
        headers: {
          "Content-Type": "multipart/form-data"
        }
      });
      // Set the returned static urls to state
      setImages(res.data.urls);
      showToast("Files uploaded successfully!", "success");
    } catch (error) {
      const msg = error.response?.data?.message || "File upload failed";
      showToast(msg, "error");
    } finally {
      setUploading(false);
    }
  };

  const removeImage = (indexToRemove) => {
    setImages(images.filter((_, index) => index !== indexToRemove));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const payload = {
      ...formData,
      skills: selectedSkills,
      images: images
    };

    if (!payload.userId || !payload.departmentId || !payload.phone || !payload.address || !payload.designation || !payload.salary) {
      showToast("Please fill in all profile details", "error");
      return;
    }

    try {
      setLoading(true);
      if (isEditMode) {
        await api.put(`/employees/${id}`, payload);
        showToast("Employee profile updated successfully!", "success");
      } else {
        await api.post("/employees", payload);
        showToast("Employee profile created successfully!", "success");
      }
      navigate("/employees");
    } catch (error) {
      const msg = error.response?.data?.message || "Action failed";
      showToast(msg, "error");
    } finally {
      setLoading(false);
    }
  };

  if (dataLoading) {
    return (
      <div className="dashboard-loading">
        <div className="spinner"></div>
        <p>Loading Profile Form...</p>
      </div>
    );
  }

  return (
    <div className="form-panel-container animate-fade-in" style={{ width: "100%", maxWidth: "800px", margin: "0 auto", padding: "20px" }}>
      <div className="welcome-banner">
        <h2>{isEditMode ? "✍️ Edit Employee Profile" : "➕ Create Employee Profile"}</h2>
        <p>Fill out the profile attributes, link skills, and upload verified credentials.</p>
      </div>

      <div className="card" style={{ marginTop: "24px" }}>
        <form onSubmit={handleSubmit} className="auth-form" style={{ maxWidth: "100%" }}>
          <div className="form-row-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
            
            {/* User Account Selection (Disabled on Edit Mode) */}
            <div className="input-group">
              <label htmlFor="userId">Link User Account</label>
              <select
                id="userId"
                name="userId"
                value={formData.userId}
                onChange={handleChange}
                disabled={isEditMode}
                style={{
                  padding: "12px 16px",
                  borderRadius: "var(--radius-sm)",
                  border: "1px solid var(--color-border)",
                  backgroundColor: isEditMode ? "#e2e8f0" : "var(--bg-input)",
                  fontFamily: "var(--font-sans)"
                }}
              >
                <option value="">-- Select User --</option>
                {isEditMode ? (
                  <option value={formData.userId}>Account Linked</option>
                ) : (
                  usersList.map(u => (
                    <option key={u.id} value={u.id}>{u.name} ({u.email})</option>
                  ))
                )}
              </select>
            </div>

            {/* Department Selection */}
            <div className="input-group">
              <label htmlFor="departmentId">Department</label>
              <select
                id="departmentId"
                name="departmentId"
                value={formData.departmentId}
                onChange={handleChange}
                style={{
                  padding: "12px 16px",
                  borderRadius: "var(--radius-sm)",
                  border: "1px solid var(--color-border)",
                  backgroundColor: "var(--bg-input)",
                  fontFamily: "var(--font-sans)"
                }}
              >
                <option value="">-- Select Department --</option>
                {departments.map(d => (
                  <option key={d.id} value={d.id}>{d.departmentName}</option>
                ))}
              </select>
            </div>

            {/* Designation */}
            <div className="input-group">
              <label htmlFor="designation">Designation</label>
              <input
                id="designation"
                name="designation"
                type="text"
                placeholder="e.g. Senior Software Architect"
                value={formData.designation}
                onChange={handleChange}
              />
            </div>

            {/* Salary */}
            <div className="input-group">
              <label htmlFor="salary">Salary ($)</label>
              <input
                id="salary"
                name="salary"
                type="number"
                step="0.01"
                placeholder="e.g. 75000.00"
                value={formData.salary}
                onChange={handleChange}
              />
            </div>

            {/* Phone */}
            <div className="input-group">
              <label htmlFor="phone">Phone Number</label>
              <input
                id="phone"
                name="phone"
                type="text"
                placeholder="e.g. +1 555 12345"
                value={formData.phone}
                onChange={handleChange}
              />
            </div>

            {/* Address */}
            <div className="input-group" style={{ gridColumn: "1 / -1" }}>
              <label htmlFor="address">Residential Address</label>
              <textarea
                id="address"
                name="address"
                placeholder="Street Address, City, State, ZIP"
                value={formData.address}
                onChange={handleChange}
                style={{
                  padding: "12px 16px",
                  borderRadius: "var(--radius-sm)",
                  border: "1px solid var(--color-border)",
                  backgroundColor: "var(--bg-input)",
                  fontFamily: "var(--font-sans)",
                  minHeight: "80px",
                  resize: "vertical"
                }}
              />
            </div>
          </div>

          {/* Skills Multi-Selector Checkbox grid */}
          <div style={{ marginTop: "20px" }}>
            <label className="detail-label" style={{ fontSize: "0.85rem", marginBottom: "8px", display: "block" }}>
              Assign Technical Skills
            </label>
            <div className="skills-checkbox-grid" style={{ display: "flex", flexWrap: "wrap", gap: "10px" }}>
              {skillsList.map(s => {
                const isChecked = selectedSkills.includes(s.id);
                return (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => handleSkillChange(s.id)}
                    style={{
                      padding: "8px 16px",
                      borderRadius: "20px",
                      border: isChecked ? "2px solid var(--color-primary)" : "1px solid var(--color-border)",
                      backgroundColor: isChecked ? "var(--color-primary-light)" : "#ffffff",
                      color: isChecked ? "var(--color-primary)" : "var(--color-text-muted)",
                      fontWeight: "bold",
                      fontSize: "0.82rem",
                      cursor: "pointer",
                      transition: "all var(--transition-fast)"
                    }}
                  >
                    {isChecked ? "✓ " : ""}{s.skillName}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Multi Image Upload Box */}
          <div style={{ marginTop: "24px" }}>
            <label className="detail-label" style={{ fontSize: "0.85rem", marginBottom: "8px", display: "block" }}>
              Upload Photos / Documents (Max 5 Files)
            </label>
            <div className="upload-box-wrapper" style={{
              border: "2px dashed var(--color-border)",
              borderRadius: "var(--radius-md)",
              padding: "24px",
              textAlign: "center",
              backgroundColor: "rgba(248, 250, 252, 0.5)"
            }}>
              <input
                id="file-uploader"
                type="file"
                multiple
                accept="image/*"
                onChange={handleFileUpload}
                style={{ display: "none" }}
              />
              <label htmlFor="file-uploader" style={{ cursor: "pointer", display: "block" }}>
                <span style={{ fontSize: "2.5rem", display: "block", marginBottom: "8px" }}>📁</span>
                <span className="link-span" style={{ fontWeight: "bold" }}>Click here to select files</span>
                <p style={{ fontSize: "0.8rem", color: "var(--color-text-muted)", marginTop: "4px" }}>
                  Attach profile photos, identity cards, certificates, or resumes
                </p>
              </label>

              {uploading && (
                <div style={{ marginTop: "15px" }}>
                  <div className="spinner" style={{ margin: "5px auto", width: "20px", height: "20px" }}></div>
                  <p style={{ fontSize: "0.85rem" }}>Uploading selected files...</p>
                </div>
              )}
            </div>

            {/* Uploaded Files Preview Grid */}
            {images.length > 0 && (
              <div className="images-preview-grid" style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(100px, 1fr))",
                gap: "12px",
                marginTop: "16px"
              }}>
                {images.map((url, idx) => (
                  <div key={idx} className="preview-thumbnail" style={{
                    position: "relative",
                    borderRadius: "var(--radius-sm)",
                    overflow: "hidden",
                    border: "1px solid var(--color-border)",
                    height: "100px"
                  }}>
                    <img src={url} alt={`upload-${idx}`} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    <button
                      type="button"
                      onClick={() => removeImage(idx)}
                      style={{
                        position: "absolute",
                        top: "4px",
                        right: "4px",
                        backgroundColor: "rgba(239, 68, 68, 0.85)",
                        color: "#ffffff",
                        border: "none",
                        width: "20px",
                        height: "20px",
                        borderRadius: "50%",
                        cursor: "pointer",
                        fontWeight: "bold",
                        lineHeight: "20px",
                        fontSize: "0.8rem",
                        padding: "0"
                      }}
                    >
                      &times;
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div style={{ display: "flex", gap: "15px", marginTop: "32px" }}>
            <button type="submit" disabled={loading} className="btn-primary" style={{ flexGrow: 1 }}>
              {loading ? "Saving..." : isEditMode ? "Update Profile" : "Create Profile"}
            </button>
            <button type="button" onClick={() => navigate("/employees")} className="btn-secondary">
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default EmployeeForm;
