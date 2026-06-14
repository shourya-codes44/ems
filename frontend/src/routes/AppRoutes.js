import React from "react";
import { Routes, Route } from "react-router-dom";

import Login from "../pages/Login";
import Signup from "../pages/Signup";
import Dashboard from "../pages/Dashboard";
import ForgotPassword from "../pages/ForgotPassword";
import ResetPassword from "../pages/ResetPassword";
import VerifyEmail from "../pages/VerifyEmail";
import EmployeeList from "../pages/EmployeeList";
import EmployeeForm from "../pages/EmployeeForm";
import DepartmentMaster from "../pages/DepartmentMaster";
import SkillMaster from "../pages/SkillMaster";
import LeaveApplication from "../pages/LeaveApplication";
import LeaveApproval from "../pages/LeaveApproval";
import Reports from "../pages/Reports";
import AssetMaster from "../pages/AssetMaster";
import ProtectedRoute from "./ProtectedRoute";

function AppRoutes({ showToast }) {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/" element={<Login showToast={showToast} />} />
      <Route path="/signup" element={<Signup showToast={showToast} />} />
      <Route path="/forgot-password" element={<ForgotPassword showToast={showToast} />} />
      <Route path="/reset-password" element={<ResetPassword showToast={showToast} />} />
      <Route path="/verify-email/:token" element={<VerifyEmail showToast={showToast} />} />

      {/* Protected Routes */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <Dashboard showToast={showToast} />
          </ProtectedRoute>
        }
      />
      <Route
        path="/employees"
        element={
          <ProtectedRoute>
            <EmployeeList showToast={showToast} />
          </ProtectedRoute>
        }
      />
      <Route
        path="/employees/create"
        element={
          <ProtectedRoute>
            <EmployeeForm showToast={showToast} />
          </ProtectedRoute>
        }
      />
      <Route
        path="/employees/edit/:id"
        element={
          <ProtectedRoute>
            <EmployeeForm showToast={showToast} />
          </ProtectedRoute>
        }
      />
      <Route
        path="/departments"
        element={
          <ProtectedRoute>
            <DepartmentMaster showToast={showToast} />
          </ProtectedRoute>
        }
      />
      <Route
        path="/skills"
        element={
          <ProtectedRoute>
            <SkillMaster showToast={showToast} />
          </ProtectedRoute>
        }
      />
      <Route
        path="/leaves"
        element={
          <ProtectedRoute>
            <LeaveApplication showToast={showToast} />
          </ProtectedRoute>
        }
      />
      <Route
        path="/approvals"
        element={
          <ProtectedRoute>
            <LeaveApproval showToast={showToast} />
          </ProtectedRoute>
        }
      />
      <Route
        path="/reports"
        element={
          <ProtectedRoute>
            <Reports showToast={showToast} />
          </ProtectedRoute>
        }
      />
      <Route
        path="/assets"
        element={
          <ProtectedRoute>
            <AssetMaster showToast={showToast} />
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}

export default AppRoutes;

