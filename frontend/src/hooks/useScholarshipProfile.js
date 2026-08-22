/**
 * useScholarshipProfile — Custom hook for managing eligibility profile data.
 * ============================================================
 * Stores the student's eligibility profile in localStorage, keyed per user ID.
 *
 * PRIVACY GUARANTEES:
 * - Data is stored ONLY in the browser's localStorage — never sent to the backend API
 * - Keyed per user ID so multiple accounts on the same device don't leak data
 * - Not accessible from parent/teacher portal views (separate routes, separate state)
 * - No console logging of sensitive field values
 * - Clearing the profile is a one-step operation
 */
import { useState, useCallback, useEffect } from 'react';
import useStore from '../store/useStore';

const STORAGE_PREFIX = 'studypal_scholarship_profile_';

/**
 * Returns the localStorage key for the current user's scholarship profile.
 */
function getStorageKey(userId) {
  return `${STORAGE_PREFIX}${userId || 'anonymous'}`;
}

/**
 * Default empty profile shape.
 */
const EMPTY_PROFILE = {
  familyIncome: '',
  classGrade: '',
  stream: '',
  state: '',
  category: '',
  minority: false,
  disability: false,
  gender: '',
  hasOtherScholarship: false,
  otherScholarshipName: '',
  academicPerformance: '',
};

export function useScholarshipProfile() {
  const { user } = useStore();
  const userId = user?.id || user?.email || 'anonymous';
  const storageKey = getStorageKey(userId);

  const [profile, setProfile] = useState(() => {
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        return { ...EMPTY_PROFILE, ...JSON.parse(stored) };
      }
    } catch {
      // PRIVACY: Don't log the error contents — could contain sensitive data
    }
    return null;
  });

  // Re-read when user changes (e.g. login/logout)
  useEffect(() => {
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        setProfile({ ...EMPTY_PROFILE, ...JSON.parse(stored) });
      } else {
        setProfile(null);
      }
    } catch {
      setProfile(null);
    }
  }, [storageKey]);

  /**
   * Save the eligibility profile to localStorage.
   * Overwrites the entire profile.
   */
  const saveProfile = useCallback((newProfile) => {
    try {
      const merged = { ...EMPTY_PROFILE, ...newProfile };
      localStorage.setItem(storageKey, JSON.stringify(merged));
      setProfile(merged);
    } catch {
      // PRIVACY: Silent fail — don't expose data in error logs
    }
  }, [storageKey]);

  /**
   * Clear the eligibility profile from localStorage.
   */
  const clearProfile = useCallback(() => {
    try {
      localStorage.removeItem(storageKey);
      setProfile(null);
    } catch {
      // Silent fail
    }
  }, [storageKey]);

  /**
   * Whether a complete profile exists (all required fields filled).
   */
  const hasProfile = profile !== null && Boolean(
    profile.familyIncome &&
    profile.classGrade &&
    profile.state &&
    profile.category &&
    profile.gender &&
    profile.academicPerformance
  );

  return {
    profile,
    saveProfile,
    clearProfile,
    hasProfile,
    EMPTY_PROFILE,
  };
}
