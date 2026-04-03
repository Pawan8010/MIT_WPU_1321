/**
 * Login page — authentication for the Golden-Hour Triage system.
 * Supports login and signup with email + password.
 */
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import toast from "react-hot-toast";
import { Shield, LogIn, UserPlus, Mail, Lock, AlertCircle, Activity } from "lucide-react";
import "./Login.css";

export default function Login() {
  const navigate = useNavigate();
  const { login, signup, loading } = useAuth();
  const [isSignup, setIsSignup] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      if (isSignup) {
        await signup(email, password, displayName);
        toast.success("Account created successfully!");
      } else {
        await login(email, password);
        toast.success("Welcome back!");
      }
      navigate("/dashboard");
    } catch (err) {
      const msg = err?.code === "auth/user-not-found"
        ? "No account found with this email"
        : err?.code === "auth/wrong-password"
        ? "Incorrect password"
        : err?.code === "auth/email-already-in-use"
        ? "Email already registered"
        : err?.code === "auth/weak-password"
        ? "Password must be at least 6 characters"
        : err?.message || "Authentication failed";
      setError(msg);
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  // Demo login — bypasses Firebase for testing
  const handleDemoLogin = () => {
    // Store a demo flag in sessionStorage
    sessionStorage.setItem("gh_demo_user", JSON.stringify({
      uid: "demo-user",
      email: "emt@goldenhour.health",
      displayName: "Demo EMT",
    }));
    toast.success("Logged in as Demo EMT");
    navigate("/dashboard");
    // Force page reload so AuthProvider picks up demo user
    window.location.reload();
  };

  return (
    <div className="login-page">
      <div className="login-bg-pattern" />

      <div className="login-container">
        {/* Left branding panel */}
        <div className="login-brand">
          <div className="brand-content">
            <div className="brand-icon">
              <Activity size={40} />
            </div>
            <h1>GoldenHour</h1>
            <p className="brand-tagline">
              Emergency Triage &amp; Smart Hospital Routing
            </p>
            <div className="brand-features">
              <div className="brand-feature">
                <Shield size={16} />
                <span>AI-Powered Severity Prediction</span>
              </div>
              <div className="brand-feature">
                <Activity size={16} />
                <span>Real-time Hospital Routing</span>
              </div>
              <div className="brand-feature">
                <LogIn size={16} />
                <span>Secure EMT Authentication</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right form panel */}
        <div className="login-form-panel">
          <form className="login-form" onSubmit={handleSubmit}>
            <h2>{isSignup ? "Create Account" : "Sign In"}</h2>
            <p className="login-subtitle">
              {isSignup
                ? "Register to access the triage system"
                : "Access the emergency triage dashboard"}
            </p>

            {error && (
              <div className="login-error">
                <AlertCircle size={14} />
                <span>{error}</span>
              </div>
            )}

            {isSignup && (
              <div className="form-field">
                <label htmlFor="displayName">
                  <UserPlus size={14} />
                  Full Name
                </label>
                <input
                  id="displayName"
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Dr. John Doe"
                  className="input"
                />
              </div>
            )}

            <div className="form-field">
              <label htmlFor="email">
                <Mail size={14} />
                Email Address
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="emt@hospital.org"
                required
                className="input"
              />
            </div>

            <div className="form-field">
              <label htmlFor="password">
                <Lock size={14} />
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                minLength={6}
                className="input"
              />
            </div>

            <button
              type="submit"
              className="btn btn-primary btn-lg login-btn"
              disabled={submitting}
            >
              {submitting ? (
                <><span className="btn-spinner" /> Processing...</>
              ) : isSignup ? (
                <><UserPlus size={16} /> Create Account</>
              ) : (
                <><LogIn size={16} /> Sign In</>
              )}
            </button>

            <div className="login-divider">
              <span>or</span>
            </div>

            <button
              type="button"
              className="btn btn-outline login-demo-btn"
              onClick={handleDemoLogin}
            >
              <Activity size={16} /> Continue as Demo EMT
            </button>

            <p className="login-toggle">
              {isSignup ? "Already have an account?" : "Don't have an account?"}{" "}
              <button type="button" onClick={() => { setIsSignup(!isSignup); setError(""); }}>
                {isSignup ? "Sign In" : "Create Account"}
              </button>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
