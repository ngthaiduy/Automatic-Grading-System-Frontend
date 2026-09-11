import { useState, useEffect, useCallback } from "react";
import { AuthContext } from "./authContext";

const SESSION_EXPIRED_STORAGE_KEY = "agsfjope.sessionExpiredMessage";

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Khôi phục user từ localStorage khi app load
  useEffect(() => {
    try {
      const savedUser = localStorage.getItem("user");
      if (savedUser) {
        setUser(JSON.parse(savedUser));
      }
    } catch (error) {
      console.error("Lỗi khi khôi phục user:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  const login = (userData) => {
    if (!userData) {
      console.error("userData không được để trống");
      return;
    }
    setUser(userData);
    localStorage.setItem("user", JSON.stringify(userData));
  };

  /**
   * Clears all auth state from React and localStorage.
   * Always call this function instead of manually removing items —
   * ensures React state (user) is reset and all keys are cleaned up.
   */
  const logout = useCallback(() => {
    setUser(null);
    localStorage.removeItem("user");
  }, []);

  /**
   * Listens for the 'session-expired' custom event dispatched by axiosClient
   * when the refresh token call fails (token expired or revoked).
   * On this event: logout and redirect to /login to force re-authentication.
   */
  useEffect(() => {
    const handleSessionExpired = (event) => {
      const message =
        typeof event?.detail?.message === "string" && event.detail.message.trim()
          ? event.detail.message.trim()
          : "Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại.";

      sessionStorage.setItem(SESSION_EXPIRED_STORAGE_KEY, message);
      logout();
      window.location.replace("/login");
    };

    window.addEventListener("session-expired", handleSessionExpired);

    // Cleanup listener khi component unmount
    return () => {
      window.removeEventListener("session-expired", handleSessionExpired);
    };
  }, [logout]);

  const value = {
    user,
    login,
    logout,
    loading,
    isAuthenticated: !!user,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

