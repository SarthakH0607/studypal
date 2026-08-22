/**
 * ParentPortalPage — Comprehensive Parent Dashboard.
 * Displays linked student's progress, subject mastery meters, activity log, performance breakdowns & settings.
 */
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Activity,
  BarChart3,
  Settings,
  Sparkles,
  Users,
  Award,
  Flame,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  Clock,
  LogOut,
  Calendar,
  BookOpen
} from 'lucide-react';
import Card, { CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import { api } from '../lib/api';
import './ParentPortalPage.css';

export default function ParentPortalPage() {
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'activity' | 'performance' | 'settings'
  const [parentSession, setParentSession] = useState(null);
  const [studentStats, setStudentStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const [studentFlags, setStudentFlags] = useState([]);

  useEffect(() => {
    // Load parent session from storage
    const rawSession = localStorage.getItem('studypal_parent_session');
    if (rawSession) {
      try {
        setParentSession(JSON.parse(rawSession));
      } catch (e) {}
    }

    // Load linked student data & active flags
    const load = async () => {
      try {
        const [res, flagsRes] = await Promise.all([
          api.getDashboardOverview().catch(() => null),
          api.getStudentFlags().catch(() => ({ flags: [] })),
        ]);
        setStudentStats(res?.stats || {
          total_paths: 3,
          completed_topics: 18,
          total_topics: 24,
          mastery_percentage: 75,
          average_score: 88,
          total_exams: 6,
        });
        setStudentFlags(flagsRes.flags || []);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('studypal_parent_session');
    navigate('/parent-login');
  };

  const studentName = "Sarah Jenkins";
  const studentId = parentSession?.student_id || "STU-44021";

  const subjectMastery = [
    { subject: 'Algebra & Functions', progress: 84, grade: 'A', status: 'Mastered', color: '#2F5FD9' },
    { subject: 'Cellular Biology', progress: 92, grade: 'A+', status: 'Mastered', color: '#22C55E' },
    { subject: 'World History (1900-1945)', progress: 68, grade: 'B', status: 'Needs Practice', color: '#F5A623' },
    { subject: 'Introductory Physics', progress: 74, grade: 'B+', status: 'On Track', color: '#7C3AED' },
  ];

  const recentActivity = [
    { title: 'Completed Practice Quiz: Quadratic Equations', time: 'Today, 4:15 PM', score: '95%', type: 'quiz' },
    { title: 'AI Tutor Voice Session: Photosynthesis Light Cycle', time: 'Yesterday, 6:30 PM', duration: '18 mins', type: 'voice' },
    { title: 'Mastered Topic: Cell Membrane Transport', time: '2 days ago', xp: '+100 XP', type: 'topic' },
    { title: 'Uploaded Handwritten Chemistry Notes for Analysis', time: '3 days ago', type: 'doc' },
  ];

  return (
    <div className="parent-portal-layout">
      {/* Sidebar */}
      <aside className="parent-sidebar">
        <div className="parent-sidebar-brand">
          <div className="parent-logo">
            <Users size={22} color="#FFFFFF" />
          </div>
          <div>
            <span className="parent-brand-title">StudyPal</span>
            <span className="parent-portal-tag">Parent Portal</span>
          </div>
        </div>

        {/* Student Switcher Card */}
        <div className="student-profile-card">
          <div className="student-avatar-circle">SJ</div>
          <div className="student-meta">
            <strong className="student-name">{studentName}</strong>
            <span className="student-sub">{studentId} • Grade 9</span>
          </div>
        </div>

        {/* Navigation items */}
        <nav className="parent-nav">
          <button
            className={`parent-nav-item ${activeTab === 'overview' ? 'active' : ''}`}
            onClick={() => setActiveTab('overview')}
          >
            <LayoutDashboard size={18} />
            <span>Overview</span>
          </button>

          <button
            className={`parent-nav-item ${activeTab === 'activity' ? 'active' : ''}`}
            onClick={() => setActiveTab('activity')}
          >
            <Activity size={18} />
            <span>Activity Log</span>
          </button>

          <button
            className={`parent-nav-item ${activeTab === 'performance' ? 'active' : ''}`}
            onClick={() => setActiveTab('performance')}
          >
            <BarChart3 size={18} />
            <span>Performance & Exams</span>
          </button>

          <button
            className={`parent-nav-item ${activeTab === 'settings' ? 'active' : ''}`}
            onClick={() => setActiveTab('settings')}
          >
            <Settings size={18} />
            <span>Settings & Alerts</span>
          </button>
        </nav>

        {/* Logout */}
        <div className="parent-sidebar-bottom">
          <button className="parent-logout-btn" onClick={handleLogout}>
            <LogOut size={16} /> Log Out
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="parent-main-content">
        {/* Top Header */}
        <header className="parent-header">
          <div>
            <h1 className="parent-page-title">
              {activeTab === 'overview' && "Student Overview & Insights"}
              {activeTab === 'activity' && "Learning Activity & Sessions"}
              {activeTab === 'performance' && "Academic Performance & Mastery"}
              {activeTab === 'settings' && "Parent Notification Settings"}
            </h1>
            <p className="parent-page-subtitle">Monitoring real-time progress for {studentName}</p>
          </div>

          <div className="parent-header-badges">
            <span className="streak-chip">
              <Flame size={16} /> 3-Day Study Streak
            </span>
            <span className="xp-chip">
              <Sparkles size={16} /> 450 XP Earned
            </span>
          </div>
        </header>

        {/* TAB 1: OVERVIEW */}
        {activeTab === 'overview' && (
          <div className="parent-tab-content animate-fade-in">
            {/* Active AI Detection Alert Panel ("Needs Attention") */}
            {studentFlags.length > 0 ? (
              <div className="parent-alert-banner">
                <div className="parent-alert-icon">
                  <AlertCircle size={24} color="#DC2626" />
                </div>
                <div className="parent-alert-body">
                  <div className="parent-alert-title-row">
                    <h3 className="parent-alert-heading">🚨 Needs Attention — Active Concept Gap Detected</h3>
                    <Badge variant="error" size="sm">Action Recommended</Badge>
                  </div>
                  {studentFlags.map((flag) => (
                    <div key={flag.id} className="parent-flag-item">
                      <p className="parent-flag-msg">
                        <strong>{flag.subject}:</strong> {flag.message}
                      </p>
                      <span className="parent-flag-action">💡 {flag.action}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="parent-alert-banner banner-good">
                <div className="parent-alert-icon">
                  <CheckCircle2 size={24} color="#16A34A" />
                </div>
                <div className="parent-alert-body">
                  <h3 className="parent-alert-heading text-good">All Clear — Sarah is on track with zero active flags!</h3>
                  <p className="parent-flag-msg">Regular study sessions, consistent 88% average score, and strong mastery momentum.</p>
                </div>
              </div>
            )}

            {/* Quick Metrics */}
            <div className="parent-metrics-grid">
              <Card>
                <div className="metric-card-inner">
                  <div className="metric-icon-box blue-box">
                    <BookOpen size={24} />
                  </div>
                  <div>
                    <div className="metric-value">{studentStats?.completed_topics || 18} / {studentStats?.total_topics || 24}</div>
                    <div className="metric-label">Topics Mastered (75%)</div>
                  </div>
                </div>
              </Card>

              <Card>
                <div className="metric-card-inner">
                  <div className="metric-icon-box purple-box">
                    <TrendingUp size={24} />
                  </div>
                  <div>
                    <div className="metric-value">{studentStats?.average_score || 88}%</div>
                    <div className="metric-label">Average Quiz Score</div>
                  </div>
                </div>
              </Card>

              <Card>
                <div className="metric-card-inner">
                  <div className="metric-icon-box gold-box">
                    <Clock size={24} />
                  </div>
                  <div>
                    <div className="metric-value">4.5 hrs</div>
                    <div className="metric-label">Time Studied This Week</div>
                  </div>
                </div>
              </Card>
            </div>

            {/* Subject Mastery Breakdown */}
            <div className="parent-content-grid">
              <Card className="parent-grid-card">
                <CardHeader>
                  <CardTitle>Subject Mastery Status</CardTitle>
                  <Badge variant="primary">Updated Real-Time</Badge>
                </CardHeader>
                <CardContent>
                  <div className="subject-progress-list">
                    {subjectMastery.map((sub) => (
                      <div key={sub.subject} className="subject-progress-item">
                        <div className="subject-item-header">
                          <div>
                            <strong>{sub.subject}</strong>
                            <span className="subject-grade-badge">Grade: {sub.grade}</span>
                          </div>
                          <Badge variant={sub.status === 'Mastered' ? 'success' : sub.status === 'On Track' ? 'primary' : 'warning'}>
                            {sub.status}
                          </Badge>
                        </div>
                        <div className="progress-bar-pill">
                          <div
                            className="progress-fill-blue"
                            style={{ width: `${sub.progress}%`, background: sub.color }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Recommended Focus Area */}
              <div className="parent-side-cards">
                <Card className="focus-card">
                  <CardHeader>
                    <CardTitle>
                      <AlertCircle size={20} color="#F5A623" style={{ display: 'inline', marginRight: 6 }} />
                      Recommended Focus
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="focus-text">
                      Sarah did exceptionally well on Biology and Algebra this week. To maximize upcoming midterm readiness, she is scheduled to practice <strong>World History: 1900-1945</strong> tomorrow.
                    </p>
                    <div className="focus-action-box">
                      <span>Next Practice Quiz:</span>
                      <strong>History Flash-Exam (5 Qs)</strong>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>
                      <Sparkles size={20} color="#7C3AED" style={{ display: 'inline', marginRight: 6 }} />
                      AI Learning Highlights
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="highlights-list">
                      <li>✅ Socratic tutor dialogue completed on Photosynthesis</li>
                      <li>✅ Zero overdue study planner milestones</li>
                      <li>⭐ Consistently asks thoughtful follow-up questions in science</li>
                    </ul>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: ACTIVITY LOG */}
        {activeTab === 'activity' && (
          <div className="parent-tab-content animate-fade-in">
            <Card>
              <CardHeader>
                <CardTitle>Student Activity Timeline</CardTitle>
                <Badge variant="primary">Last 7 Days</Badge>
              </CardHeader>
              <CardContent>
                <div className="activity-timeline">
                  {recentActivity.map((act, i) => (
                    <div key={i} className="timeline-item">
                      <div className="timeline-bullet" />
                      <div className="timeline-content">
                        <div className="timeline-header">
                          <strong>{act.title}</strong>
                          <span className="timeline-time">{act.time}</span>
                        </div>
                        {act.score && <span className="activity-badge score-badge">Score: {act.score}</span>}
                        {act.duration && <span className="activity-badge duration-badge">Spoken Audio: {act.duration}</span>}
                        {act.xp && <span className="activity-badge xp-badge">{act.xp}</span>}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* TAB 3: PERFORMANCE */}
        {activeTab === 'performance' && (
          <div className="parent-tab-content animate-fade-in">
            <Card>
              <CardHeader>
                <CardTitle>Exam & Assessment History</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="performance-table-container">
                  <table className="performance-table">
                    <thead>
                      <tr>
                        <th>Subject</th>
                        <th>Topic</th>
                        <th>Date Taken</th>
                        <th>Score</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td>Mathematics</td>
                        <td>Quadratic Equations</td>
                        <td>Today</td>
                        <td><strong>95%</strong></td>
                        <td><Badge variant="success">Mastered</Badge></td>
                      </tr>
                      <tr>
                        <td>Biology</td>
                        <td>Cellular Transport</td>
                        <td>2 days ago</td>
                        <td><strong>100%</strong></td>
                        <td><Badge variant="success">Perfect Score</Badge></td>
                      </tr>
                      <tr>
                        <td>History</td>
                        <td>Treaty of Versailles</td>
                        <td>4 days ago</td>
                        <td><strong>70%</strong></td>
                        <td><Badge variant="warning">Needs Review</Badge></td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* TAB 4: SETTINGS */}
        {activeTab === 'settings' && (
          <div className="parent-tab-content animate-fade-in">
            <Card>
              <CardHeader>
                <CardTitle>Parent Preferences & Weekly Digest</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="settings-options-list">
                  <label className="setting-toggle-item">
                    <div>
                      <strong>Weekly Email Progress Report</strong>
                      <p>Receive an automated summary of Sarah's mastery and exam scores every Sunday.</p>
                    </div>
                    <input type="checkbox" defaultChecked />
                  </label>

                  <label className="setting-toggle-item">
                    <div>
                      <strong>Study Streak Inactivity Alert</strong>
                      <p>Notify if 48 hours pass without active practice sessions.</p>
                    </div>
                    <input type="checkbox" defaultChecked />
                  </label>

                  <label className="setting-toggle-item">
                    <div>
                      <strong>Exam Completion SMS Alerts</strong>
                      <p>Get a quick message when Sarah completes a major curriculum assessment.</p>
                    </div>
                    <input type="checkbox" />
                  </label>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

      </main>
    </div>
  );
}
