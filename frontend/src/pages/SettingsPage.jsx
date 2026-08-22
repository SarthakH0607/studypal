/**
 * SettingsPage — Manage user profile, grade level, and learning preferences.
 */
import { useState, useEffect } from 'react';
import Header from '../components/layout/Header';
import Card, { CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import { PageLoader } from '../components/ui/Loader';
import { User, Save, ShieldCheck, Check } from 'lucide-react';
import useStore from '../store/useStore';
import { api } from '../lib/api';
import toast from 'react-hot-toast';
import './SettingsPage.css';

const GRADES = ['Grade 6', 'Grade 7', 'Grade 8', 'Grade 9', 'Grade 10', 'Grade 11', 'Grade 12', 'University'];

export default function SettingsPage() {
  const { user, profile, setAuth, token } = useStore();
  const [fullName, setFullName] = useState('');
  const [gradeLevel, setGradeLevel] = useState('');
  const [subjects, setSubjects] = useState([]);
  const [selectedSubjects, setSelectedSubjects] = useState([]);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const [meRes, subRes] = await Promise.all([
        api.getMe(),
        api.getSubjects(),
      ]);
      const prof = meRes.profile || {};
      setFullName(prof.full_name || '');
      setGradeLevel(prof.grade_level || 'Grade 10');
      setSelectedSubjects(prof.preferred_subjects || ['mathematics', 'physics']);
      setSubjects(subRes.subjects || []);
    } catch (err) {
      toast.error('Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const toggleSubject = (subId) => {
    setSelectedSubjects((prev) =>
      prev.includes(subId) ? prev.filter((id) => id !== subId) : [...prev, subId]
    );
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.updateProfile({
        full_name: fullName,
        grade_level: gradeLevel,
        preferred_subjects: selectedSubjects,
      });

      // Update store profile
      const updated = {
        ...profile,
        full_name: fullName,
        grade_level: gradeLevel,
        preferred_subjects: selectedSubjects,
      };
      setAuth(user, token, updated);
      toast.success('Profile updated successfully!');
    } catch (err) {
      toast.error(err.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <PageLoader text="Loading your preferences..." />;

  return (
    <div className="page-enter">
      <Header title="Account & Learning Preferences" />
      <div className="settings-page">
        <form onSubmit={handleSave} className="settings-form">
          <Card>
            <CardHeader>
              <CardTitle>Student Profile</CardTitle>
              <Badge variant="primary" icon={ShieldCheck}>Secured by Supabase</Badge>
            </CardHeader>
            <CardContent className="settings-section">
              <div className="auth-field">
                <label className="label">Email Address (Read-only)</label>
                <input
                  className="input"
                  value={user?.email || ''}
                  disabled
                  style={{ background: 'var(--color-bg)', opacity: 0.85, cursor: 'not-allowed' }}
                />
              </div>

              <div className="settings-grid-2col">
                <div className="auth-field">
                  <label className="label">Full Name</label>
                  <input
                    className="input"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Enter your name"
                  />
                </div>

                <div className="auth-field">
                  <label className="label">Current Grade / Education Level</label>
                  <select
                    className="input"
                    value={gradeLevel}
                    onChange={(e) => setGradeLevel(e.target.value)}
                  >
                    {GRADES.map((g) => (
                      <option key={g} value={g}>{g}</option>
                    ))}
                  </select>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Focus Subjects</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="settings-subtext">Choose the subjects you are actively studying. AI prompts and exam recommendations will tailor to these.</p>
              <div className="subject-tags-grid">
                {subjects.map((sub) => {
                  const isSelected = selectedSubjects.includes(sub.id);
                  return (
                    <button
                      key={sub.id}
                      type="button"
                      className={`subject-tag-btn ${isSelected ? 'subject-tag-selected' : ''}`}
                      onClick={() => toggleSubject(sub.id)}
                    >
                      <span className="sub-icon">{sub.icon}</span>
                      <span>{sub.name}</span>
                      {isSelected && <Check size={14} className="sub-check" />}
                    </button>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          <div className="settings-save-bar">
            <Button
              type="submit"
              variant="primary"
              size="lg"
              loading={saving}
              icon={Save}
            >
              Save Changes
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
