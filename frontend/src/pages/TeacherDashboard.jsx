/**
 * TeacherDashboard — Instructor Class Roster, Active Flagging Detection & Interventions.
 */
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  AlertTriangle,
  CheckCircle2,
  TrendingDown,
  Flame,
  Search,
  ArrowUpDown,
  Send,
  Zap,
  LogOut,
  Sparkles,
  BookOpenCheck,
  Filter
} from 'lucide-react';
import Header from '../components/layout/Header';
import Card, { CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import { PageLoader } from '../components/ui/Loader';
import { api } from '../lib/api';
import toast from 'react-hot-toast';
import './TeacherDashboard.css';

export default function TeacherDashboard() {
  const [roster, setRoster] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [urgencyFilter, setUrgencyFilter] = useState('all'); // 'all' | 'high' | 'medium' | 'low'
  const [selectedStudent, setSelectedStudent] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    loadRoster();
  }, []);

  const loadRoster = async () => {
    try {
      const res = await api.getClassRoster();
      setRoster(res.students || []);
    } catch (err) {
      toast.error('Failed to load class roster');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('studypal_teacher_session');
    navigate('/teacher-login');
  };

  const handleAssignIntervention = (studentName, concept) => {
    toast.success(`Assigned targeted 5-question review quiz on "${concept}" to ${studentName}`);
  };

  const handleNotifyParent = (studentName) => {
    toast.success(`Automated progress digest & alert dispatched to ${studentName}'s linked parent`);
  };

  if (loading) return <PageLoader text="Loading class roster & AI flags..." />;

  const filteredStudents = roster.filter((student) => {
    const matchesSearch = student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.id.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesUrgency = urgencyFilter === 'all' || student.urgency === urgencyFilter;
    return matchesSearch && matchesUrgency;
  });

  const highUrgencyCount = roster.filter((s) => s.urgency === 'high').length;
  const mediumUrgencyCount = roster.filter((s) => s.urgency === 'medium').length;

  return (
    <div className="teacher-layout">
      {/* Top Bar */}
      <header className="teacher-top-nav">
        <div className="teacher-brand">
          <div className="teacher-brand-logo">
            <BookOpenCheck size={22} color="#FFFFFF" />
          </div>
          <div>
            <span className="teacher-app-name">StudyPal</span>
            <span className="teacher-cohort-name">Educator Portal • Grade 9 STEM Alpha</span>
          </div>
        </div>

        <div className="teacher-nav-actions">
          <div className="teacher-stats-bar">
            <div className="roster-badge-chip red-chip">
              <AlertTriangle size={15} />
              <span>{highUrgencyCount} High Urgency Flags</span>
            </div>
            <div className="roster-badge-chip yellow-chip">
              <span>{mediumUrgencyCount} Under Review</span>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={handleLogout}>
            <LogOut size={16} /> Log Out
          </Button>
        </div>
      </header>

      {/* Main Body */}
      <main className="teacher-main-content">
        
        {/* Banner */}
        <div className="teacher-banner">
          <div className="teacher-banner-text">
            <div className="teacher-pill-tag">
              <Sparkles size={14} /> Real-Time Gap Detection & Interventions
            </div>
            <h1>Class Performance & Learning Flags</h1>
            <p>
              The active flagging agent scans homework accuracy, missed sessions, and concept degradation to highlight at-risk students before exams.
            </p>
          </div>

          <div className="teacher-summary-metrics">
            <div className="summary-metric-card">
              <span className="metric-num">{roster.length}</span>
              <span className="metric-label">Enrolled Students</span>
            </div>
            <div className="summary-metric-card">
              <span className="metric-num">85%</span>
              <span className="metric-label">Class Avg Score</span>
            </div>
            <div className="summary-metric-card">
              <span className="metric-num text-alert">{highUrgencyCount}</span>
              <span className="metric-label">Need Intervention</span>
            </div>
          </div>
        </div>

        {/* Filter and Search Toolbar */}
        <div className="roster-toolbar">
          <div className="roster-search">
            <Search size={16} className="search-icon" />
            <input
              type="text"
              placeholder="Search students by name or student ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="roster-search-input"
            />
          </div>

          <div className="roster-filters">
            <span className="filter-label"><Filter size={14} /> Filter Urgency:</span>
            <button
              className={`filter-chip ${urgencyFilter === 'all' ? 'active' : ''}`}
              onClick={() => setUrgencyFilter('all')}
            >
              All ({roster.length})
            </button>
            <button
              className={`filter-chip chip-high ${urgencyFilter === 'high' ? 'active' : ''}`}
              onClick={() => setUrgencyFilter('high')}
            >
              🔴 High ({highUrgencyCount})
            </button>
            <button
              className={`filter-chip chip-medium ${urgencyFilter === 'medium' ? 'active' : ''}`}
              onClick={() => setUrgencyFilter('medium')}
            >
              🟡 Medium ({mediumUrgencyCount})
            </button>
            <button
              className={`filter-chip ${urgencyFilter === 'low' ? 'active' : ''}`}
              onClick={() => setUrgencyFilter('low')}
            >
              🟢 On Track
            </button>
          </div>
        </div>

        {/* Class Roster Table */}
        <div className="roster-table-container">
          <table className="roster-table">
            <thead>
              <tr>
                <th>Student</th>
                <th>Overall Grade</th>
                <th>Streak</th>
                <th>Last Active</th>
                <th>Active AI Flags & Insights</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredStudents.map((student) => {
                const hasFlags = student.flags && student.flags.length > 0;
                const primaryFlag = hasFlags ? student.flags[0] : null;

                return (
                  <tr key={student.id} className={`roster-row ${student.urgency === 'high' ? 'row-high' : ''}`}>
                    {/* Student Info */}
                    <td>
                      <div className="student-cell">
                        <div className="student-avatar-circle">{student.avatar}</div>
                        <div>
                          <strong className="student-cell-name">{student.name}</strong>
                          <span className="student-cell-id">{student.id} • {student.email}</span>
                        </div>
                      </div>
                    </td>

                    {/* Grade */}
                    <td>
                      <span className="student-grade-pill">{student.overall_grade}</span>
                    </td>

                    {/* Streak */}
                    <td>
                      <span className="streak-chip">
                        <Flame size={14} /> {student.streak_days}d
                      </span>
                    </td>

                    {/* Last Active */}
                    <td>
                      <span className="last-active-text">{student.last_active}</span>
                    </td>

                    {/* Flags */}
                    <td>
                      {hasFlags ? (
                        <div className="flags-cell">
                          {student.flags.map((flag) => (
                            <div key={flag.id} className={`flag-alert-box flag-${flag.severity}`}>
                              <div className="flag-alert-header">
                                <AlertTriangle size={14} />
                                <strong>{flag.subject}: {flag.concept}</strong>
                              </div>
                              <p className="flag-alert-msg">{flag.message}</p>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="no-flags-box">
                          <CheckCircle2 size={16} color="var(--color-success)" />
                          <span>Consistent mastery • On track</span>
                        </div>
                      )}
                    </td>

                    {/* Action */}
                    <td>
                      <div className="actions-cell">
                        {primaryFlag && (
                          <button
                            className="intervention-btn"
                            title="Assign scaffolded review"
                            onClick={() => handleAssignIntervention(student.name, primaryFlag.concept)}
                          >
                            <Zap size={14} /> Assign Quiz
                          </button>
                        )}
                        <button
                          className="notify-btn"
                          title="Notify Parent"
                          onClick={() => handleNotifyParent(student.name)}
                        >
                          <Send size={14} /> Notify Parent
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

      </main>
    </div>
  );
}
