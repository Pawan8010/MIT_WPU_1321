/**
 * Landing Page — public homepage for the Golden-Hour Triage system.
 */
import { useNavigate } from "react-router-dom";
import {
  Activity, Brain, Building2, ArrowRight, Shield, Zap, Clock,
  Heart, MapPin, ChevronRight, Star, Users, CheckCircle
} from "lucide-react";
import "./LandingPage.css";

const FEATURES = [
  {
    icon: Brain,
    title: "AI Severity Prediction",
    desc: "Advanced machine learning models analyze patient vitals in real-time to predict severity level with over 92% accuracy.",
    color: "#7C3AED",
  },
  {
    icon: Building2,
    title: "Smart Hospital Routing",
    desc: "Intelligent routing engine selects the optimal hospital based on distance, capacity, specialty availability, and patient needs.",
    color: "#2563EB",
  },
  {
    icon: Clock,
    title: "Real-time Decision Support",
    desc: "Live dashboards and XAI panels provide transparent, explainable insights to support critical EMT decisions during the golden hour.",
    color: "#059669",
  },
];

const STEPS = [
  {
    num: "01",
    title: "Enter Patient Data",
    desc: "EMTs fill in the comprehensive triage form — vitals, ABCDE assessment, trauma details, and clinical observations.",
    icon: Users,
  },
  {
    num: "02",
    title: "AI Predicts Severity",
    desc: "Our Gradient Boosting model processes the data and returns a severity prediction, confidence score, and resource requirements.",
    icon: Brain,
  },
  {
    num: "03",
    title: "System Selects Best Hospital",
    desc: "The routing engine ranks nearby hospitals by score and recommends the optimal destination — optimizing for patient survival.",
    icon: MapPin,
  },
];

const STATS = [
  { value: "2,741+", label: "Patients Triaged" },
  { value: "92%", label: "Prediction Accuracy" },
  { value: "8.4 min", label: "Avg Response Time" },
  { value: "5", label: "Hospital Network" },
];

