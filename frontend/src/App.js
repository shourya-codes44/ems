import React, { useState, useCallback } from "react";
import { BrowserRouter } from "react-router-dom";
import { Provider, useSelector } from "react-redux";
import { store } from "./redux/store";
import { AuthProvider } from "./context/AuthContext";
import AppRoutes from "./routes/AppRoutes";
import Navbar from "./components/Navbar";
import Toast from "./components/Toast";
import "./index.css";

function AppContent({ toast, handleCloseToast, showToast }) {
  const { accessToken } = useSelector((state) => state.auth);

  return (
    <div className={`app-root-layout ${accessToken ? "has-sidebar" : "auth-layout"}`}>
      {/* Custom Toast Alert */}
      {toast.message && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={handleCloseToast}
        />
      )}

      {/* Sidebar Navigation */}
      <Navbar showToast={showToast} />

      {/* Main Content Area */}
      <div className="main-viewport-content">
        <AppRoutes showToast={showToast} />
      </div>
    </div>
  );
}

function App() {
  const [toast, setToast] = useState({ message: "", type: "success" });

  const showToast = useCallback((message, type = "success") => {
    setToast({ message, type });
  }, []);

  const handleCloseToast = useCallback(() => {
    setToast({ message: "", type: "success" });
  }, []);


  return (
    <Provider store={store}>
      <AuthProvider>
        <BrowserRouter>
          <AppContent
            toast={toast}
            handleCloseToast={handleCloseToast}
            showToast={showToast}
          />
        </BrowserRouter>
      </AuthProvider>
    </Provider>
  );
}

export default App;

