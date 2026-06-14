import React, { createContext, useState, useEffect, useContext } from "react";
import api from "../services/api";
import { store } from "../redux/store";
import { loginSuccess, logout as reduxLogout, updateUser } from "../redux/authSlice";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [accessToken, setAccessTokenState] = useState(localStorage.getItem("accessToken") || null);
  const [refreshToken, setRefreshTokenState] = useState(localStorage.getItem("refreshToken") || null);
  const [loading, setLoading] = useState(true);

  const login = (newAccess, newRefresh) => {
    setAccessTokenState(newAccess);
    setRefreshTokenState(newRefresh);
    localStorage.setItem("accessToken", newAccess);
    localStorage.setItem("refreshToken", newRefresh);
    
    // Sync Redux
    store.dispatch(loginSuccess({ accessToken: newAccess, refreshToken: newRefresh }));
  };

  const logoutUser = async () => {
    try {
      const rt = localStorage.getItem("refreshToken");
      if (rt) {
        await api.post("/auth/logout", { refreshToken: rt });
      }
    } catch (err) {
      // Ignore network failures on logout
    }
    
    setAccessTokenState(null);
    setRefreshTokenState(null);
    setUser(null);
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    
    // Sync Redux
    store.dispatch(reduxLogout());
  };

  const fetchProfile = async () => {
    try {
      const res = await api.get("/user/profile");
      setUser(res.data);
      // Sync Redux
      store.dispatch(updateUser(res.data));
    } catch (err) {
      logoutUser();
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (accessToken) {
      fetchProfile();
    } else {
      setLoading(false);
    }
  }, [accessToken]);

  return (
    <AuthContext.Provider value={{ user, accessToken, refreshToken, loading, login, logout: logoutUser, fetchProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
export default AuthContext;
