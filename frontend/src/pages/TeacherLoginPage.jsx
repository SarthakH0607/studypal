/**
 * TeacherLoginPage — Instructor Portal Login.
 * Authenticates by Teacher ID and Class Cohort ID.
 */
import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { BookOpenCheck, ShieldAlert, ArrowRight, GraduationCap, Users } from 'lucide-react';
import Button from '../components/ui/Button';
import { api } from '../lib/api';
import toast from 'react-hot-toast';
import './TeacherLoginPage.css';

export default function TeacherLoginPage() {
  const [teacherId, setTeacherId] = useState('TCH-100');
  const [classId, setClassId] = useState('CLS-9A');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleTeacherLogin = async (e) => {
    e.preventDefault();
    if (!teacherId.trim() || !classId.trim()) {
      toast.error('Please enter both Teacher ID and Class ID.');
      return;
    }

    setLoading(true);
    try {
      const res = await api.loginTeacher(teacherId, classId);
      localStorage.setItem('studypal_teacher_session', JSON.stringify(res));
      toast.success(`Welcome Instructor! Loaded Class ${classId}`);
      navigate('/teacher-portal');
    } catch (err) {
      toast.error(err.message || 'Teacher login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="teacher-login-page">
      <div className="teacher-login-card animate-fade-in-up">
        
        {/* Header */}
        <div className="teacher-login-header">
          <div className="teacher-login-logo">
            <BookOpenCheck size={30} color="#FFFFFF" />
          </div>
          <h2>Teacher & Educator Portal</h2>
          <p>Access cohort mastery rosters, automated gap detection alerts, and student intervention tools.</p>
        </div>

        {/* Notice Badge */}
        <div className="teacher-notice-badge">
          <ShieldAlert size={16} color="#2F5FD9" />
          <span>Active Flagging & Intervention Engine</span>
        </div>

        {/* Form */}
        <form className="teacher-login-form" onSubmit={handleTeacherLogin}>
          <div className="form-group">
            <label className="label">Teacher ID / Staff ID</label>
            <input
              type="text"
              className="input"
              placeholder="e.g. TCH-100 or PROF-229"
              value={teacherId}
              onChange={(e) => setTeacherId(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="label">Class / Cohort ID</label>
            <input
              type="text"
              className="input"
              placeholder="e.g. CLS-9A or STEM-ALPHA"
              value={classId}
              onChange={(e) => setClassId(e.target.value)}
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
            Access Class Roster <ArrowRight size={18} />
          </Button>
        </form>

        {/* Switch to Student or Parent */}
        <div className="teacher-login-footer">
          <p>Other Portals:</p>
          <div className="portal-switch-links">
            <Link to="/login" className="switch-link">
              <GraduationCap size={15} /> Student Login
            </Link>
            <span>•</span>
            <Link to="/parent-login" className="switch-link">
              <Users size={15} /> Parent Login
            </Link>
          </div>
        </div>

      </div>
    </div>
  );
}
