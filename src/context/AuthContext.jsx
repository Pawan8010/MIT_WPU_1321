/**
 * AuthContext — provides authentication state globally.
 * Connects to Firebase Auth (Ignisia project) with demo fallback.
 */
import { createContext, useContext, useState, useEffect, useCallback } from "react";
import {
  signup as firebaseSignup,
  login as firebaseLogin,
  loginWithGoogle as firebaseLoginWithGoogle,
  logout as firebaseLogout,
  onAuthChange,
} from "../services/auth";

const AuthContext = createContext(null);

/**
 * AuthProvider wraps the app and exposes user state + auth methods.
 */
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Listen to Firebase auth state changes
  useEffect(() => {
    const unsubscribe = onAuthChange((firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);
      } else {
        // Check for demo session
        const demoUser = sessionStorage.getItem("gh_demo_user");
        setUser(demoUser ? JSON.parse(demoUser) : null);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Signup
  const signup = useCallback(async (email, password, displayName) => {
    const u = await firebaseSignup(email, password, displayName);
    setUser(u);
    return u;
  }, []);

  // Email/password login
  const login = useCallback(async (email, password) => {
    const u = await firebaseLogin(email, password);
    setUser(u);
    return u;
  }, []);

  // Google OAuth login
  const loginWithGoogle = useCallback(async () => {
    const u = await firebaseLoginWithGoogle();
    setUser(u);
    return u;
  }, []);

  // Logout
  const logout = useCallback(async () => {
    await firebaseLogout();
    sessionStorage.removeItem("gh_demo_user");
    setUser(null);
  }, []);

  const value = {
    user,
    loading,
    signup,
    login,
    loginWithGoogle,
    logout,
    isAuthenticated: !!user,
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
