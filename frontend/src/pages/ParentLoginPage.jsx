/**
 * ParentLoginPage — Dual Login flow for Parents.
 * Authenticates by Parent ID and linked Student ID.
 */
import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Users, ShieldCheck, ArrowRight, Sparkles, GraduationCap } from 'lucide-react';
import Button from '../components/ui/Button';
import { api } from '../lib/api';
import toast from 'react-hot-toast';
import './ParentLoginPage.css';

export default function ParentLoginPage() {
  const [parentId, setParentId] = useState('');
  const [studentId, setStudentId] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleParentLogin = async (e) => {
    e.preventDefault();
    if (!parentId.trim() || !studentId.trim()) {
      toast.error('Please enter both Parent ID and Student ID.');
      return;
    }

    setLoading(true);
    try {
      const res = await api.loginParent(parentId, studentId);
      // Store temporary parent session in localStorage for Parent Portal
      localStorage.setItem('studypal_parent_session', JSON.stringify(res));
      toast.success(`Welcome! Connected to Student #${studentId}`);
      navigate('/parent-portal');
    } catch (err) {
      toast.error(err.message || 'Parent login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="parent-login-page">
      <div className="parent-login-card animate-fade-in-up">
        
        {/* Header */}
        <div className="parent-login-header">
          <div className="parent-login-logo">
            <Users size={30} color="#FFFFFF" />
          </div>
          <h2>Parent Portal Login</h2>
          <p>Access transparent study insights, exam recaps & mastery tracking for your child.</p>
        </div>

        {/* Notice Badge */}
        <div className="parent-notice-badge">
          <ShieldCheck size={16} color="#7C3AED" />
          <span>Parent-Student Linked Access</span>
        </div>

        {/* Form */}
        <form className="parent-login-form" onSubmit={handleParentLogin}>
          <div className="form-group">
            <label className="label">Parent ID / Phone</label>
            <input
              type="text"
              className="input"
              placeholder="e.g. PAR-88219 or (555) 019-2834"
              value={parentId}
              onChange={(e) => setParentId(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="label">Linked Student ID / Student Email</label>
            <input
              type="text"
              className="input"
              placeholder="e.g. STU-44021 or alex@school.edu"
              value={studentId}
              onChange={(e) => setStudentId(e.target.value)}
              required
            />
          </div>

          <Button
            type="submit"
            variant="primary"
            size="lg"
            className="btn-full"
            loading={loading}
          >
            Access Parent Portal <ArrowRight size={18} />
          </Button>
        </form>

        {/* Switch to Student Login */}
        <div className="parent-login-footer">
          <p>Are you a student?</p>
          <Link to="/login" className="switch-login-link">
            <GraduationCap size={16} /> Switch to Student Login
          </Link>
        </div>

      </div>
    </div>
  );
}
