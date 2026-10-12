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
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    // Return standard initial sample interview so the dashboard is interactive out of the box
    return [
      {
        id: 'int_sample_101',
        targetRole: 'Software Engineer',
        interviewType: 'Technical',
        difficulty: 'Medium',
        createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
        overallScore: 84,
        questionsCount: 5,
        questions: [
          { question: "Explain RESTful API design principles." },
          { question: "Difference between SQL and NoSQL databases?" },
          { question: "What is Time Complexity and Big-O notation?" },
          { question: "How does asynchronous execution work in JavaScript/FastAPI?" },
          { question: "Explain database indexing trade-offs." }
        ],
        answers: ["REST APIs use standard HTTP verbs...", "SQL is relational with fixed schema...", "Big-O measures algorithm efficiency...", "Async code uses non-blocking event loops...", "Indexes speed up read operations but slow writes..."],
        feedback: [
          { score: 85, what_went_well: ["Good HTTP verb explanation"], what_is_missing: ["Mention status codes"], better_answer_example: "Use standard URIs..." },
          { score: 90, what_went_well: ["Great SQL vs NoSQL comparison"], what_is_missing: ["ACID compliance"], better_answer_example: "Relational tables..." },
          { score: 80, what_went_well: ["Clear Big-O definition"], what_is_missing: ["Space complexity details"], better_answer_example: "O(1) vs O(n)..." },
          { score: 85, what_went_well: ["Clear event loop overview"], what_is_missing: ["Thread pool details"], better_answer_example: "Async/await patterns..." },
          { score: 80, what_went_well: ["Accurate read vs write tradeoff"], what_is_missing: ["B-Tree explanation"], better_answer_example: "Index maintenance..." }
        ]
      }
    ];
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
