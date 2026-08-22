/**
 * LandingPage — StudyPal Public Home & Entry Point.
 * Displays hero, dual CTAs ("I'm a Student" & "I'm a Parent"), and feature highlights.
 */
import { useNavigate } from 'react-router-dom';
import { Sparkles, GraduationCap, Users, Bot, Calendar, TrendingUp, ShieldCheck, ArrowRight, Star, Flame, CheckCircle2 } from 'lucide-react';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import './LandingPage.css';

export default function LandingPage() {
  const navigate = useNavigate();

  const features = [
    {
      icon: Bot,
      color: '#2F5FD9',
      bgColor: '#EEF3FF',
      title: '24/7 AI Learning Buddy',
      description: 'Socratic dialogue, instant homework help, visual step-by-step problem breakdown, and native spoken audio tutor.',
    },
    {
      icon: Calendar,
      color: '#7C3AED',
      bgColor: '#F3EEFF',
      title: 'Adaptive Study Planner',
      description: 'Custom learning paths tailored to your grade, syllabus, and target goals with prerequisite mastery tracking.',
    },
    {
      icon: TrendingUp,
      color: '#22C55E',
      bgColor: '#EBFBF1',
      title: 'Gamified Progress & Mastery',
      description: 'Earn XP, level up your subject mastery rings, maintain your daily study streak, and ace practice quizzes.',
    },
    {
      icon: Users,
      color: '#F5A623',
      bgColor: '#FFF6E5',
      title: 'Real-Time Parent Reports',
      description: 'Linked parent portal with transparent study recaps, mastery breakdowns, strengths, and recommended focus areas.',
    },
  ];

  return (
    <div className="landing-page">
      {/* Navigation Bar */}
      <nav className="landing-nav">
        <div className="landing-nav-container">
          <div className="landing-logo">
            <div className="logo-badge">
              <Sparkles size={22} color="#FFFFFF" />
            </div>
            <span className="logo-text">StudyPal</span>
          </div>

          <div className="landing-nav-actions">
            <Button variant="ghost" size="md" onClick={() => navigate('/teacher-login')}>
              Teacher Portal
            </Button>
            <Button variant="ghost" size="md" onClick={() => navigate('/parent-login')}>
              Parent Portal
            </Button>
            <Button variant="primary" size="md" onClick={() => navigate('/login')}>
              Student Sign In
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="landing-hero">
        <div className="hero-content">
          <div className="hero-pill-badge">
            <Sparkles size={16} color="#F5A623" />
            <span>Next-Gen AI Learning Platform</span>
          </div>

          <h1 className="hero-main-title">
            Your Personal <span className="highlight-text">AI Learning Buddy</span> for Academic Mastery 🚀
          </h1>

          <p className="hero-description">
            StudyPal combines voice-enabled AI tutoring, adaptive curriculum paths, snap-and-learn homework solving, and transparent parent insights into one playful experience.
          </p>

          {/* Dual CTAs */}
          <div className="hero-cta-group">
            <div className="cta-card student-cta-card" onClick={() => navigate('/login')}>
              <div className="cta-icon-box blue-box">
                <GraduationCap size={28} />
              </div>
              <div className="cta-text">
                <h3>I'm a Student</h3>
                <p>Start learning, take quizzes & earn XP</p>
              </div>
              <Button variant="primary" size="lg" className="cta-btn">
                Enter Student Portal <ArrowRight size={18} />
              </Button>
            </div>

            <div className="cta-card parent-cta-card" onClick={() => navigate('/parent-login')}>
              <div className="cta-icon-box purple-box">
                <Users size={28} />
              </div>
              <div className="cta-text">
                <h3>I'm a Parent</h3>
                <p>Track progress, view reports & growth</p>
              </div>
              <Button variant="purple" size="lg" className="cta-btn">
                Enter Parent Portal <ArrowRight size={18} />
              </Button>
            </div>

            <div className="cta-card teacher-cta-card" onClick={() => navigate('/teacher-login')}>
              <div className="cta-icon-box gold-box">
                <ShieldCheck size={28} />
              </div>
              <div className="cta-text">
                <h3>I'm an Educator</h3>
                <p>Cohort roster, gap flags & interventions</p>
              </div>
              <Button variant="gold" size="lg" className="cta-btn">
                Enter Teacher Portal <ArrowRight size={18} />
              </Button>
            </div>
          </div>

          {/* Trust points */}
          <div className="hero-trust-bar">
            <div className="trust-item">
              <CheckCircle2 size={18} color="#22C55E" />
              <span>Voice & Vision AI</span>
            </div>
            <div className="trust-item">
              <CheckCircle2 size={18} color="#22C55E" />
              <span>Adaptive Curriculum</span>
            </div>
            <div className="trust-item">
              <CheckCircle2 size={18} color="#22C55E" />
              <span>Safe & COPPA Compliant</span>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Highlights Grid */}
      <section className="landing-features">
        <div className="features-container">
          <div className="features-header">
            <span className="section-tag">Powerful AI Features</span>
            <h2>Everything you need to learn faster and smarter</h2>
            <p>Designed for curiosity, built for measurable academic excellence.</p>
          </div>

          <div className="features-grid">
            {features.map((f, i) => (
              <div key={i} className="feature-card animate-fade-in-up" style={{ animationDelay: `${i * 100}ms` }}>
                <div className="feature-icon" style={{ background: f.bgColor, color: f.color }}>
                  <f.icon size={26} />
                </div>
                <h3>{f.title}</h3>
                <p>{f.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Gamification Callout Banner */}
      <section className="gamification-banner-section">
        <div className="gamification-banner">
          <div className="banner-left">
            <div className="banner-badges">
              <span className="streak-chip"><Flame size={16} /> Daily Streaks</span>
              <span className="xp-chip"><Star size={16} /> Earn XP & Badges</span>
            </div>
            <h2>Learning that actually feels like a rewarding game.</h2>
            <p>Every topic mastered and quiz completed adds to your student's mastery tree and unlocks next-level achievements.</p>
          </div>
          <div className="banner-right">
            <Button variant="gold" size="lg" onClick={() => navigate('/signup')}>
              Create Free Account 🌟
            </Button>
          </div>
        </div>
      </section>

      {/* Simple Footer */}
      <footer className="landing-footer">
        <div className="footer-container">
          <div className="footer-brand">
            <div className="logo-badge logo-badge-sm">
              <Sparkles size={16} color="#FFFFFF" />
            </div>
            <span className="footer-logo-text">StudyPal</span>
          </div>
          <p className="footer-copyright">
            © {new Date().getFullYear()} StudyPal Inc. All rights reserved. Scholarly intelligence made fun.
          </p>
          <div className="footer-links">
            <a href="#privacy">Privacy</a>
            <a href="#terms">Terms</a>
            <a href="#help">Help Center</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
