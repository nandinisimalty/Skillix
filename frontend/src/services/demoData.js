// Local storage key defaults
const STORAGE_KEYS = {
  USER_PROFILE: 'skillix_user_profile',
  INTERVIEWS: 'skillix_interviews_history',
  RESUME_ANALYSIS: 'skillix_resume_analyses',
  STUDY_PLANS: 'skillix_study_plans'
};

const DEFAULT_PROFILE = {
  uid: 'demo_user_123',
  name: 'Alex Morgan',
  email: 'alex.morgan@university.edu',
  college: 'Stanford University / MIT',
  degree: 'B.S. Computer Science',
  gradYear: '2026',
  targetRole: 'Software Engineer',
  skills: 'Python, React, JavaScript, Node.js, SQL, Data Structures',
  experienceLevel: 'Entry Level / Student'
};

export const demoStorage = {
  // Profile
  getProfile: () => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.USER_PROFILE);
      return saved ? JSON.parse(saved) : DEFAULT_PROFILE;
    } catch {
      return DEFAULT_PROFILE;
    }
  },
  saveProfile: (profileData) => {
    try {
      const updated = { ...demoStorage.getProfile(), ...profileData };
      localStorage.setItem(STORAGE_KEYS.USER_PROFILE, JSON.stringify(updated));
      return updated;
    } catch (e) {
      console.error("Failed to save profile locally", e);
      return profileData;
    }
  },

  // Interviews History
  getInterviews: () => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.INTERVIEWS);
      if (saved) {
        const interviews = JSON.parse(saved);
        return Array.isArray(interviews)
          ? interviews.filter((interview) => interview?.id !== 'int_sample_101')
          : [];
      }
    } catch (e) {
      console.error(e);
    }
    return [];
  },
  saveInterview: (interviewObj) => {
    try {
      const history = demoStorage.getInterviews();
      const newInterview = {
        id: `int_${Date.now()}`,
        createdAt: new Date().toISOString(),
        ...interviewObj
      };
      const updated = [newInterview, ...history];
      localStorage.setItem(STORAGE_KEYS.INTERVIEWS, JSON.stringify(updated));
      return newInterview;
    } catch (e) {
      console.error("Failed to save interview locally", e);
      return interviewObj;
    }
  },

  // Resume Analyses
  getResumeAnalysis: () => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.RESUME_ANALYSIS);
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  },
  saveResumeAnalysis: (analysis) => {
    try {
      const record = { ...analysis, createdAt: new Date().toISOString() };
      localStorage.setItem(STORAGE_KEYS.RESUME_ANALYSIS, JSON.stringify(record));
      return record;
    } catch (e) {
      console.error(e);
      return analysis;
    }
  },

  // Study Plans
  getStudyPlan: () => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.STUDY_PLANS);
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  },
  saveStudyPlan: (plan) => {
    try {
      const record = { ...plan, createdAt: new Date().toISOString() };
      localStorage.setItem(STORAGE_KEYS.STUDY_PLANS, JSON.stringify(record));
      return record;
    } catch (e) {
      console.error(e);
      return plan;
    }
  }
};
