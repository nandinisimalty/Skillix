const STORAGE_KEYS = {
  USER_PROFILE: 'skillix_user_profile',
  INTERVIEWS: 'skillix_interviews',
  RESUME_ANALYSIS: 'skillix_resume_analyses',
  STUDY_PLANS: 'skillix_study_plans'
};

const getUserStorageKey = (key, uid) => (
  typeof uid === 'string' && uid.trim() ? `${key}_${uid}` : null
);

export const demoStorage = {
  getProfile: (uid) => {
    const key = getUserStorageKey(STORAGE_KEYS.USER_PROFILE, uid);
    if (!key) return null;
    try {
      const saved = localStorage.getItem(key);
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  },
  saveProfile: (uid, profileData) => {
    const key = getUserStorageKey(STORAGE_KEYS.USER_PROFILE, uid);
    if (!key) return profileData;
    try {
      const updated = { ...(demoStorage.getProfile(uid) || {}), ...profileData, uid };
      localStorage.setItem(key, JSON.stringify(updated));
      return updated;
    } catch (e) {
      console.error("Failed to save profile locally", e);
      return profileData;
    }
  },

  getInterviews: (uid) => {
    const key = getUserStorageKey(STORAGE_KEYS.INTERVIEWS, uid);
    if (!key) return [];
    try {
      const saved = localStorage.getItem(key);
      if (saved) {
        const interviews = JSON.parse(saved);
        return Array.isArray(interviews)
          ? interviews.filter((interview) => interview?.userId === uid && interview?.id !== 'int_sample_101')
          : [];
      }
    } catch (e) {
      console.error(e);
    }
    return [];
  },
  saveInterview: (uid, interviewObj) => {
    const key = getUserStorageKey(STORAGE_KEYS.INTERVIEWS, uid);
    if (!key) return interviewObj;
    try {
      const history = demoStorage.getInterviews(uid);
      const newInterview = {
        id: `int_${Date.now()}`,
        createdAt: new Date().toISOString(),
        ...interviewObj,
        userId: uid
      };
      const updated = [newInterview, ...history];
      localStorage.setItem(key, JSON.stringify(updated));
      return newInterview;
    } catch (e) {
      console.error("Failed to save interview locally", e);
      return interviewObj;
    }
  },

  getResumeAnalysis: (uid) => {
    const key = getUserStorageKey(STORAGE_KEYS.RESUME_ANALYSIS, uid);
    if (!key) return null;
    try {
      const saved = localStorage.getItem(key);
      const analysis = saved ? JSON.parse(saved) : null;
      return analysis?.userId === uid ? analysis : null;
    } catch {
      return null;
    }
  },
  saveResumeAnalysis: (uid, analysis) => {
    const key = getUserStorageKey(STORAGE_KEYS.RESUME_ANALYSIS, uid);
    if (!key) return analysis;
    try {
      const record = { ...analysis, createdAt: new Date().toISOString(), userId: uid };
      localStorage.setItem(key, JSON.stringify(record));
      return record;
    } catch (e) {
      console.error(e);
      return analysis;
    }
  },

  getStudyPlan: (uid) => {
    const key = getUserStorageKey(STORAGE_KEYS.STUDY_PLANS, uid);
    if (!key) return null;
    try {
      const saved = localStorage.getItem(key);
      const plan = saved ? JSON.parse(saved) : null;
      return plan?.userId === uid ? plan : null;
    } catch {
      return null;
    }
  },
  saveStudyPlan: (uid, plan) => {
    const key = getUserStorageKey(STORAGE_KEYS.STUDY_PLANS, uid);
    if (!key) return plan;
    try {
      const record = { ...plan, createdAt: new Date().toISOString(), userId: uid };
      localStorage.setItem(key, JSON.stringify(record));
      return record;
    } catch (e) {
      console.error(e);
      return plan;
    }
  }
};
