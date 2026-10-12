import axios from 'axios';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000';

const apiClient = axios.create({
  baseURL: BACKEND_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 45000,
});

export const apiService = {
  // Check backend health
  checkHealth: async () => {
    try {
      const response = await apiClient.get('/api/health');
      return response.data;
    } catch (err) {
      console.warn("Backend API not reachable. Client will operate using resilient fallback mode.", err);
      return { status: "fallback", gemini_key_configured: false };
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
        difficulty: difficulty,
        num_questions: numQuestions,
        topics: topics || [],
        resume_context: resumeContext || null
      });
      return response.data;
    } catch (err) {
      console.warn("API question generation failed. Serving pre-configured questions.", err);
      
      const techPool = [
        { id: 1, question: `Explain the concept of RESTful API design and how HTTP status codes are used in modern web development.`, category: "Web Architecture", difficulty, hints: ["Mention GET, POST, PUT, DELETE", "Explain 2xx, 4xx, and 5xx status code families"] },
        { id: 2, question: `What is the difference between SQL and NoSQL databases? When would you select PostgreSQL over MongoDB?`, category: "DBMS", difficulty, hints: ["Discuss ACID compliance vs flexible JSON schema", "Compare relational joins with document embedding"] },
        { id: 3, question: `What is the difference between synchronous and asynchronous code execution in Node.js or Python FastAPI?`, category: "Async Programming", difficulty, hints: ["Mention event loops, async/await, and non-blocking I/O", "Discuss CPU-bound vs I/O-bound tasks"] },
        { id: 4, question: `Explain how indexing works in relational databases to improve query performance. What are the trade-offs?`, category: "DBMS", difficulty, hints: ["Mention B-Trees and Hash indexes", "Discuss write overhead during INSERT/UPDATE operations"] },
        { id: 5, question: `What is Time and Space Complexity? Analyze the Big-O complexity of quicksort vs mergesort.`, category: "Data Structures", difficulty, hints: ["Compare average O(n log n) vs worst case O(n^2)", "Discuss in-place sorting memory footprint"] }
      ];

      const hrPool = [
        { id: 1, question: "Tell me about yourself, your background, and why you are interested in this role.", category: "Behavioral", difficulty, hints: ["Use Present-Past-Future structure", "Connect your background directly to target role requirements"] },
        { id: 2, question: "Describe a situation where you had to meet a tight deadline under pressure.", category: "Situation", difficulty, hints: ["Use the STAR method (Situation, Task, Action, Result)", "Focus on your prioritization strategy"] },
        { id: 3, question: "How do you handle disagreement or constructive criticism from a team member or mentor?", category: "Teamwork", difficulty, hints: ["Emphasize active listening and open collaboration", "Share a positive outcome"] },
        { id: 4, question: "What is your greatest technical strength and one area you are working to improve?", category: "Self-Awareness", difficulty, hints: ["Be genuine and show self-awareness", "Highlight concrete steps taken to grow"] },
        { id: 5, question: "Where do you see your professional career in the next 3 to 5 years?", category: "Career Goals", difficulty, hints: ["Align your personal learning goals with industry growth", "Demonstrate commitment to continuous learning"] }
      ];

      const pool = interviewType === 'Technical' ? techPool : interviewType === 'HR' ? hrPool : [...techPool.slice(0, 3), ...hrPool.slice(0, 2)];
      const selected = pool.slice(0, numQuestions).map((q, idx) => ({ ...q, id: idx + 1 }));

      return {
        target_role: targetRole,
        interview_type: interviewType,
        difficulty: difficulty,
        questions: selected,
        is_mock_response: true
      };
    }
  },

  // Evaluate Answer
  evaluateAnswer: async ({ targetRole, interviewType, question, userAnswer, questionIndex }) => {
    const response = await apiClient.post('/api/interviews/evaluate-answer', {
      target_role: targetRole,
      interview_type: interviewType,
      question: question,
      user_answer: userAnswer,
      question_index: questionIndex
    });
    return response.data;
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
