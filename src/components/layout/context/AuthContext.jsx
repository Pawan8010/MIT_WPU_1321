/**
 * AuthContext — provides authentication state globally.
 *
 * Wraps the app and exposes:
 *   - user (current Firebase user or null)
 *   - loading (auth state being resolved)
 *   - signup, login, loginWithGoogle, logout functions
 */
import { createContext, useContext, useState, useEffect } from "react";
import {
  signup as authSignup,
  login as authLogin,
  loginWithGoogle as authLoginWithGoogle,
  logout as authLogout,
  onAuthChange,
} from "../services/auth";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Listen for auth state changes (Firebase + demo)
  useEffect(() => {
    const unsubscribe = onAuthChange((firebaseUser) => {
      setUser(firebaseUser);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const signup = async (email, password, displayName) => {
    setError(null);
    try {
      const newUser = await authSignup(email, password, displayName);
      setUser(newUser);
      return newUser;
    } catch (err) {
      setError(err.message || "Signup failed");
      throw err;
    }
  };

  const login = async (email, password) => {
    setError(null);
    try {
      const loggedInUser = await authLogin(email, password);
      setUser(loggedInUser);
      return loggedInUser;
    } catch (err) {
      setError(err.message || "Login failed");
      throw err;
    }
  };

  const loginWithGoogle = async () => {
    setError(null);
    try {
      const googleUser = await authLoginWithGoogle();
      setUser(googleUser);
      return googleUser;
    } catch (err) {
      setError(err.message || "Google login failed");
      throw err;
    }
  };

  const logout = async () => {
    setError(null);
    try {
      await authLogout();
      setUser(null);
    } catch (err) {
      setError(err.message || "Logout failed");
      throw err;
    }
  };

  const value = {
    user,
    loading,
    error,
    isAuthenticated: !!user,
    signup,
    login,
    loginWithGoogle,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuthContext() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuthContext must be used within an AuthProvider");
  }
  return ctx;
}

export default AuthContext;
