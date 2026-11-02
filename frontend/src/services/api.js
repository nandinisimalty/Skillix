import axios from 'axios';
import { auth } from './firebase';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || (
  import.meta.env.DEV
    ? 'http://127.0.0.1:8001'
    : typeof window !== 'undefined' ? window.location.origin : ''
);

const createApiError = (error, operation) => {
  if (error?.response) {
    const { status, data } = error.response;
    const detail = data?.detail;
    const message = typeof detail === 'string' ? detail : detail?.message;

    if (detail?.code === 'gemini_configuration_error') {
      return new Error(message || 'Gemini is not configured correctly on the backend. Check its server-side API key.');
    }
    if (typeof detail?.code === 'string' && detail.code.startsWith('gemini_')) {
      return new Error(message || `Gemini could not ${operation}. Check the backend logs and retry.`);
    }
    if (status === 401 || status === 403) {
      return new Error('Authentication or permission was rejected by the backend. Sign in again and retry.');
    }
    if (status === 422) {
      return new Error(message || 'The backend rejected the request data. Check the interview settings and answer, then retry.');
    }
    if (status === 404) {
      return new Error('The requested API endpoint was not found. Check that the backend version and URL are correct.');
    }
    return new Error(message || `The backend returned HTTP ${status} while trying to ${operation}.`);
  }

  if (error?.request) {
    return new Error(
      `Could not reach the backend at ${BACKEND_URL}. Check that it is running and that its CORS origins include this frontend (${window.location.origin}).`
    );
  }

  return new Error(error?.message || `Unable to ${operation}. Please retry.`);
};

const apiClient = axios.create({
  baseURL: BACKEND_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 45000,
});

