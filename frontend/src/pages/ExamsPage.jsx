/**
 * ExamsPage — Adaptive Gap-Targeting Quizzes, Topic Exams & Concept Mastery Breakdown.
 */
import { useState, useEffect } from 'react';
import {
  ClipboardCheck,
  Sparkles,
  CheckCircle,
  XCircle,
  Award,
  RotateCcw,
  FileText,
  Zap,
  Target,
  BarChart2,
  TrendingDown,
  Layers,
  HelpCircle
} from 'lucide-react';
import Header from '../components/layout/Header';
import Card, { CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import Modal from '../components/ui/Modal';
import { PageLoader } from '../components/ui/Loader';
import ReactMarkdown from 'react-markdown';
import { api } from '../lib/api';
import toast from 'react-hot-toast';
import './ExamsPage.css';

export default function ExamsPage() {
  const [history, setHistory] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [masteryMap, setMasteryMap] = useState([]);
  const [loading, setLoading] = useState(true);
  const [adaptiveLoading, setAdaptiveLoading] = useState(false);

  // Modal / Exam generation state
  const [showGenModal, setShowGenModal] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState('');
  const [topicTitle, setTopicTitle] = useState('');
  const [numMcq, setNumMcq] = useState(5);

  // Active exam taking state
  const [activeExam, setActiveExam] = useState(null);
  const [userAnswers, setUserAnswers] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [examResult, setExamResult] = useState(null);

  // Report viewing state
  const [selectedReport, setSelectedReport] = useState(null);
  const [loadingReport, setLoadingReport] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [historyRes, subjectsRes, masteryRes] = await Promise.all([
        api.getExamHistory().catch(() => ({ exams: [] })),
        api.getSubjects().catch(() => ({ subjects: [] })),
        api.getMasteryMap().catch(() => ({ mastery_map: [] })),
      ]);
      setHistory(historyRes.exams || []);
      setSubjects(subjectsRes.subjects || []);
      setMasteryMap(masteryRes.mastery_map || []);
    } catch (err) {
      toast.error('Failed to load exams');
    } finally {
      setLoading(false);
    }
  };

  const handleStartAdaptiveQuiz = async () => {
    setAdaptiveLoading(true);
    try {
      const res = await api.generateAdaptivePractice();
      setActiveExam(res);
      setUserAnswers({});
      setExamResult(null);
      toast.success(`Generated adaptive quiz targeting: ${res.topic_title}`);
    } catch (err) {
      toast.error('Could not generate adaptive quiz');
    } finally {
      setAdaptiveLoading(false);
    }
  };

  const handleGenerateExam = async () => {
    if (!topicTitle.trim()) {
      toast.error('Please enter a topic title or concept (e.g. Python, Photosynthesis, Thermodynamics)');
      return;
    }
    setGenerating(true);
    try {
      const res = await api.generateExam(topicTitle.trim(), selectedSubject, null, numMcq);
      setActiveExam(res);
      setUserAnswers({});
      setExamResult(null);
      setShowGenModal(false);
      setTopicTitle('');
      setSelectedSubject('');
      toast.success('Exam generated! Good luck.');
    } catch (err) {
      toast.error(err.message || 'Failed to generate exam');
    } finally {
      setGenerating(false);
    }
  };

  const handleOptionSelect = (questionId, optionLetter) => {
    setUserAnswers((prev) => ({ ...prev, [questionId]: optionLetter }));
  };

  const handleTextAnswerChange = (questionId, text) => {
    setUserAnswers((prev) => ({ ...prev, [questionId]: text }));
  };

  const handleSubmitExam = async () => {
    if (!activeExam) return;
    setSubmitting(true);
    try {
      const answersPayload = (activeExam.questions || []).map((q) => ({
        question_id: q.id,
        answer: userAnswers[q.id] || '',
      }));

      const res = await api.submitExam(activeExam.exam_id, answersPayload);
      setExamResult(res);
      toast.success(`Exam submitted! Score: ${res.score}/${res.max_score} (${res.percentage}%)`);
      loadData();
    } catch (err) {
      toast.error('Failed to submit exam');
    } finally {
      setSubmitting(false);
    }
  };

  const handleViewReport = async (examId) => {
    setLoadingReport(true);
    try {
      const data = await api.getExamReport(examId);
      setSelectedReport(data);
    } catch (err) {
      toast.error('Failed to load performance report');
    } finally {
      setLoadingReport(false);
    }
  };

  if (loading) return <PageLoader text="Loading StudyPal assessments & mastery map..." />;

  const weakConcepts = masteryMap.filter((m) => m.score < 0.65);

  return (
    <div className="page-enter">
      <Header title="Exams & Adaptive Practice" />
      <div className="exams-page">
        
        {/* Active Exam Taking View */}
        {activeExam && !examResult && (
          <div className="active-exam-container animate-fade-in">
            <div className="exam-banner glass">
              <div>
                <div className="exam-banner-badge">
                  <Target size={14} /> Adaptive Scaffolding Mode
                </div>
                <h2>{activeExam.topic_title || topicTitle}</h2>
                <p>Subject: {activeExam.subject || selectedSubject || 'Curriculum'} • Questions: {activeExam.total_questions}</p>
              </div>
              <Button variant="ghost" onClick={() => setActiveExam(null)}>Exit Exam</Button>
            </div>

            <div className="questions-container">
              {activeExam.questions?.map((q, idx) => (
                <Card key={q.id || idx} className="question-card">
                  <div className="question-header">
                    <span className="question-index">Q{idx + 1}</span>
                    <div className="question-header-info">
                      <p className="question-title">{q.question_text}</p>
                      {q.concept_tag && (
                        <span className="question-concept-chip">
                          <Layers size={12} /> {q.concept_tag.split(' > ').slice(-1)[0]}
                        </span>
                      )}
                    </div>
                    <Badge variant="primary">{q.max_points} pt{q.max_points > 1 ? 's' : ''}</Badge>
                  </div>

                  {q.question_type === 'mcq' && q.options && (
                    <div className="options-grid">
                      {q.options.map((opt, oIdx) => {
                        const letter = ['A', 'B', 'C', 'D'][oIdx] || String(oIdx + 1);
                        const isSelected = userAnswers[q.id] === letter;
                        return (
                          <button
                            key={oIdx}
                            type="button"
                            className={`option-btn ${isSelected ? 'option-selected' : ''}`}
                            onClick={() => handleOptionSelect(q.id, letter)}
                          >
                            <span className="option-letter">{letter}</span>
                            <span className="option-text">{opt}</span>
                          </button>
                        );
                      })}
                    </div>
                  )}

                  {(q.question_type === 'short_answer' || q.question_type === 'long_answer') && (
                    <textarea
                      className="textarea"
                      placeholder="Write your explanation or step-by-step solution here..."
                      rows={q.question_type === 'long_answer' ? 5 : 2}
                      value={userAnswers[q.id] || ''}
                      onChange={(e) => handleTextAnswerChange(q.id, e.target.value)}
                    />
                  )}
                </Card>
              ))}
            </div>

            <div className="exam-submit-bar">
              <Button
                variant="primary"
                size="lg"
                loading={submitting}
                icon={CheckCircle}
                onClick={handleSubmitExam}
              >
                Submit Exam Answers
              </Button>
            </div>
          </div>
        )}

        {/* Exam Results View */}
        {examResult && (
          <div className="exam-result-view animate-fade-in">
            <Card glow className="result-summary-card">
              <div className="result-score-badge">
                <Award size={48} color="var(--color-primary)" />
                <h2>{examResult.percentage}%</h2>
                <p>Scored {examResult.score} out of {examResult.max_score} points</p>
              </div>
              <div className="result-actions">
                <Button variant="primary" icon={RotateCcw} onClick={() => { setActiveExam(null); setExamResult(null); }}>
                  Done & Back to Exams
                </Button>
              </div>
            </Card>

            <h3>Question Breakdown</h3>
            <div className="results-list">
              {examResult.results?.map((res, i) => (
                <Card key={i} className="result-item-card">
                  <div className="result-item-header">
                    <div>
                      <strong>Question {i + 1}</strong>
                      <span className="points-awarded"> — {res.points_awarded}/{res.max_points} pts</span>
                    </div>
                    {res.points_awarded === res.max_points ? (
                      <Badge variant="success" icon={CheckCircle}>Full Marks</Badge>
                    ) : res.points_awarded > 0 ? (
                      <Badge variant="warning">Partial Credit</Badge>
                    ) : (
                      <Badge variant="error" icon={XCircle}>Incorrect</Badge>
                    )}
                  </div>
                  <p className="result-feedback">{res.feedback}</p>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Normal Assessments & Mastery Map Overview */}
        {!activeExam && !examResult && (
          <div className="exams-overview">
            
            {/* Adaptive Gap-Targeting Banner */}
            <div className="adaptive-hero-banner">
              <div className="adaptive-hero-text">
                <div className="adaptive-tag">
                  <Zap size={14} color="#FFFFFF" /> Adaptive Gap-Tracking Engine
                </div>
                <h2>AI-Powered Adaptive Practice 🎯</h2>
                <p>
                  StudyPal dynamically analyzes your running concept accuracy and generates questions tailored specifically to your lowest-mastery tags.
                </p>
                {weakConcepts.length > 0 && (
                  <div className="weak-concepts-hint">
                    <TrendingDown size={16} color="#F5A623" />
                    <span>Targeting: <strong>{weakConcepts.map(w => w.title).join(', ')}</strong></span>
                  </div>
                )}
              </div>
              <div className="adaptive-hero-actions">
                <Button
                  variant="gold"
                  size="lg"
                  loading={adaptiveLoading}
                  onClick={handleStartAdaptiveQuiz}
                >
                  <Zap size={18} /> Start Adaptive Practice
                </Button>
                <Button
                  variant="secondary"
                  size="lg"
                  onClick={() => setShowGenModal(true)}
                >
                  Custom Topic Exam
                </Button>
              </div>
            </div>

            {/* Concept-Level Mastery Map */}
            <div className="mastery-map-section">
              <div className="section-header">
                <h3>Concept-Level Mastery Breakdown</h3>
                <span className="section-subtitle">Real-time sub-skill accuracy across curriculum tags</span>
              </div>

              <div className="mastery-map-grid">
                {masteryMap.map((concept) => {
                  const scorePct = Math.round(concept.score * 100);
                  const isWeak = scorePct < 65;
                  const isMastered = scorePct >= 85;

                  return (
                    <div key={concept.concept_tag} className="concept-mastery-card">
                      <div className="concept-card-top">
                        <Badge variant={concept.subject === 'Biology' ? 'success' : concept.subject === 'Mathematics' ? 'primary' : 'purple'} size="sm">
                          {concept.subject}
                        </Badge>
                        <span className={`concept-score-pill ${isWeak ? 'score-weak' : isMastered ? 'score-mastered' : 'score-good'}`}>
                          {scorePct}% Mastery
                        </span>
                      </div>
                      <h4 className="concept-title">{concept.title}</h4>
                      <span className="concept-subtag">{concept.concept_tag}</span>

                      <div className="concept-progress-bar">
                        <div
                          className="concept-progress-fill"
                          style={{
                            width: `${scorePct}%`,
                            background: isWeak ? 'var(--color-gold)' : isMastered ? 'var(--color-success)' : 'var(--color-primary)',
                          }}
                        />
                      </div>

                      <div className="concept-meta-footer">
                        <span>{concept.correct_attempts}/{concept.total_attempts} Correct</span>
                        <span className="difficulty-tag">{concept.difficulty_level}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Past Exam History */}
            <div className="exams-history-section">
              <h3>Past Exam History</h3>
              {history.length === 0 ? (
                <Card className="empty-card">
                  <p className="empty-text">No past exams found. Click "Start Adaptive Practice" above to begin your first quiz!</p>
                </Card>
              ) : (
                <div className="history-grid">
                  {history.map((exam) => (
                    <Card key={exam.id} hover className="history-card">
                      <div className="history-card-header">
                        <div>
                          <h4>{exam.topic_title}</h4>
                          <span className="history-meta">{exam.subject} • {new Date(exam.created_at).toLocaleDateString()}</span>
                        </div>
                        {exam.status === 'completed' && exam.max_score ? (
                          <Badge variant={exam.score / exam.max_score >= 0.7 ? 'success' : 'warning'}>
                            {Math.round((exam.score / exam.max_score) * 100)}%
                          </Badge>
                        ) : (
                          <Badge variant="default">Pending</Badge>
                        )}
                      </div>
                      <div className="history-card-footer">
                        <span>{exam.score !== null ? `${exam.score}/${exam.max_score} pts` : `${exam.total_questions} questions`}</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          icon={FileText}
                          onClick={() => handleViewReport(exam.id)}
                        >
                          View Report
                        </Button>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </div>

          </div>
        )}
      </div>

      {/* Generate Custom Exam Modal */}
      <Modal isOpen={showGenModal} onClose={() => setShowGenModal(false)} title="Generate Custom Topic Exam">
        <div className="gen-exam-form">
          <div className="auth-field">
            <label className="label">Topic or Subject Concept *</label>
            <input
              className="input"
              placeholder="e.g. Python Programming, Binary Search Trees, Cell Division, Quantum Mechanics"
              value={topicTitle}
              onChange={(e) => setTopicTitle(e.target.value)}
              autoFocus
            />
            <span style={{ fontSize: '12px', color: 'var(--color-text-tertiary)', marginTop: '4px', display: 'block' }}>
              Type any topic across any domain — no subject limitations!
            </span>
          </div>

          <div className="auth-field">
            <label className="label">Subject Category (Optional)</label>
            <select
              className="input"
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
            >
              <option value="">Auto-detect from topic (Recommended)</option>
              {subjects.map((s) => (
                <option key={s.id} value={s.name}>{s.icon} {s.name}</option>
              ))}
            </select>
          </div>

          <div className="auth-field">
            <label className="label">Number of Multiple Choice Questions</label>
            <input
              className="input"
              type="number"
              min="1"
              max="15"
              value={numMcq}
              onChange={(e) => setNumMcq(parseInt(e.target.value) || 5)}
            />
          </div>

          <Button
            variant="primary"
            size="lg"
            fullWidth
            loading={generating}
            icon={Sparkles}
            onClick={handleGenerateExam}
          >
            Create Exam
          </Button>
        </div>
      </Modal>

      {/* Performance Report Modal */}
      <Modal
        isOpen={Boolean(selectedReport)}
        onClose={() => setSelectedReport(null)}
        title="AI Performance Analysis Report"
        size="lg"
      >
        {loadingReport ? (
          <PageLoader text="Loading detailed report..." />
        ) : (
          <div className="markdown-content">
            <ReactMarkdown>{selectedReport?.report || 'No report available.'}</ReactMarkdown>
          </div>
        )}
      </Modal>
    </div>
  );
}
