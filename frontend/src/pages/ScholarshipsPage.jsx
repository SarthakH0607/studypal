/**
 * ScholarshipsPage — Scholarship/Eligibility Matcher
 * ============================================================
 * Two modes:
 *   1. SETUP — Multi-step wizard to collect eligibility profile (first time or edit)
 *   2. RESULTS — Matched scholarships + almost-eligible, with filter/sort
 *
 * PRIVACY:
 * - All eligibility data stored in localStorage only (via useScholarshipProfile hook)
 * - Never sent to backend API
 * - Not exposed to parent/teacher views
 * - No console logging of sensitive field values
 *
 * SCHOLARSHIP DATA:
 * - Static database in scholarshipData.js — real entries sourced from official portals
 * - Matching engine in scholarshipMatcher.js — pure functions, no side effects
 */
import { useState, useMemo } from 'react';
import {
  ShieldCheck, ChevronRight, ChevronLeft, CheckCircle2,
  GraduationCap, ExternalLink, Calendar, Award, AlertTriangle,
  Search, ArrowUpDown, Edit3, Sparkles, Info,
} from 'lucide-react';
import Header from '../components/layout/Header';
import Card, { CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import scholarships, { INDIAN_STATES } from '../lib/scholarshipData';
import { matchScholarships, daysUntilDeadline, deadlineUrgency } from '../lib/scholarshipMatcher';
import { useScholarshipProfile } from '../hooks/useScholarshipProfile';
import './ScholarshipsPage.css';

// ── Constants for form options ──────────────────────────────
const INCOME_RANGES = [
  { value: 'below_1L', label: 'Below ₹1L' },
  { value: '1_2.5L', label: '₹1–2.5L' },
  { value: '2.5_5L', label: '₹2.5–5L' },
  { value: '5_8L', label: '₹5–8L' },
  { value: 'above_8L', label: 'Above ₹8L' },
];

const GRADES = [
  'Grade 6', 'Grade 7', 'Grade 8', 'Grade 9', 'Grade 10',
  'Grade 11', 'Grade 12', 'University',
];

const STREAMS = [
  { value: '', label: 'Not Applicable' },
  { value: 'Science', label: 'Science' },
  { value: 'Commerce', label: 'Commerce' },
  { value: 'Arts', label: 'Arts' },
];

const CATEGORIES = ['General', 'OBC', 'SC', 'ST', 'EWS'];

const GENDERS = [
  { value: 'Male', label: 'Male' },
  { value: 'Female', label: 'Female' },
  { value: 'Other', label: 'Other' },
];

const PERFORMANCE_BANDS = [
  { value: 'above_60', label: 'Above 60%' },
  { value: 'above_75', label: 'Above 75%' },
  { value: 'above_90', label: 'Above 90%' },
];

const SORT_OPTIONS = [
  { value: 'deadline', label: 'Deadline (soonest)' },
  { value: 'amount', label: 'Award Amount' },
  { value: 'name', label: 'Name (A–Z)' },
];

// ── Wizard Steps ────────────────────────────────────────────
const STEPS = ['Academic', 'Personal', 'Financial'];

// ── Privacy Banner Component ────────────────────────────────
function PrivacyBanner() {
  return (
    <div className="privacy-banner">
      <div className="privacy-banner-icon">
        <ShieldCheck size={18} />
      </div>
      <div className="privacy-banner-text">
        <strong>Your data stays on this device.</strong> Income, category, disability, and
        minority status are stored only in your browser — never sent to our servers or
        shared with teachers/parents. This data is used solely to match scholarships.
      </div>
    </div>
  );
}

// ── Wizard Progress Indicator ───────────────────────────────
function WizardProgress({ currentStep }) {
  return (
    <div>
      <div className="wizard-progress">
        {STEPS.map((step, i) => (
          <div key={step} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div
              className={`wizard-step-dot ${
                i === currentStep ? 'active' : i < currentStep ? 'completed' : ''
              }`}
            />
            {i < STEPS.length - 1 && (
              <div className={`wizard-step-connector ${i < currentStep ? 'completed' : ''}`} />
            )}
          </div>
        ))}
      </div>
      <div className="wizard-step-label">
        {STEPS.map((step, i) => (
          <span
            key={step}
            className={i === currentStep ? 'active' : i < currentStep ? 'completed' : ''}
          >
            {step}
          </span>
        ))}
      </div>
    </div>
  );
}

// ── Range/Pill Selector ─────────────────────────────────────
function PillSelector({ options, value, onChange, id }) {
  return (
    <div className="range-selector" id={id}>
      {options.map((opt) => {
        const optValue = typeof opt === 'string' ? opt : opt.value;
        const optLabel = typeof opt === 'string' ? opt : opt.label;
        return (
          <button
            key={optValue}
            type="button"
            className={`range-option ${value === optValue ? 'selected' : ''}`}
            onClick={() => onChange(optValue)}
          >
            {optLabel}
          </button>
        );
      })}
    </div>
  );
}

// ── Toggle Switch ───────────────────────────────────────────
function ToggleRow({ label, value, onChange, id }) {
  return (
    <div className="toggle-row" id={id}>
      <span className="toggle-row-label">{label}</span>
      <button
        type="button"
        className={`toggle-switch ${value ? 'active' : ''}`}
        onClick={() => onChange(!value)}
        aria-label={`Toggle ${label}`}
      />
    </div>
  );
}

// ── Scholarship Card ────────────────────────────────────────
function ScholarshipCard({ scholarship, isAlmostEligible = false }) {
  const days = daysUntilDeadline(scholarship.deadline);
  const urgency = deadlineUrgency(scholarship.deadline);

  const deadlineText = urgency === 'expired'
    ? 'Expired'
    : days === 0
      ? 'Today!'
      : days === 1
        ? '1 day left'
        : `${days} days left`;

  const deadlineDate = new Date(scholarship.deadline).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  return (
    <div className={`scholarship-card ${isAlmostEligible ? 'almost-eligible' : ''}`}>
      {/* Top row: name + award */}
      <div className="scholarship-card-top">
        <div className="scholarship-card-info">
          <div className="scholarship-name">{scholarship.name}</div>
          <div className="scholarship-provider">{scholarship.provider}</div>
        </div>
        <div className="scholarship-award">
          <Award size={14} style={{ marginRight: 4, verticalAlign: 'middle' }} />
          {scholarship.awardAmount}
        </div>
      </div>

      {/* Meta: deadline + source badge */}
      <div className="scholarship-card-meta">
        <span className={`deadline-badge deadline-${urgency}`}>
          <Calendar size={12} />
          {deadlineDate} · {deadlineText}
        </span>
        {scholarship.source === 'official' && (
          <Badge variant="success" size="sm" icon={CheckCircle2}>Verified Source</Badge>
        )}
      </div>

      {/* Match reason or failed condition */}
      {!isAlmostEligible && scholarship.matchSummary && (
        <div className="match-reason">
          <CheckCircle2 size={16} className="match-reason-icon" />
          <span>Matches: {scholarship.matchSummary}</span>
        </div>
      )}

      {isAlmostEligible && scholarship.failedCondition && (
        <div className="failed-condition">
          <AlertTriangle size={16} className="failed-condition-icon" />
          <span>Almost eligible — {scholarship.failedCondition}</span>
        </div>
      )}

      {/* Bottom: description + apply */}
      <div className="scholarship-card-bottom">
        <p className="scholarship-description">{scholarship.description}</p>
        <a
          href={scholarship.applicationUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="apply-btn"
        >
          <Button
            variant={isAlmostEligible ? 'secondary' : 'primary'}
            size="sm"
            icon={ExternalLink}
          >
            Apply
          </Button>
        </a>
      </div>
    </div>
  );
}

// ── Main Page Component ─────────────────────────────────────
export default function ScholarshipsPage() {
  const { profile, saveProfile, hasProfile, EMPTY_PROFILE } = useScholarshipProfile();
  const [mode, setMode] = useState(hasProfile ? 'results' : 'setup');
  const [step, setStep] = useState(0);
  const [sortBy, setSortBy] = useState('deadline');
  const [filterCategory, setFilterCategory] = useState('all');

  // Form state — initialize from existing profile or empty
  const [form, setForm] = useState(() => ({
    ...EMPTY_PROFILE,
    ...(profile || {}),
  }));

  // Update a single form field
  const setField = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  // ── Wizard navigation ────────────────────────────────────
  const nextStep = () => {
    if (step < STEPS.length - 1) {
      setStep(step + 1);
    } else {
      // Final step — save and switch to results
      saveProfile(form);
      setMode('results');
    }
  };

  const prevStep = () => {
    if (step > 0) setStep(step - 1);
  };

  const editProfile = () => {
    setForm({ ...EMPTY_PROFILE, ...(profile || {}) });
    setStep(0);
    setMode('setup');
  };

  // ── Matching ─────────────────────────────────────────────
  const { matched, almostEligible } = useMemo(() => {
    if (!hasProfile || mode !== 'results') return { matched: [], almostEligible: [] };
    return matchScholarships(profile, scholarships);
  }, [profile, hasProfile, mode]);

  // ── Sorting ──────────────────────────────────────────────
  const sortFn = (a, b) => {
    if (sortBy === 'deadline') return new Date(a.deadline) - new Date(b.deadline);
    if (sortBy === 'name') return a.name.localeCompare(b.name);
    // amount — rough parse, just extract first number
    if (sortBy === 'amount') {
      const extractNum = (s) => {
        const match = s.awardAmount?.match(/[\d,]+/);
        return match ? parseInt(match[0].replace(/,/g, ''), 10) : 0;
      };
      return extractNum(b) - extractNum(a); // highest first
    }
    return 0;
  };

  const sortedMatched = [...matched].sort(sortFn);
  const sortedAlmost = [...almostEligible].sort(sortFn);

  // ── Category filtering ───────────────────────────────────
  const filterFn = (s) => {
    if (filterCategory === 'all') return true;
    if (filterCategory === 'government') {
      return !['Reliance Foundation', 'Aditya Birla Group', 'Tata Trusts (via Vidyasaarathi)',
        'Sitaram Jindal Foundation', 'HDFC Bank', 'Kotak Mahindra Group',
        'Hindustan Unilever (Glow & Lovely)'].includes(s.provider);
    }
    if (filterCategory === 'private') {
      return ['Reliance Foundation', 'Aditya Birla Group', 'Tata Trusts (via Vidyasaarathi)',
        'Sitaram Jindal Foundation', 'HDFC Bank', 'Kotak Mahindra Group',
        'Hindustan Unilever (Glow & Lovely)'].includes(s.provider);
    }
    if (filterCategory === 'girls') {
      return s.eligibility?.gender === 'Female';
    }
    if (filterCategory === 'disability') {
      return s.eligibility?.disability === true;
    }
    return true;
  };

  const displayMatched = sortedMatched.filter(filterFn);
  const displayAlmost = sortedAlmost.filter(filterFn);

  // ── Render: Setup Wizard ─────────────────────────────────
  if (mode === 'setup') {
    return (
      <div className="page-enter">
        <Header title="Scholarship Eligibility" />
        <div className="scholarships-page">
          <PrivacyBanner />
          <WizardProgress currentStep={step} />

          <Card className="wizard-card">
            <CardHeader>
              <CardTitle>
                {step === 0 && '📚 Academic Information'}
                {step === 1 && '👤 Personal Information'}
                {step === 2 && '💰 Financial Information'}
              </CardTitle>
              <Badge variant="primary" size="sm">Step {step + 1} of {STEPS.length}</Badge>
            </CardHeader>
            <CardContent>
              <div className="wizard-form-grid">
                {/* ── STEP 0: Academic ─── */}
                {step === 0 && (
                  <>
                    <div className="wizard-field">
                      <label className="label">
                        Current Class / Grade
                        <span className="field-hint">(required)</span>
                      </label>
                      <PillSelector
                        id="scholarship-grade-selector"
                        options={GRADES}
                        value={form.classGrade}
                        onChange={(v) => setField('classGrade', v)}
                      />
                    </div>

                    <div className="wizard-field">
                      <label className="label">
                        Stream
                        <span className="field-hint">(if applicable for Class 11+)</span>
                      </label>
                      <PillSelector
                        id="scholarship-stream-selector"
                        options={STREAMS}
                        value={form.stream}
                        onChange={(v) => setField('stream', v)}
                      />
                    </div>

                    <div className="wizard-field">
                      <label className="label">
                        Academic Performance Band
                        <span className="field-hint">(most recent results)</span>
                      </label>
                      <PillSelector
                        id="scholarship-performance-selector"
                        options={PERFORMANCE_BANDS}
                        value={form.academicPerformance}
                        onChange={(v) => setField('academicPerformance', v)}
                      />
                    </div>
                  </>
                )}

                {/* ── STEP 1: Personal ─── */}
                {step === 1 && (
                  <>
                    <div className="wizard-field">
                      <label className="label">
                        State / UT of Residence
                        <span className="field-hint">(required — many scholarships are state-specific)</span>
                      </label>
                      <select
                        className="input"
                        id="scholarship-state-select"
                        value={form.state}
                        onChange={(e) => setField('state', e.target.value)}
                      >
                        <option value="">Select your state…</option>
                        {INDIAN_STATES.map((s) => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>
                    </div>

                    <div className="wizard-field">
                      <label className="label">
                        Category
                        <span className="field-hint">(required)</span>
                      </label>
                      <PillSelector
                        id="scholarship-category-selector"
                        options={CATEGORIES}
                        value={form.category}
                        onChange={(v) => setField('category', v)}
                      />
                    </div>

                    <div className="wizard-field">
                      <label className="label">Gender</label>
                      <PillSelector
                        id="scholarship-gender-selector"
                        options={GENDERS}
                        value={form.gender}
                        onChange={(v) => setField('gender', v)}
                      />
                    </div>

                    <ToggleRow
                      id="scholarship-minority-toggle"
                      label="Belong to a minority community?"
                      value={form.minority}
                      onChange={(v) => setField('minority', v)}
                    />

                    <ToggleRow
                      id="scholarship-disability-toggle"
                      label="Person with disability (PwD)?"
                      value={form.disability}
                      onChange={(v) => setField('disability', v)}
                    />
                  </>
                )}

                {/* ── STEP 2: Financial ─── */}
                {step === 2 && (
                  <>
                    <div className="wizard-field">
                      <label className="label">
                        Family Annual Income Range
                        <span className="field-hint">(approximate — exact figure not needed)</span>
                      </label>
                      <PillSelector
                        id="scholarship-income-selector"
                        options={INCOME_RANGES}
                        value={form.familyIncome}
                        onChange={(v) => setField('familyIncome', v)}
                      />
                    </div>

                    <ToggleRow
                      id="scholarship-other-scholarship-toggle"
                      label="Currently receiving any other scholarship?"
                      value={form.hasOtherScholarship}
                      onChange={(v) => setField('hasOtherScholarship', v)}
                    />

                    {form.hasOtherScholarship && (
                      <div className="wizard-field" style={{ animation: 'fadeInUp 200ms ease-out' }}>
                        <label className="label">Which scholarship?</label>
                        <input
                          className="input"
                          id="scholarship-other-name-input"
                          placeholder="e.g. NMMS, State Merit Scholarship…"
                          value={form.otherScholarshipName}
                          onChange={(e) => setField('otherScholarshipName', e.target.value)}
                        />
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* Wizard navigation buttons */}
              <div className="wizard-nav">
                {step > 0 ? (
                  <Button variant="ghost" size="md" icon={ChevronLeft} onClick={prevStep}>
                    Back
                  </Button>
                ) : (
                  <div className="wizard-nav-spacer" />
                )}

                <Button
                  variant="primary"
                  size="md"
                  iconRight={step < STEPS.length - 1 ? ChevronRight : Sparkles}
                  onClick={nextStep}
                >
                  {step < STEPS.length - 1 ? 'Continue' : 'Find Scholarships'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // ── Render: Results ──────────────────────────────────────
  return (
    <div className="page-enter">
      <Header title="Scholarship Finder" />
      <div className="scholarships-page">
        {/* Results header */}
        <div className="results-header">
          <div className="results-header-left">
            <h2>Your Matches</h2>
            <span className="results-count">
              {displayMatched.length} scholarship{displayMatched.length !== 1 ? 's' : ''} found
            </span>
          </div>
          <Button variant="secondary" size="sm" icon={Edit3} onClick={editProfile}>
            Edit Profile
          </Button>
        </div>

        {/* Filter / Sort bar */}
        <div className="filter-bar">
          <span className="filter-bar-label">Filter:</span>
          {[
            { value: 'all', label: 'All' },
            { value: 'government', label: 'Government' },
            { value: 'private', label: 'Private' },
            { value: 'girls', label: 'For Girls' },
            { value: 'disability', label: 'PwD' },
          ].map((f) => (
            <button
              key={f.value}
              className={`filter-pill ${filterCategory === f.value ? 'active' : ''}`}
              onClick={() => setFilterCategory(f.value)}
            >
              {f.label}
            </button>
          ))}

          <span className="filter-bar-label" style={{ marginLeft: 'auto' }}>Sort:</span>
          {SORT_OPTIONS.map((s) => (
            <button
              key={s.value}
              className={`filter-pill ${sortBy === s.value ? 'active' : ''}`}
              onClick={() => setSortBy(s.value)}
            >
              {s.label}
            </button>
          ))}
        </div>

        {/* Matched scholarships */}
        {displayMatched.length > 0 ? (
          <div className="scholarship-grid">
            {displayMatched.map((s) => (
              <ScholarshipCard key={s.id} scholarship={s} />
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <div className="empty-state-icon">
              <Search size={32} />
            </div>
            <h3>No exact matches right now</h3>
            <p>
              {displayAlmost.length > 0
                ? 'But we found some scholarships you\'re close to qualifying for — check the "Almost Eligible" section below.'
                : 'Try updating your profile — sometimes a different state, category, or marks band unlocks more options.'}
            </p>
            <Button variant="secondary" size="sm" icon={Edit3} onClick={editProfile}>
              Update Profile
            </Button>
          </div>
        )}

        {/* Almost Eligible section */}
        {displayAlmost.length > 0 && (
          <div className="almost-eligible-section">
            <div className="section-divider" />
            <div className="almost-eligible-header">
              <Info size={20} color="var(--color-gold)" />
              <h3>Almost Eligible</h3>
              <Badge variant="warning" size="sm">{displayAlmost.length}</Badge>
            </div>
            <p className="almost-eligible-subtitle">
              These scholarships missed by just one condition. Check if you can update your
              profile or if the condition might change (e.g. upcoming marks improvement).
            </p>
            <div className="scholarship-grid">
              {displayAlmost.map((s) => (
                <ScholarshipCard key={s.id} scholarship={s} isAlmostEligible />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
