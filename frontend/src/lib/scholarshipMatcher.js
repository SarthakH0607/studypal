/**
 * Scholarship Matching Engine
 * ============================================================
 * Pure-function module that evaluates scholarship eligibility against a student's profile.
 * No side effects, no API calls, no logging of sensitive data.
 *
 * PRIVACY: This module ONLY reads the profile object passed in — it never reads from
 * localStorage, the network, or global state directly. The caller controls data flow.
 */

import { INCOME_ORDER } from './scholarshipData';

// ── Marks thresholds mapping ──────────────────────────────────
// Maps performance bands to numeric thresholds for comparison
const MARKS_THRESHOLDS = {
  above_50: 50,
  above_55: 55,
  above_60: 60,
  above_75: 75,
  above_80: 80,
  above_90: 90,
};

// Maps the student's performance band to the approximate percentage
const STUDENT_MARKS_VALUE = {
  above_60: 65,   // "Above 60%" → treat as ~65%
  above_75: 80,   // "Above 75%" → treat as ~80%
  above_90: 95,   // "Above 90%" → treat as ~95%
};

/**
 * Checks if the student's income is within a scholarship's ceiling.
 * Returns true if the student's income band is at or below the ceiling.
 */
function incomeWithinCeiling(studentIncome, ceilingRange) {
  if (!ceilingRange) return true; // No income restriction
  if (!studentIncome) return false;

  const studentIdx = INCOME_ORDER.indexOf(studentIncome);
  const ceilingIdx = INCOME_ORDER.indexOf(ceilingRange);
  if (studentIdx === -1 || ceilingIdx === -1) return true;

  return studentIdx <= ceilingIdx;
}

/**
 * Checks if a student's marks meet the scholarship's minimum requirement.
 */
function marksAboveMinimum(studentPerformance, minMarks) {
  if (!minMarks) return true; // No marks requirement
  if (!studentPerformance) return false;

  const studentValue = STUDENT_MARKS_VALUE[studentPerformance] || 0;
  const requiredValue = MARKS_THRESHOLDS[minMarks] || 0;

  return studentValue >= requiredValue;
}

/**
 * Extracts a numeric class/grade from the student's profile.
 * Handles values like 'Grade 10', '10', 'University'.
 */
function parseGrade(grade) {
  if (!grade) return null;
  if (grade === 'University') return 13; // Treat university as above 12
  const num = parseInt(grade.replace(/\D/g, ''), 10);
  return isNaN(num) ? null : num;
}

/**
 * Format income range for display.
 */
function formatIncome(range) {
  const MAP = {
    below_1L: 'below ₹1L',
    '1_2.5L': '₹1–2.5L',
    '2.5_5L': '₹2.5–5L',
    '5_8L': '₹5–8L',
    above_8L: 'above ₹8L',
  };
  return MAP[range] || range;
}

/**
 * Evaluates a single scholarship against a student profile.
 * Returns { passes: boolean, failedConditions: string[], matchReasons: string[] }
 */