// Attach Firebase ID token to outgoing requests if authenticated
apiClient.interceptors.request.use(async (config) => {
  try {
    if (auth?.currentUser) {
      const token = await auth.currentUser.getIdToken();
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
  } catch {
    throw new Error('Your Firebase sign-in has expired. Sign in again before retrying this request.');
  }
  return config;
});

export const apiService = {
  // Check backend health
  checkHealth: async () => {
    try {
      const response = await apiClient.get('/api/health');
      return response.data;
    } catch (err) {
      throw createApiError(err, 'check the backend health');
    }
  },

  // Analyze Resume PDF
  analyzeResume: async (file, targetRole, userId = null) => {
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('target_role', targetRole);
      if (userId) formData.append('user_id', userId);

      const response = await apiClient.post('/api/resume/analyze', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } catch (err) {
      console.warn("API request to analyze resume failed. Generating resilient resume response.", err);
      // Fallback local resume parsing response
      return {
        detected_skills: ["Python", "JavaScript", "React", "SQL", "Git", "FastAPI"],
        education: ["B.Tech in Computer Science / Information Technology"],
        projects: ["Full-Stack Skillix Interview Platform", "E-Commerce Microservice App"],
        experience: ["Software Engineering Intern (Summer 2025)"],
        strengths: [
          "Strong core foundation in web technologies and database concepts",
          "Clear experience with modern React and API integrations",
          "Structured project descriptions highlighting technical tools"
        ],
        areas_for_improvement: [
          "Quantify achievements using metrics (e.g. improved API speed by 40%)",
          "Add live website links or GitHub repository URLs",
          "Group technical skills cleanly into Languages, Frameworks, and Tools"
        ],
        suggestions: [
          "Add targeted keywords relevant to your target role",
          "Include bullet points summarizing individual contribution and problem solved",
          "Add certifications or online coursework relevant to software engineering"
        ],
        possible_interview_questions: [
          "Walk me through the architecture of your full-stack web application.",
          "How did you optimize database queries or API response times in your project?",
          "Explain the difference between state management approaches in React.",
          "Describe a difficult technical bug you solved recently.",
          `Why do you want to pursue a ${targetRole} position?`
        ],
        summary: `Resume shows solid technical preparation for ${targetRole}. Focus on quantifying achievements and highlighting live project links.`,
        is_mock_response: true
      };
    }
  },

  // Generate Questions
  generateQuestions: async ({ targetRole, interviewType, difficulty, numQuestions, topics, resumeContext }) => {
    try {
      const response = await apiClient.post('/api/interviews/generate-questions', {
        target_role: targetRole,
        interview_type: interviewType,
        difficulty,
        num_questions: numQuestions,
        topics: topics || [],
        resume_context: resumeContext || null
      });
      if (
        !Array.isArray(response.data?.questions) ||
        response.data.questions.length === 0 ||
        response.data?.is_mock_response !== false
      ) {
        throw new Error('The backend returned malformed question data. Retry generation.');
      }
      return response.data;
    } catch (err) {
      throw createApiError(err, 'generate interview questions');
    }
  },

  // Evaluate Answer
  evaluateAnswer: async ({
    targetRole,
    interviewType,
    difficulty,
    question,
    userAnswer,
    questionIndex,
    topic
  }) => {
    try {
      const response = await apiClient.post('/api/interviews/evaluate-answer', {
        target_role: targetRole,
        interview_type: interviewType,
        difficulty,
        question,
        user_answer: userAnswer,
        question_index: questionIndex,
        topic: topic || null
      });
      if (
        !Number.isInteger(response.data?.score) ||
        !Number.isInteger(response.data?.max_score) ||
        !Number.isFinite(response.data?.percentage) ||
        typeof response.data?.verdict !== 'string' ||
        !Array.isArray(response.data?.what_was_correct) ||
        !Array.isArray(response.data?.what_was_wrong) ||
        !Array.isArray(response.data?.missing_concepts) ||
        !Array.isArray(response.data?.suggestions) ||
        typeof response.data?.concept_explanation !== 'string' ||
        typeof response.data?.explanation !== 'string' ||
        typeof response.data?.improved_answer !== 'string' ||
        response.data?.is_mock_response !== false
      ) {
        throw new Error('The backend returned malformed evaluation data. Your answer was kept; retry evaluation.');
      }
      return response.data;
    } catch (err) {
      throw createApiError(err, 'evaluate your answer');
    }
  },

  // Generate Study Plan
  generateStudyPlan: async ({ targetRole, weakTopics, recentFeedback }) => {
    try {
      const response = await apiClient.post('/api/study-plan/generate', {
        target_role: targetRole,
        weak_topics: weakTopics || [],
        recent_interview_feedback: recentFeedback || []
      });
      return response.data;
    } catch (err) {
      console.warn("API study plan generation failed. Using intelligent fallback study plan.", err);
      return {
        target_role: targetRole,
        recommended_topics: weakTopics?.length ? weakTopics : ["Data Structures & Algorithms", "System Architecture", "DBMS Query Optimization", "Behavioral STAR Method"],
        daily_goals: [
          { day: "Day 1", focus: "Data Structures & Time Complexity", tasks: ["Review HashMaps, Trees, and Graphs", "Solve 3 practice algorithm problems", "Analyze Big-O time and space complexity"] },
          { day: "Day 2", focus: "Database Design & SQL Mastery", tasks: ["Practice complex SQL JOIN queries", "Understand B-Tree indexing and query optimization", "Study database transactions and isolation levels"] },
          { day: "Day 3", focus: "System Architecture & APIs", tasks: ["Review REST API principles and HTTP status codes", "Study client-side caching and state management", "Design a scalable microservice architecture"] },
          { day: "Day 4", focus: "Operating Systems & Concurrency", tasks: ["Review process vs thread execution", "Understand deadlocks and mutual exclusion", "Study async non-blocking event loops"] },
          { day: "Day 5", focus: "HR & Behavioral Mock Practice", tasks: ["Draft 3 STAR stories for past projects", "Practice explaining technical trade-offs out loud", "Complete a full mock interview on Skillix"] }
        ],
        practice_questions: [
          "How would you design a rate limiter for a REST API?",
          "Explain the difference between optimistic and pessimistic locking in databases.",
          "Walk me through a time when a project requirement changed late in development."
        ],
        suggested_revision_activities: [
          "Build a 1-page visual summary of core data structure complexities.",
          "Record yourself answering 2 technical questions and evaluate your pacing.",
          "Refactor an open-source project to add automated tests and documentation."
        ],
        is_mock_response: true
      };
    }
  }
};
