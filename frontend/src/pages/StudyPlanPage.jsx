import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { apiService } from '../services/api';
import { demoStorage } from '../services/demoData';
import { 
  BookOpen, 
  Sparkles, 
  CheckCircle2, 
  Target, 
  Calendar, 
  Code, 
  HelpCircle, 
  RotateCcw,
  CheckSquare,
  Square
} from 'lucide-react';
import { Button } from '../components/common/Button';
import { Card } from '../components/common/Card';
import { Badge } from '../components/common/Badge';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { Navbar } from '../components/common/Navbar';


export const StudyPlanPage = () => {
  const { userProfile } = useAuth();
  const location = useLocation();

  const targetRole = location.state?.targetRole || userProfile?.targetRole || 'Software Engineer';
  const weakTopics = location.state?.weakTopics || ['Data Structures', 'DBMS Optimization', 'System Design'];

  const [loading, setLoading] = useState(false);
  const [studyPlan, setStudyPlan] = useState(() => demoStorage.getStudyPlan());
  const [completedTasks, setCompletedTasks] = useState({});

  const generatePlan = async () => {
    try {
      setLoading(true);
      const res = await apiService.generateStudyPlan({
        targetRole,
        weakTopics,
        recentFeedback: []
      });
      setStudyPlan(res);
      demoStorage.saveStudyPlan(res);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!studyPlan) {
      generatePlan();
    }
  }, []);

  const toggleTask = (taskId) => {
    setCompletedTasks((prev) => ({
      ...prev,
      [taskId]: !prev[taskId]
    }));
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      <Navbar />

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-semibold mb-2">
              <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
              <span>Gemini AI Personalization</span>
            </div>
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Personalized Study Plan</h1>
            <p className="text-sm text-slate-500 mt-1">
              Follow your tailored 5-day study plan to strengthen weak areas identified in past interviews.
            </p>
          </div>

          <Button size="md" variant="outline" icon={RotateCcw} onClick={generatePlan} isLoading={loading}>
            Regenerate Study Plan
          </Button>
        </div>

        {loading && <LoadingSpinner message="Generating your custom 5-day study plan with Gemini AI..." fullPage />}

        {studyPlan && !loading && (
          <div className="space-y-8">
            
            {/* Recommended Topics */}
            <Card className="p-6 border-indigo-100">
              <h3 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
                <Target className="w-4 h-4 text-indigo-600" />
                Priority Recommended Topics
              </h3>
              <div className="flex flex-wrap gap-2">
                {studyPlan.recommended_topics?.map((topic, i) => (
                  <Badge key={i} variant="purple" className="px-3 py-1 text-xs">{topic}</Badge>
                ))}
              </div>
            </Card>

            {/* Daily Goals Stepper */}
            <div className="space-y-4">
              <h2 className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
                <Calendar className="w-5 h-5 text-indigo-600" />
                5-Day Daily Learning Schedule
              </h2>

              <div className="space-y-4">
                {studyPlan.daily_goals?.map((dayGoal, dayIdx) => (
                  <Card key={dayIdx} className="p-6 border-slate-200 shadow-xs">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3 mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl gradient-bg text-white font-extrabold flex items-center justify-center text-xs">
                          {dayGoal.day}
                        </div>
                        <h3 className="font-extrabold text-slate-900 text-base">
                          {dayGoal.focus}
                        </h3>
                      </div>
                    </div>

                    <div className="space-y-2.5">
                      {dayGoal.tasks?.map((task, taskIdx) => {
                        const taskId = `${dayIdx}_${taskIdx}`;
                        const isDone = Boolean(completedTasks[taskId]);
                        return (
                          <div
                            key={taskIdx}
                            onClick={() => toggleTask(taskId)}
                            className={`p-3 rounded-xl border text-xs flex items-start gap-3 transition-all cursor-pointer ${
                              isDone ? 'bg-emerald-50/70 border-emerald-200 text-slate-500 line-through' : 'bg-slate-50 border-slate-200 text-slate-800 hover:bg-slate-100/80'
                            }`}
                          >
                            {isDone ? (
                              <CheckSquare className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                            ) : (
                              <Square className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                            )}
                            <span className="leading-relaxed">{task}</span>
                          </div>
                        );
                      })}
                    </div>
                  </Card>
                ))}
              </div>
            </div>

            {/* Practice Questions & Activities */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Practice Questions */}
              <Card className="p-6 border-indigo-100">
                <h3 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
                  <Code className="w-4 h-4 text-indigo-600" />
                  Recommended Practice Problems
                </h3>
                <ul className="space-y-2 text-xs text-slate-700">
                  {studyPlan.practice_questions?.map((pq, idx) => (
                    <li key={idx} className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-start gap-2">
                      <span className="font-bold text-indigo-600">{idx + 1}.</span>
                      <span>{pq}</span>
                    </li>
                  ))}
                </ul>
              </Card>

              {/* Revision Activities */}
              <Card className="p-6 border-purple-100">
                <h3 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-purple-600" />
                  Suggested Revision Exercises
                </h3>
                <ul className="space-y-2 text-xs text-slate-700">
                  {studyPlan.suggested_revision_activities?.map((act, idx) => (
                    <li key={idx} className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-purple-500 shrink-0 mt-0.5" />
                      <span>{act}</span>
                    </li>
                  ))}
                </ul>
              </Card>

            </div>

          </div>
        )}

      </main>
    </div>
  );
};