function evaluateScholarship(scholarship, profile) {
  const elig = scholarship.eligibility;
  const failedConditions = [];
  const matchReasons = [];
  const grade = parseGrade(profile.classGrade);

  // 1. Income ceiling
  if (elig.incomeCeiling) {
    if (incomeWithinCeiling(profile.familyIncome, elig.incomeCeiling)) {
      matchReasons.push(`Income ${formatIncome(profile.familyIncome)}`);
    } else {
      failedConditions.push(`Income must be within ${formatIncome(elig.incomeCeiling)} (yours: ${formatIncome(profile.familyIncome)})`);
    }
  }

  // 2. Category
  if (elig.categories && elig.categories.length > 0) {
    if (profile.category && elig.categories.includes(profile.category)) {
      matchReasons.push(`${profile.category} category`);
    } else {
      failedConditions.push(`Requires ${elig.categories.join('/')} category (yours: ${profile.category || 'not set'})`);
    }
  }

  // 3. State
  if (elig.states && elig.states.length > 0) {
    if (profile.state && elig.states.includes(profile.state)) {
      matchReasons.push(profile.state);
    } else {
      failedConditions.push(`Only for ${elig.states.join(', ')} residents (yours: ${profile.state || 'not set'})`);
    }
  }

  // 4. Class/Grade range
  if (elig.classRange && grade !== null) {
    const [minClass, maxClass] = elig.classRange;
    if (grade >= minClass && grade <= maxClass) {
      matchReasons.push(`Class ${profile.classGrade?.replace('Grade ', '') || grade}`);
    } else {
      failedConditions.push(`For classes ${minClass}–${maxClass} (yours: ${profile.classGrade || grade})`);
    }
  }

  // 5. Stream
  if (elig.streams && elig.streams.length > 0) {
    if (profile.stream && elig.streams.includes(profile.stream)) {
      matchReasons.push(`${profile.stream} stream`);
    } else {
      failedConditions.push(`Requires ${elig.streams.join('/')} stream (yours: ${profile.stream || 'N/A'})`);
    }
  }

  // 6. Minimum marks
  if (elig.minMarks) {
    if (marksAboveMinimum(profile.academicPerformance, elig.minMarks)) {
      matchReasons.push(`Marks ${profile.academicPerformance?.replace('above_', 'above ').replace('_', '') || 'met'}%`);
    } else {
      const required = MARKS_THRESHOLDS[elig.minMarks] || '?';
      failedConditions.push(`Needs minimum ${required}% marks (yours: ${profile.academicPerformance?.replace('above_', 'above ')?.replace('_', '') || 'not set'}%)`);
    }
  }

  // 7. Gender
  if (elig.gender) {
    if (profile.gender === elig.gender) {
      matchReasons.push(`${profile.gender} students`);
    } else {
      failedConditions.push(`Only for ${elig.gender} students`);
    }
  }

  // 8. Minority status
  if (elig.minority === true) {
    if (profile.minority === true) {
      matchReasons.push('Minority community');
    } else {
      failedConditions.push('Requires minority community status');
    }
  }

  // 9. Disability status
  if (elig.disability === true) {
    if (profile.disability === true) {
      matchReasons.push('PwD eligible');
    } else {
      failedConditions.push('Requires disability status');
    }
  }

  // 10. No other scholarship restriction
  if (elig.noOtherScholarship && profile.hasOtherScholarship) {
    failedConditions.push('Cannot be combined with other scholarships');
  }

  return {
    passes: failedConditions.length === 0,
    failedConditions,
    matchReasons,
  };
}

/**
 * Main matching function.
 * Given a student profile and the full scholarship database, returns:
 *   { matched: [...], almostEligible: [...] }
 *
 * - matched: scholarships where ALL eligibility conditions pass.
 *   Each has a `matchSummary` string (e.g. "Income below ₹2.5L, SC category, Class 10, Maharashtra").
 * - almostEligible: scholarships that fail exactly 1 condition.
 *   Each has a `failedCondition` string explaining the single unmet requirement.
 *
 * Both arrays are sorted by deadline (soonest first).
 *
 * @param {Object} profile - The student's eligibility profile
 * @param {Array} scholarships - The scholarship database array
 * @returns {{ matched: Array, almostEligible: Array }}
 */
export function matchScholarships(profile, scholarships) {
  if (!profile || !scholarships) {
    return { matched: [], almostEligible: [] };
  }

  const matched = [];
  const almostEligible = [];

  for (const scholarship of scholarships) {
    const result = evaluateScholarship(scholarship, profile);

    if (result.passes) {
      matched.push({
        ...scholarship,
        matchSummary: result.matchReasons.join(', ') || 'Eligible (no restrictions)',
      });
    } else if (result.failedConditions.length === 1) {
      almostEligible.push({
        ...scholarship,
        failedCondition: result.failedConditions[0],
        matchSummary: result.matchReasons.join(', '),
      });
    }
    // If 2+ conditions fail, scholarship is not shown at all
  }

  // Sort by deadline ascending (soonest first)
  const sortByDeadline = (a, b) => new Date(a.deadline) - new Date(b.deadline);
  matched.sort(sortByDeadline);
  almostEligible.sort(sortByDeadline);

  return { matched, almostEligible };
}

/**
 * Returns the number of days until a deadline.
 * Negative = already past.
 */
export function daysUntilDeadline(deadlineStr) {
  const deadline = new Date(deadlineStr);
  const now = new Date();
  const diffMs = deadline.getTime() - now.getTime();
  return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
}

/**
 * Returns an urgency level based on days remaining.
 *   'expired' | 'critical' (< 14 days) | 'warning' (< 30 days) | 'normal'
 */
export function deadlineUrgency(deadlineStr) {
  const days = daysUntilDeadline(deadlineStr);
  if (days < 0) return 'expired';
  if (days < 14) return 'critical';
  if (days < 30) return 'warning';
  return 'normal';
}
