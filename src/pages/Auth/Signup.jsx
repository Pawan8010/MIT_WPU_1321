/**
 * Signup page — create account with email/password.
 */
import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuthContext } from "../../context/AuthContext";
import toast from "react-hot-toast";
import {
  UserPlus, Mail, Lock, AlertCircle, Activity, User, Eye, EyeOff
} from "lucide-react";
import "./AuthPages.css";

export default function Signup() {
  const navigate = useNavigate();
  const { signup, loginWithGoogle } = useAuthContext();
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password || !confirmPw) {
      setError("Please fill in all fields");
      return;
    }
    if (password !== confirmPw) {
      setError("Passwords do not match");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }
    setError("");
    setSubmitting(true);
    try {
      await signup(email, password, displayName);
      toast.success("Account created successfully!");
      navigate("/dashboard");
    } catch (err) {
      const msg =
        err?.code === "auth/email-already-in-use" ? "Email is already registered" :
        err?.code === "auth/weak-password" ? "Password must be at least 6 characters" :
        err?.code === "auth/invalid-email" ? "Invalid email address" :
        err?.message || "Signup failed";
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
        setError(err?.message || "Google signup failed");
      }
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-bg-effects">
        <div className="auth-gradient-1" />
        <div className="auth-gradient-2" />
      </div>

      <div className="auth-container">
        <div className="auth-brand" onClick={() => navigate("/")}>
          <div className="auth-logo"><Activity size={22} /></div>
          <span>GoldenHour</span>
        </div>

        <div className="auth-card">
          <h2>Create Account</h2>
          <p className="auth-subtitle">Register to access the emergency triage system</p>

          {error && (
            <div className="auth-error">
              <AlertCircle size={14} />
              <span>{error}</span>
            </div>
          )}

          {/* Google Signup */}
          <button type="button" className="btn-google" onClick={handleGoogle}>
            <svg width="18" height="18" viewBox="0 0 48 48">
              <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
              <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
              <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
              <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
            </svg>
            Continue with Google
          </button>

          <div className="auth-divider"><span>or sign up with email</span></div>

          <form onSubmit={handleSubmit}>
            <div className="auth-field">
              <label htmlFor="signup-name">
                <User size={14} /> Full Name
              </label>
              <input
                id="signup-name"
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Dr. John Doe"
                autoComplete="name"
              />
            </div>

            <div className="auth-field">
              <label htmlFor="signup-email">
                <Mail size={14} /> Email Address
              </label>
              <input
                id="signup-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="emt@hospital.org"
                required
                autoComplete="email"
              />
            </div>

            <div className="auth-field">
              <label htmlFor="signup-password">
                <Lock size={14} /> Password
              </label>
              <div className="pw-input-wrap">
                <input
                  id="signup-password"
                  type={showPw ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Min. 6 characters"
                  required
                  minLength={6}
                  autoComplete="new-password"
                />
                <button type="button" className="pw-toggle" onClick={() => setShowPw(!showPw)}>
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div className="auth-field">
              <label htmlFor="signup-confirm">
                <Lock size={14} /> Confirm Password
              </label>
              <input
                id="signup-confirm"
                type="password"
                value={confirmPw}
                onChange={(e) => setConfirmPw(e.target.value)}
                placeholder="••••••••"
                required
                minLength={6}
                autoComplete="new-password"
              />
            </div>

            <button type="submit" className="btn-auth-primary" disabled={submitting}>
              {submitting ? (
                <><span className="btn-spinner" /> Creating Account...</>
              ) : (
                <><UserPlus size={16} /> Create Account</>
              )}
            </button>
          </form>

          <p className="auth-toggle">
            Already have an account?{" "}
            <Link to="/login">Sign In</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
