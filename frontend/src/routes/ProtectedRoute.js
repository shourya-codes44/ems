import React from "react";
import { Navigate } from "react-router-dom";
import { useSelector } from "react-redux";

function ProtectedRoute({ children }) {
  const { accessToken } = useSelector((state) => state.auth);

  return accessToken ? children : <Navigate to="/" replace />;
}

export default ProtectedRoute;
