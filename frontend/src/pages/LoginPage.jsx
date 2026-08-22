/**
 * LoginPage — Email + password login with premium dark design.
 */
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Sparkles, LogIn } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import Button from '../components/ui/Button';
import toast from 'react-hot-toast';
import './AuthPages.css';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) return;
    setLoading(true);
    try {
      await login(email, password);
      toast.success('Welcome back!');
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-bg-glow" />
      <div className="auth-container animate-fade-in-up">
        <div className="auth-header">
          <div className="auth-logo">
            <Sparkles size={28} />
          </div>
          <h1 className="auth-title">Welcome to StudyPal! 🌟</h1>
          <p className="auth-subtitle">Sign in to continue your learning adventure</p>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="auth-field">
            <label className="label">Email</label>
            <input
              className="input"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              autoFocus
            />
          </div>
          <div className="auth-field">
            <label className="label">Password</label>
            <input
              className="input"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
          </div>
          <Button type="submit" fullWidth loading={loading} icon={LogIn} size="lg">
            Sign In
          </Button>
        </form>

        <p className="auth-footer">
          Don't have an account? <Link to="/signup">Create one</Link>
        </p>

        <div className="auth-portal-switch">
          <span className="auth-portal-divider">Looking for other portals?</span>
          <div className="portal-links-group">
            <Link to="/teacher-login" className="portal-switch-pill">
              👩‍🏫 Teacher & Instructor Login
            </Link>
            <Link to="/parent-login" className="portal-switch-pill">
              👨‍👩‍👧 Parent Portal
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
