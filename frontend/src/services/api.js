import axios from "axios";
import { store } from "../redux/store";
import { setAccessToken, logout } from "../redux/authSlice";

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000/api";

const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json"
  }
});

// Request Interceptor: Attach the current Access Token if present
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("accessToken");
    if (token) {
      config.headers["Authorization"] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Catch 401 and try to refresh token
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Check if the error is 401 Unauthorized, and we haven't already retried this request
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      const refreshToken = localStorage.getItem("refreshToken");

      if (refreshToken) {
        try {
          // Attempt to fetch a new access token
          const res = await axios.post(`${API_URL}/auth/refresh-token`, {
            refreshToken
          });

          const { accessToken } = res.data;

          // Save new access token in Redux and LocalStorage
          store.dispatch(setAccessToken(accessToken));

          // Update header and retry the original request
          originalRequest.headers["Authorization"] = `Bearer ${accessToken}`;
          return api(originalRequest);
        } catch (refreshError) {
          // Refresh token is invalid or expired, force logout
          store.dispatch(logout());
          window.location.href = "/";
          return Promise.reject(refreshError);
        }
      } else {
        // No refresh token available, logout
        store.dispatch(logout());
        window.location.href = "/";
      }
    }

    return Promise.reject(error);
  }
);

export default api;
