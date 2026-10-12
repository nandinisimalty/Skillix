import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  BrainCircuit, 
  Sparkles, 
  Target, 
  Sliders, 
  HelpCircle, 
  Check, 
  ArrowRight,
  Code,
  Layers
} from 'lucide-react';
import { Button } from '../components/common/Button';
import { Card } from '../components/common/Card';
import { Badge } from '../components/common/Badge';
import { Navbar } from '../components/common/Navbar';


const TARGET_ROLES = [
  'Software Engineer',
  'Frontend Developer',
  'Backend Developer',
  'Data Analyst',
  'Data Scientist',
  'Machine Learning Engineer',
  'AI Engineer',
  'Other'
];

const TOPICS_LIST = [
  'Python',
  'C++',
  'SQL',
  'DBMS',
  'Operating Systems',
  'Computer Networks',
  'Data Structures and Algorithms',
  'Machine Learning',
  'Web Development'
];

export const InterviewSetupPage = () => {
  const { userProfile } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const prefilledRole = location.state?.targetRole || userProfile?.targetRole || 'Software Engineer';
  const prefilledTopics = location.state?.topics || ['Python', 'SQL', 'Data Structures and Algorithms'];

  const [targetRole, setTargetRole] = useState(prefilledRole);
  const [interviewType, setInterviewType] = useState('Technical');
  const [difficulty, setDifficulty] = useState('Medium');
  const [numQuestions, setNumQuestions] = useState(5);
  const [selectedTopics, setSelectedTopics] = useState(prefilledTopics);

  const toggleTopic = (topic) => {
    if (selectedTopics.includes(topic)) {
      setSelectedTopics(selectedTopics.filter((t) => t !== topic));
    } else {
      setSelectedTopics([...selectedTopics, topic]);
    }
  };

  const handleStartInterview = (e) => {
    e.preventDefault();
    navigate('/interview/session', {
      state: {
        targetRole,
        interviewType,
        difficulty,
        numQuestions: Number(numQuestions),
        topics: selectedTopics
      }
    });
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      <Navbar />

      <main className="flex-1 max-w-4xl mx-auto w-full px-4 sm:px-6 py-8">
        
        {/* Header */}
        <div className="mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-semibold mb-2">
            <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
            <span>Interactive AI Session Configuration</span>
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Setup AI Mock Interview</h1>
          <p className="text-sm text-slate-500 mt-1">
            Configure your target role, interview type, difficulty level, and topics to generate custom AI questions.
          </p>
        </div>

        <Card className="p-6 sm:p-8 shadow-md border-slate-200">
          <form onSubmit={handleStartInterview} className="space-y-6">
            
            {/* 1. Target Role */}
            <div className="border-b border-slate-200 pb-6">
              <label className="block text-sm font-bold text-slate-900 mb-2 flex items-center gap-2">
                <Target className="w-4 h-4 text-indigo-600" />
                Target Role
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {TARGET_ROLES.map((role) => {
                  const isSelected = targetRole === role;
                  return (
                    <button
                      key={role}
                      type="button"
                      onClick={() => setTargetRole(role)}
                      className={`p-3 rounded-xl border text-xs font-semibold text-left transition-all ${
                        isSelected
                          ? 'bg-indigo-50 border-indigo-500 text-indigo-700 ring-2 ring-indigo-200 shadow-xs'
                          : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      {role}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 2. Interview Type & Difficulty */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 border-b border-slate-200 pb-6">
              
              {/* Interview Type */}
              <div>
                <label className="block text-xs font-bold text-slate-900 mb-2">Interview Type</label>
                <div className="space-y-2">
                  {['Technical', 'HR', 'Mixed'].map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setInterviewType(type)}
                      className={`w-full p-2.5 rounded-xl border text-xs font-bold transition-all text-center ${
                        interviewType === type
                          ? 'bg-purple-50 border-purple-500 text-purple-700 ring-2 ring-purple-200'
                          : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      {type} Round
                    </button>
                  ))}
                </div>
              </div>

              {/* Difficulty */}
              <div>
                <label className="block text-xs font-bold text-slate-900 mb-2">Difficulty</label>
                <div className="space-y-2">
                  {['Easy', 'Medium', 'Hard'].map((diff) => (
                    <button
                      key={diff}
                      type="button"
                      onClick={() => setDifficulty(diff)}
                      className={`w-full p-2.5 rounded-xl border text-xs font-bold transition-all text-center ${
                        difficulty === diff
                          ? 'bg-indigo-50 border-indigo-500 text-indigo-700 ring-2 ring-indigo-200'
                          : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      {diff}
                    </button>
                  ))}
                </div>
              </div>

              {/* Number of Questions */}
              <div>
                <label className="block text-xs font-bold text-slate-900 mb-2">Number of Questions</label>
                <div className="space-y-2">
                  {[5, 10, 15].map((num) => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => setNumQuestions(num)}
                      className={`w-full p-2.5 rounded-xl border text-xs font-bold transition-all text-center ${
                        numQuestions === num
                          ? 'bg-emerald-50 border-emerald-500 text-emerald-700 ring-2 ring-emerald-200'
                          : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      {num} Questions
                    </button>
                  ))}
                </div>
              </div>

            </div>

            {/* 3. Topics */}
            <div>
              <label className="block text-sm font-bold text-slate-900 mb-2 flex items-center gap-2">
                <Code className="w-4 h-4 text-indigo-600" />
                Select Relevant Topics
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {TOPICS_LIST.map((topic) => {
                  const isChecked = selectedTopics.includes(topic);
                  return (
                    <button
                      key={topic}
                      type="button"
                      onClick={() => toggleTopic(topic)}
                      className={`p-3 rounded-xl border text-xs font-semibold flex items-center justify-between transition-all ${
                        isChecked
                          ? 'bg-indigo-50 border-indigo-400 text-indigo-800'
                          : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      <span>{topic}</span>
                      {isChecked && <Check className="w-4 h-4 text-indigo-600" />}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Submit */}
            <div className="pt-4 flex justify-end">
              <Button size="lg" type="submit" icon={ArrowRight} className="gradient-glow w-full sm:w-auto">
                Generate Questions & Start Interview
              </Button>
            </div>

          </form>
        </Card>

      </main>

    </div>
  );
};
