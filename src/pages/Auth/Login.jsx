/**
 * Login page — email/password + Google login.
 */
import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuthContext } from "../../context/AuthContext";
import toast from "react-hot-toast";
import {
  LogIn, Mail, Lock, AlertCircle, Activity, Eye, EyeOff
} from "lucide-react";
import "./AuthPages.css";

export default function Login() {
  const navigate = useNavigate();
  const { login, loginWithGoogle } = useAuthContext();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setError("Please fill in all fields");
      return;
    }
    setError("");
    setSubmitting(true);
    try {
      await login(email, password);
      toast.success("Welcome back!");
      navigate("/dashboard");
    } catch (err) {
      const msg =
        err?.code === "auth/user-not-found" ? "No account found with this email" :
        err?.code === "auth/wrong-password" ? "Incorrect password" :
        err?.code === "auth/invalid-credential" ? "Invalid email or password" :
        err?.message || "Login failed";
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleGoogle = async () => {
    setError("");
    try {
      await loginWithGoogle();
      toast.success("Welcome!");
      navigate("/dashboard");
    } catch (err) {
      if (err?.code !== "auth/popup-closed-by-user") {
        setError(err?.message || "Google login failed");
      }
    }
  };

  const handleDemoLogin = () => {
    sessionStorage.setItem("gh_demo_user", JSON.stringify({
      uid: "demo-user",
      email: "emt@goldenhour.health",
      displayName: "Demo EMT",
    }));
    toast.success("Logged in as Demo EMT");
    navigate("/dashboard");
    window.location.reload();
  };

  return (
    <div className="auth-page">
      <div className="auth-bg-effects">
        <div className="auth-gradient-1" />
        <div className="auth-gradient-2" />
      </div>

      <div className="auth-container">
        {/* Brand Header */}
        <div className="auth-brand" onClick={() => navigate("/")}>
          <div className="auth-logo"><Activity size={22} /></div>
          <span>GoldenHour</span>
        </div>

        <div className="auth-card">
          <h2>Welcome Back</h2>
          <p className="auth-subtitle">Sign in to access the emergency triage dashboard</p>

          {error && (
            <div className="auth-error">
              <AlertCircle size={14} />
              <span>{error}</span>
            </div>
          )}

          {/* Google Login */}
          <button type="button" className="btn-google" onClick={handleGoogle}>
            <svg width="18" height="18" viewBox="0 0 48 48">
              <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
              <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
              <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
              <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
            </svg>
            Continue with Google
          </button>

          <div className="auth-divider"><span>or sign in with email</span></div>

          {/* Email Login Form */}
          <form onSubmit={handleSubmit}>
            <div className="auth-field">
              <label htmlFor="login-email">
                <Mail size={14} /> Email Address
              </label>
              <input
                id="login-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="emt@hospital.org"
                required
                autoComplete="email"
              />
            </div>

            <div className="auth-field">
              <label htmlFor="login-password">
                <Lock size={14} /> Password
              </label>
              <div className="pw-input-wrap">
                <input
                  id="login-password"
                  type={showPw ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  minLength={6}
                  autoComplete="current-password"
                />
                <button type="button" className="pw-toggle" onClick={() => setShowPw(!showPw)}>
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button type="submit" className="btn-auth-primary" disabled={submitting}>
              {submitting ? (
                <><span className="btn-spinner" /> Signing In...</>
              ) : (
                <><LogIn size={16} /> Sign In</>
              )}
            </button>
          </form>

          <div className="auth-divider"><span>or</span></div>

          <button type="button" className="btn-auth-demo" onClick={handleDemoLogin}>
            <Activity size={16} /> Continue as Demo EMT
          </button>

          <p className="auth-toggle">
            Don't have an account?{" "}
            <Link to="/signup">Create Account</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
