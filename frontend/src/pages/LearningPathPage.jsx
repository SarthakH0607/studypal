/**
 * LearningPathPage — Browse, create, and view learning paths.
 */
import { useState, useEffect } from 'react';
import { Plus, BookOpen, CheckCircle2, Circle, ChevronRight, Loader2 } from 'lucide-react';
import Header from '../components/layout/Header';
import Card, { CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import Modal from '../components/ui/Modal';
import { PageLoader } from '../components/ui/Loader';
import { api } from '../lib/api';
import toast from 'react-hot-toast';
import './LearningPathPage.css';

const GRADES = ['Grade 6', 'Grade 7', 'Grade 8', 'Grade 9', 'Grade 10', 'Grade 11', 'Grade 12', 'University'];

export default function LearningPathPage() {
  const [paths, setPaths] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [selectedPath, setSelectedPath] = useState(null);
  const [topics, setTopics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [newSubject, setNewSubject] = useState('');
  const [newGrade, setNewGrade] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [pathsRes, subjectsRes] = await Promise.all([
        api.getLearningPaths(),
        api.getSubjects(),
      ]);
      setPaths(pathsRes.paths || []);
      setSubjects(subjectsRes.subjects || []);
    } catch (err) {
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const createPath = async () => {
    if (!newSubject || !newGrade) return;
    setCreating(true);
    try {
      const result = await api.createLearningPath(newSubject, newGrade);
      toast.success('Learning path created!');
      setShowModal(false);
      setNewSubject('');
      setNewGrade('');
      loadData();
      selectPath(result.path_id);
    } catch (err) {
      toast.error('Failed to create path');
    } finally {
      setCreating(false);
    }
  };

  const selectPath = async (pathId) => {
    try {
      const data = await api.getLearningPath(pathId);
      setSelectedPath(data.path);
      setTopics(data.topics || []);
    } catch (err) {
      toast.error('Failed to load path');
    }
  };

  const updateMastery = async (topicId, level) => {
    if (!selectedPath) return;
    try {
      await api.updateTopicProgress(selectedPath.id, topicId, level);
      setTopics((prev) =>
        prev.map((t) => (t.id === topicId ? { ...t, mastery_level: level } : t))
      );
      toast.success('Progress updated!');
    } catch (err) {
      toast.error('Failed to update');
    }
  };

  if (loading) return <PageLoader text="Loading learning paths..." />;

  const masteryColors = {
    not_started: 'default',
    in_progress: 'warning',
    practiced: 'info',
    mastered: 'success',
  };

  return (
    <div className="page-enter">
      <Header title="Learning Paths" />
      <div className="learning-page">
        {/* Sidebar: Path List */}
        <div className="learning-sidebar">
          <div className="learning-sidebar-header">
            <h3>Your Paths</h3>
            <Button size="sm" icon={Plus} onClick={() => setShowModal(true)}>New</Button>
          </div>
          <div className="learning-paths-list">
            {paths.length === 0 ? (
              <p className="empty-text">No paths yet. Create your first!</p>
            ) : (
              paths.map((p) => (
                <div
                  key={p.id}
                  className={`learning-path-item ${selectedPath?.id === p.id ? 'active' : ''}`}
                  onClick={() => selectPath(p.id)}
                >
                  <div>
                    <div className="path-item-title">{p.title}</div>
                    <div className="path-item-meta">{p.subject} • {p.grade_level}</div>
                  </div>
                  <ChevronRight size={16} />
                </div>
              ))
            )}
          </div>
        </div>

        {/* Main: Topic Viewer */}
        <div className="learning-main">
          {selectedPath ? (
            <>
              <div className="learning-path-header">
                <div>
                  <h2>{selectedPath.title}</h2>
                  <p>{selectedPath.description}</p>
                </div>
                <Badge variant="primary" size="md">
                  {selectedPath.completed_topics || 0}/{selectedPath.total_topics} completed
                </Badge>
              </div>

              <div className="topics-list">
                {topics.map((topic, i) => (
                  <Card key={topic.id} hover className={`topic-card delay-${(i % 5) + 1}`}>
                    <div className="topic-header">
                      <div className="topic-number">{i + 1}</div>
                      <div className="topic-info">
                        <h4>{topic.title}</h4>
                        <p>{topic.description}</p>
                      </div>
                      <Badge variant={masteryColors[topic.mastery_level]} size="md">
                        {topic.mastery_level.replace('_', ' ')}
                      </Badge>
                    </div>
                    <div className="topic-actions">
                      {['not_started', 'in_progress', 'practiced', 'mastered'].map((level) => (
                        <button
                          key={level}
                          className={`mastery-btn ${topic.mastery_level === level ? 'mastery-active' : ''}`}
                          onClick={() => updateMastery(topic.id, level)}
                        >
                          {topic.mastery_level === level ? <CheckCircle2 size={14} /> : <Circle size={14} />}
                          {level.replace('_', ' ')}
                        </button>
                      ))}
                    </div>
                  </Card>
                ))}
              </div>
            </>
          ) : (
            <div className="learning-empty">
              <BookOpen size={48} />
              <h3>Select a learning path</h3>
              <p>Choose from the sidebar or create a new one</p>
            </div>
          )}
        </div>
      </div>

      {/* Create Modal */}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Create Learning Path">
        <div className="create-path-form">
          <div className="auth-field">
            <label className="label">Subject</label>
            <select className="input" value={newSubject} onChange={(e) => setNewSubject(e.target.value)}>
              <option value="">Select a subject</option>
              {subjects.map((s) => (
                <option key={s.id} value={s.id}>{s.icon} {s.name}</option>
              ))}
            </select>
          </div>
          <div className="auth-field">
            <label className="label">Grade Level</label>
            <select className="input" value={newGrade} onChange={(e) => setNewGrade(e.target.value)}>
              <option value="">Select grade</option>
              {GRADES.map((g) => (
                <option key={g} value={g}>{g}</option>
              ))}
            </select>
          </div>
          <Button onClick={createPath} fullWidth loading={creating} icon={creating ? Loader2 : Plus} size="lg">
            Generate Learning Path
          </Button>
        </div>
      </Modal>
    </div>
  );
}