export default function LandingPage() {
  const navigate = useNavigate();

  return (
    <div className="landing-page">
      {/* ═══ Navbar ═══ */}
      <nav className="landing-nav">
        <div className="nav-inner">
          <div className="nav-brand" onClick={() => navigate("/")}>
            <div className="nav-logo">
              <Activity size={22} />
            </div>
            <span className="nav-title">GoldenHour</span>
          </div>
          <div className="nav-links">
            <a href="#features">Features</a>
            <a href="#how-it-works">How It Works</a>
            <a href="#stats">Impact</a>
          </div>
          <div className="nav-actions">
            <button className="btn-nav-outline" onClick={() => navigate("/login")}>
              Log In
            </button>
            <button className="btn-nav-primary" onClick={() => navigate("/signup")}>
              Get Started <ArrowRight size={14} />
            </button>
          </div>
        </div>
      </nav>

      {/* ═══ Hero Section ═══ */}
      <section className="hero">
        <div className="hero-bg-effects">
          <div className="hero-gradient-1" />
          <div className="hero-gradient-2" />
          <div className="hero-grid-overlay" />
        </div>

        <div className="hero-content">
          <div className="hero-badge">
            <Zap size={14} />
            <span>AI-Powered Emergency Triage</span>
          </div>
          <h1 className="hero-title">
            Golden-Hour<br />
            <span className="hero-highlight">Emergency Triage</span> System
          </h1>
          <p className="hero-subtitle">
            Saving lives with AI-powered severity prediction and intelligent hospital routing.
            Every second counts — our system ensures patients reach the right hospital, at the right time.
          </p>
          <div className="hero-cta">
            <button className="btn-hero-primary" onClick={() => navigate("/signup")}>
              Get Started <ArrowRight size={16} />
            </button>
            <button className="btn-hero-outline" onClick={() => navigate("/login")}>
              <Shield size={16} /> Log In
            </button>
          </div>
          <div className="hero-trust">
            <div className="trust-avatars">
              {[1,2,3,4].map(i => (
                <div key={i} className="trust-avatar" style={{ animationDelay: `${i * 0.1}s` }}>
                  <Users size={14} />
                </div>
              ))}
            </div>
            <span className="trust-text">Trusted by <strong>50+ EMT teams</strong> across the network</span>
          </div>
        </div>

        <div className="hero-visual">
          <div className="hero-card-preview">
            <div className="preview-header">
              <div className="preview-dot red" />
              <div className="preview-dot yellow" />
              <div className="preview-dot green" />
              <span>Triage Dashboard</span>
            </div>
            <div className="preview-body">
              <div className="preview-stat-row">
                <div className="preview-stat">
                  <Heart size={16} className="preview-icon red-icon" />
                  <div>
                    <span className="preview-stat-val">23</span>
                    <span className="preview-stat-lbl">Critical</span>
                  </div>
                </div>
                <div className="preview-stat">
                  <Activity size={16} className="preview-icon blue-icon" />
                  <div>
                    <span className="preview-stat-val">2,741</span>
                    <span className="preview-stat-lbl">Triaged</span>
                  </div>
                </div>
                <div className="preview-stat">
                  <Building2 size={16} className="preview-icon green-icon" />
                  <div>
                    <span className="preview-stat-val">4</span>
                    <span className="preview-stat-lbl">Hospitals</span>
                  </div>
                </div>
              </div>
              <div className="preview-severity-bars">
                <div className="sev-bar"><span className="sev-label">RED</span><div className="sev-fill red-fill" style={{width:'75%'}}/></div>
                <div className="sev-bar"><span className="sev-label">ORANGE</span><div className="sev-fill orange-fill" style={{width:'55%'}}/></div>
                <div className="sev-bar"><span className="sev-label">YELLOW</span><div className="sev-fill yellow-fill" style={{width:'40%'}}/></div>
                <div className="sev-bar"><span className="sev-label">GREEN</span><div className="sev-fill green-fill" style={{width:'85%'}}/></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ Stats Section ═══ */}
      <section className="stats-section" id="stats">
        <div className="stats-grid">
          {STATS.map((s, i) => (
            <div key={i} className="stat-card" style={{ animationDelay: `${i * 0.1}s` }}>
              <span className="stat-value">{s.value}</span>
              <span className="stat-label">{s.label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ═══ Features Section ═══ */}
      <section className="features-section" id="features">
        <div className="section-inner">
          <div className="section-header">
            <span className="section-tag"><Star size={12} /> Core Capabilities</span>
            <h2 className="section-title">Powered by Intelligence</h2>
            <p className="section-subtitle">
              Our system combines cutting-edge machine learning with real-time hospital data
              to deliver life-saving decisions in seconds.
            </p>
          </div>
          <div className="features-grid">
            {FEATURES.map((f, i) => (
              <div key={i} className="feature-card" style={{ animationDelay: `${i * 0.1}s` }}>
                <div className="feature-icon" style={{ background: `${f.color}14`, color: f.color }}>
                  <f.icon size={28} />
                </div>
                <h3>{f.title}</h3>
                <p>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ How It Works ═══ */}
      <section className="how-section" id="how-it-works">
        <div className="section-inner">
          <div className="section-header">
            <span className="section-tag"><Zap size={12} /> Workflow</span>
            <h2 className="section-title">How It Works</h2>
            <p className="section-subtitle">
              Three simple steps — from patient data entry to the optimal hospital destination.
            </p>
          </div>
          <div className="steps-grid">
            {STEPS.map((step, i) => (
              <div key={i} className="step-card" style={{ animationDelay: `${i * 0.15}s` }}>
                <div className="step-num">{step.num}</div>
                <div className="step-icon-wrap">
                  <step.icon size={24} />
                </div>
                <h3>{step.title}</h3>
                <p>{step.desc}</p>
                {i < STEPS.length - 1 && (
                  <div className="step-connector">
                    <ChevronRight size={20} />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ CTA Section ═══ */}
      <section className="cta-section">
        <div className="cta-inner">
          <div className="cta-glow" />
          <h2>Ready to Save Lives?</h2>
          <p>Join the emergency response network and start making data-driven triage decisions today.</p>
          <div className="cta-actions">
            <button className="btn-hero-primary" onClick={() => navigate("/signup")}>
              <Zap size={16} /> Create Free Account
            </button>
            <button className="btn-hero-outline" onClick={() => navigate("/login")}>
              Log In <ArrowRight size={14} />
            </button>
          </div>
        </div>
      </section>

      {/* ═══ Footer ═══ */}
      <footer className="landing-footer">
        <div className="footer-inner">
          <div className="footer-brand">
            <div className="nav-logo"><Activity size={18} /></div>
            <span>GoldenHour</span>
            <p className="footer-desc">
              AI-powered emergency triage and smart hospital routing, designed to optimize the
              critical golden hour of emergency response.
            </p>
          </div>
          <div className="footer-links-grid">
            <div className="footer-col">
              <h4>Platform</h4>
              <a href="#features">Features</a>
              <a href="#how-it-works">How It Works</a>
              <a href="#stats">Impact</a>
            </div>
            <div className="footer-col">
              <h4>Resources</h4>
              <a href="#">Documentation</a>
              <a href="#">API Reference</a>
              <a href="#">Support</a>
            </div>
            <div className="footer-col">
              <h4>Contact</h4>
              <a href="mailto:support@goldenhour.health">support@goldenhour.health</a>
              <a href="#">Privacy Policy</a>
              <a href="#">Terms of Service</a>
            </div>
          </div>
        </div>
        <div className="footer-bottom">
          <span>© 2026 GoldenHour Triage System. All rights reserved.</span>
        </div>
      </footer>
    </div>
  );
}
