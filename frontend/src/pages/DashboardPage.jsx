import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { demoStorage } from '../services/demoData';
import { 
  Sparkles, 
  User, 
  Briefcase, 
  GraduationCap, 
  Award, 
  CheckCircle2, 
  FileText, 
  BrainCircuit, 
  History, 
  BookOpen, 
  ArrowRight, 
  Plus, 
  TrendingUp, 
  Calendar,
  Layers
} from 'lucide-react';
import { Button } from '../components/common/Button';
import { Card } from '../components/common/Card';
import { Badge } from '../components/common/Badge';
import { Navbar } from '../components/common/Navbar';

export const DashboardPage = () => {
  const { userProfile, currentUser } = useAuth();
  const navigate = useNavigate();
  const [interviews, setInterviews] = useState([]);
  const [resumeAnalysis, setResumeAnalysis] = useState(null);

  useEffect(() => {
    // Load actual saved interviews from storage / firestore
    const loadedInterviews = demoStorage.getInterviews();
    setInterviews(loadedInterviews || []);

    const loadedResume = demoStorage.getResumeAnalysis();
    setResumeAnalysis(loadedResume);
  }, []);

  // Compute actual dynamic statistics
  const totalInterviews = interviews.length;
  const avgScore = totalInterviews > 0
    ? Math.round(interviews.reduce((acc, curr) => acc + (curr.overallScore || 0), 0) / totalInterviews)
    : null;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      <Navbar />

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        
        {/* Top Banner / Welcome Header */}
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-purple-950 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
          
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-indigo-200 text-xs font-semibold backdrop-blur-md">
                <Sparkles className="w-3.5 h-3.5 text-indigo-300" />
                <span>AI Interview Dashboard</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                Your Next Interview Starts Here
              </h1>
              <p className="text-sm text-slate-300 max-w-xl leading-relaxed">
                Practice real-world questions, sharpen your answers, and build interview confidence with personalized AI feedback.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <Link to="/interview/setup">
                <Button size="md" icon={BrainCircuit} className="gradient-glow">
                  Start Mock Interview
                </Button>
              </Link>
              <Link to="/resume">
                <Button size="md" variant="outline" icon={FileText} className="bg-white/10 text-white border-white/20 hover:bg-white/20">
                  Analyze Resume
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Profile Summary & Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* User Profile Card */}
          <Card className="p-6 border-indigo-100 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Target Role</span>
                <Link to="/profile" className="text-xs text-indigo-600 hover:underline font-semibold flex items-center gap-1">
                  <User className="w-3.5 h-3.5" /> Edit Profile
                </Link>
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-900">{userProfile?.targetRole || 'Software Engineer'}</h3>
                <p className="text-xs text-slate-500 mt-1 flex items-center gap-1.5">
                  <GraduationCap className="w-3.5 h-3.5 text-indigo-500" />
                  {userProfile?.college || 'University Student'} ({userProfile?.gradYear || '2026'})
                </p>
              </div>
              <div className="pt-3 border-t border-slate-100">
                <p className="text-xs font-semibold text-slate-700 mb-1.5">Registered Skills:</p>
                <div className="flex flex-wrap gap-1.5">
                  {(userProfile?.skills || 'Python, React, JavaScript, SQL').split(',').map((skill, i) => (
                    <Badge key={i} variant="indigo">{skill.trim()}</Badge>
                  ))}
                </div>
              </div>
            </div>
          </Card>

          {/* Stat 1: Total Interviews */}
          <Card className="p-6 border-slate-200 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                <BrainCircuit className="w-5 h-5" />
              </div>
              <span className="text-xs font-semibold text-slate-400">Completed Sessions</span>
            </div>
            <div className="mt-4">
              <p className="text-3xl font-extrabold text-slate-900">{totalInterviews}</p>
              <p className="text-xs text-slate-500 mt-1">Total Mock Interviews Recorded</p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
              <span>Saved in Firestore</span>
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
            </div>
          </Card>

          {/* Stat 2: Average Score */}
          <Card className="p-6 border-slate-200 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <TrendingUp className="w-5 h-5" />
              </div>
              <span className="text-xs font-semibold text-slate-400">Average Performance</span>
            </div>
            <div className="mt-4">
              <p className="text-3xl font-extrabold text-slate-900">
                {avgScore !== null ? `${avgScore}%` : 'N/A'}
              </p>
              <p className="text-xs text-slate-500 mt-1">Calculated AI Answer Score</p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
              <span>{avgScore !== null && avgScore >= 75 ? 'Strong Readiness' : 'Needs Practice'}</span>
              <Award className="w-3.5 h-3.5 text-amber-500" />
            </div>
          </Card>

        </div>

        {/* Quick Actions */}
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-slate-900 tracking-tight">Quick Actions</h2>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            
            <Link to="/resume" className="group">
              <Card hoverEffect className="p-5 border-slate-200 group-hover:border-indigo-300 transition-all h-full flex flex-col justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm">Analyze Resume</h3>
                    <p className="text-xs text-slate-500 mt-0.5">Upload PDF for AI feedback</p>
                  </div>
                </div>
                <div className="mt-4 flex items-center justify-end text-xs font-semibold text-indigo-600">
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </div>
              </Card>
            </Link>

            <Link to="/interview/setup" className="group">
              <Card hoverEffect className="p-5 border-slate-200 group-hover:border-purple-300 transition-all h-full flex flex-col justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <BrainCircuit className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm">Start Mock Interview</h3>
                    <p className="text-xs text-slate-500 mt-0.5">Custom Tech & HR rounds</p>
                  </div>
                </div>
                <div className="mt-4 flex items-center justify-end text-xs font-semibold text-purple-600">
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </div>
              </Card>
            </Link>

            <Link to="/history" className="group">
              <Card hoverEffect className="p-5 border-slate-200 group-hover:border-emerald-300 transition-all h-full flex flex-col justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <History className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm">Interview History</h3>
                    <p className="text-xs text-slate-500 mt-0.5">View past reports & scores</p>
                  </div>
                </div>
                <div className="mt-4 flex items-center justify-end text-xs font-semibold text-emerald-600">
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </div>
              </Card>
            </Link>

            <Link to="/study-plan" className="group">
              <Card hoverEffect className="p-5 border-slate-200 group-hover:border-amber-300 transition-all h-full flex flex-col justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <BookOpen className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm">Study Plan</h3>
                    <p className="text-xs text-slate-500 mt-0.5">Personalized revision goals</p>
                  </div>
                </div>
                <div className="mt-4 flex items-center justify-end text-xs font-semibold text-amber-600">
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </div>
              </Card>
            </Link>

          </div>
        </div>

        {/* Recent History & Next Steps */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Recent History */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-900 tracking-tight">Recent Interview Sessions</h2>
              <Link to="/history" className="text-xs text-indigo-600 hover:underline font-semibold">
                View All History
              </Link>
            </div>

            {interviews.length === 0 ? (
              /* Empty State */
              <Card className="p-8 text-center border-dashed border-slate-300">
                <div className="w-12 h-12 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto mb-3">
                  <BrainCircuit className="w-6 h-6" />
                </div>
                <h3 className="font-bold text-slate-900 text-base">No Interviews Recorded Yet</h3>
                <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                  Take your first AI mock interview to generate question feedback and track your score history!
                </p>
                <div className="mt-4">
                  <Link to="/interview/setup">
                    <Button size="sm" icon={Plus}>Start First Mock Interview</Button>
                  </Link>
                </div>
              </Card>
            ) : (
              <div className="space-y-3">
                {interviews.slice(0, 4).map((item) => (
                  <Card key={item.id} hoverEffect className="p-4 border-slate-200 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-sm">
                        {item.overallScore ? `${item.overallScore}%` : 'N/A'}
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-900 text-sm">{item.targetRole}</h4>
                        <div className="flex items-center gap-2 mt-0.5">
                          <Badge variant="purple">{item.interviewType}</Badge>
                          <Badge variant="slate">{item.difficulty}</Badge>
                          <span className="text-[11px] text-slate-400 flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {new Date(item.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>

                    <Link to="/history">
                      <Button size="sm" variant="ghost">View Details</Button>
                    </Link>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* Suggested Next Steps */}
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-slate-900 tracking-tight">Suggested Next Steps</h2>

            <Card className="p-5 border-indigo-100 bg-gradient-to-b from-white to-indigo-50/30 space-y-4">
              
              <div className="flex items-start gap-3">
                <div className="w-7 h-7 rounded-lg bg-indigo-600 text-white flex items-center justify-center shrink-0 font-bold text-xs mt-0.5">
                  1
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 text-sm">Upload PDF Resume</h4>
                  <p className="text-xs text-slate-600 mt-0.5">Extract technical skills and generate resume questions.</p>
                </div>
              </div>

              <div className="flex items-start gap-3 pt-3 border-t border-slate-100">
                <div className="w-7 h-7 rounded-lg bg-purple-600 text-white flex items-center justify-center shrink-0 font-bold text-xs mt-0.5">
                  2
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 text-sm">Run Technical Mock Round</h4>
                  <p className="text-xs text-slate-600 mt-0.5">Practice answering 5 data structure & web questions.</p>
                </div>
              </div>

              <div className="flex items-start gap-3 pt-3 border-t border-slate-100">
                <div className="w-7 h-7 rounded-lg bg-emerald-600 text-white flex items-center justify-center shrink-0 font-bold text-xs mt-0.5">
                  3
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 text-sm">Review 5-Day Study Plan</h4>
                  <p className="text-xs text-slate-600 mt-0.5">Follow daily revision tasks tailored to your performance.</p>
                </div>
              </div>

            </Card>
          </div>

        </div>

      </main>
    </div>
  );
};
