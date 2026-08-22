/**
 * DashboardPage — Playful StudyPal Dashboard with Gamified Quests, Subject Rings & XP.
 */
import { useState, useEffect } from 'react';
import { BookOpen, ClipboardCheck, FileText, MessageSquare, TrendingUp, Sparkles, Flame, Award, CheckCircle2, Circle, ArrowRight, Zap } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/layout/Header';
import Card, { CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import { PageLoader } from '../components/ui/Loader';
import ReactMarkdown from 'react-markdown';
import { api } from '../lib/api';
import useStore from '../store/useStore';
import toast from 'react-hot-toast';
import './DashboardPage.css';

const subjectRings = [
  { name: 'Mathematics', progress: 75, color: '#2F5FD9', level: 'Mastering' },
  { name: 'Physics', progress: 60, color: '#7C3AED', level: 'Practicing' },
  { name: 'Biology', progress: 90, color: '#22C55E', level: 'Expert' },
  { name: 'History', progress: 40, color: '#F5A623', level: 'Exploring' },
];

export default function DashboardPage() {
  const [data, setData] = useState(null);
  const [recommendations, setRecommendations] = useState('');
  const [loading, setLoading] = useState(true);
  const { user, profile } = useStore();
  const navigate = useNavigate();

  // Quest Log State
  const [quests, setQuests] = useState([
    { id: 1, title: 'Complete today\'s AI Tutor session', xp: '+50 XP', done: true },
    { id: 2, title: 'Take a quick 5-question practice quiz', xp: '+100 XP', done: false },
    { id: 3, title: 'Review Chapter 3 summary notes', xp: '+30 XP', done: false },
  ]);

  const toggleQuest = (id) => {
    setQuests(prev => prev.map(q => q.id === id ? { ...q, done: !q.done } : q));
  };

  useEffect(() => {
    let isMounted = true;
    const load = async () => {
      try {
        const overview = await api.getDashboardOverview();
        if (isMounted) {
          setData(overview);
          setLoading(false);
        }

        api.getRecommendations()
          .then((r) => {
            if (isMounted && r?.recommendations) {
              setRecommendations(r.recommendations);
            }
          })
          .catch(() => {});
      } catch (err) {
        if (isMounted) {
          setLoading(false);
          if (!data) {
            toast.error('Could not refresh dashboard stats');
          }
        }
      }
    };

    load();
    return () => { isMounted = false; };
  }, []);

  if (loading) return <PageLoader text="Loading your learning buddy..." />;

  const stats = data?.stats || {};
  const studentName = profile?.full_name?.split(' ')[0] || user?.email?.split('@')[0] || 'Buddy';

  return (
    <div className="page-enter">
      <Header title="Dashboard" />
      <div className="dashboard-container">
        
        {/* Warm Personal Greeting Hero Banner */}
        <div className="dashboard-buddy-hero">
          <div className="hero-text-content">
            <div className="hero-badges">
              <span className="level-chip">
                <Award size={16} /> Level 4 Scholar
              </span>
              <span className="streak-chip">
                <Flame size={16} /> 3-Day Streak! 🔥
              </span>
            </div>
            <h1 className="hero-greeting">Hello, {studentName}! 🌟</h1>
            <p className="hero-subtitle">
              You're making amazing progress today! You've completed <strong>{stats.completed_topics || 0}</strong> topics. Keep the momentum going!
            </p>
            
            {/* XP Progress Bar */}
            <div className="hero-xp-bar-container">
              <div className="hero-xp-header">
                <span>XP Progress to Level 5</span>
                <strong>450 / 600 XP</strong>
              </div>
              <div className="progress-bar-pill">
                <div className="progress-fill-blue" style={{ width: '75%' }} />
              </div>
            </div>
          </div>

          <div className="hero-action-buttons">
            <Button variant="primary" size="lg" onClick={() => navigate('/tutor')}>
              <Zap size={18} /> Ask AI Tutor
            </Button>
            <Button variant="secondary" size="lg" onClick={() => navigate('/exams')}>
              Take Practice Quiz
            </Button>
          </div>
        </div>

        {/* Subject Mastery Circular Rings Grid */}
        <div className="subject-rings-section">
          <div className="section-header">
            <h3>Subject Mastery Rings</h3>
            <span className="section-subtitle">Real-time learning skill meters</span>
          </div>
          <div className="subject-rings-grid">
            {subjectRings.map((sub) => (
              <div key={sub.name} className="subject-ring-card">
                <div className="circular-ring-wrapper">
                  <svg viewBox="0 0 100 100" className="circular-ring-svg">
                    <circle cx="50" cy="50" r="40" className="ring-bg" />
                    <circle
                      cx="50" cy="50" r="40"
                      className="ring-fill"
                      style={{
                        stroke: sub.color,
                        strokeDashoffset: 251 - (251 * sub.progress) / 100
                      }}
                    />
                  </svg>
                  <span className="ring-percent" style={{ color: sub.color }}>{sub.progress}%</span>
                </div>
                <div className="ring-info">
                  <h4 className="ring-title">{sub.name}</h4>
                  <Badge variant={sub.progress > 70 ? 'success' : 'primary'} size="sm">
                    {sub.level}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 2-Column Main Layout: Learning Paths & Daily Quests */}
        <div className="dashboard-grid-main">
          
          {/* Left Column: Learning Paths & Activity */}
          <div className="dashboard-col-left">
            <Card>
              <CardHeader>
                <CardTitle>
                  <BookOpen size={20} style={{ display: 'inline', marginRight: 8, color: 'var(--color-primary)' }} />
                  Active Learning Paths
                </CardTitle>
                <Button variant="ghost" size="sm" onClick={() => navigate('/learning')}>
                  View all <ArrowRight size={14} />
                </Button>
              </CardHeader>
              <CardContent>
                {(data?.recent_paths || []).length === 0 ? (
                  <div className="empty-paths-box">
                    <p>No learning paths started yet.</p>
                    <Button variant="primary" size="sm" onClick={() => navigate('/learning')}>
                      Generate Your First Path
                    </Button>
                  </div>
                ) : (
                  <div className="paths-list">
                    {data.recent_paths.map((path) => (
                      <div
                        key={path.id}
                        className="path-list-item"
                        onClick={() => navigate(`/learning?path=${path.id}`)}
                      >
                        <div className="path-item-info">
                          <h4 className="path-item-title">{path.title}</h4>
                          <span className="path-item-meta">{path.subject} • {path.grade_level}</span>
                        </div>
                        <Badge variant={path.completed_topics === path.total_topics ? 'success' : 'primary'}>
                          {path.completed_topics}/{path.total_topics} Topics
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* AI Recommendations */}
            {recommendations && (
              <Card>
                <CardHeader>
                  <CardTitle>
                    <Sparkles size={20} style={{ display: 'inline', marginRight: 8, color: 'var(--color-purple)' }} />
                    AI Study Recommendations
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="markdown-content recommendations-box">
                    <ReactMarkdown>{recommendations}</ReactMarkdown>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right Column: Quest Log & Pro CTA */}
          <div className="dashboard-col-right">
            {/* Daily Quest Log */}
            <Card className="quest-card">
              <CardHeader>
                <CardTitle>
                  <Zap size={20} style={{ display: 'inline', marginRight: 8, color: 'var(--color-gold)' }} />
                  Daily Quests
                </CardTitle>
                <span className="xp-chip">+180 XP Total</span>
              </CardHeader>
              <CardContent>
                <div className="quest-list">
                  {quests.map((q) => (
                    <div
                      key={q.id}
                      className={`quest-item ${q.done ? 'quest-done' : ''}`}
                      onClick={() => toggleQuest(q.id)}
                    >
                      <button className="quest-checkbox-btn">
                        {q.done ? (
                          <CheckCircle2 size={22} color="var(--color-success)" />
                        ) : (
                          <Circle size={22} color="var(--color-text-tertiary)" />
                        )}
                      </button>
                      <div className="quest-content">
                        <span className="quest-title">{q.title}</span>
                        <span className="quest-xp">{q.xp}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Average Exam Score */}
            <Card>
              <div className="score-overview-card">
                <div className="score-icon-box">
                  <TrendingUp size={28} />
                </div>
                <div>
                  <div className="score-number">{stats.average_score || 85}%</div>
                  <div className="score-label">Average Exam Score</div>
                </div>
              </div>
            </Card>

            {/* Upgrade to Pro Card */}
            <div className="pro-cta-card">
              <div className="pro-badge">⭐ StudyPal Pro</div>
              <h3>Unlock Unlimited AI Voice & Flashcards!</h3>
              <p>Get unlimited multimodal problem solving, parent audio recaps, and instant tutor explanations.</p>
              <button className="btn btn-gold btn-full">
                Upgrade to Pro 🚀
              </button>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
}
