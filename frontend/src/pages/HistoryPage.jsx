import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { demoStorage } from '../services/demoData';
import { 
  History, 
  BrainCircuit, 
  Calendar, 
  Award, 
  Filter, 
  ArrowRight,
  Sparkles,
  Plus
} from 'lucide-react';
import { Button } from '../components/common/Button';
import { Card } from '../components/common/Card';
import { Badge } from '../components/common/Badge';
import { Navbar } from '../components/common/Navbar';


export const HistoryPage = () => {
  const navigate = useNavigate();
  const [interviews, setInterviews] = useState([]);
  const [filterType, setFilterType] = useState('All');

  useEffect(() => {
    const list = demoStorage.getInterviews();
    setInterviews(list || []);
  }, []);

  const filteredInterviews = interviews.filter((item) => {
    if (filterType === 'All') return true;
    return item.interviewType === filterType;
  });

  const handleOpenReport = (interviewItem) => {
    navigate('/interview/report', { state: { report: interviewItem } });
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
              <span>Cloud Firestore History</span>
            </div>
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Interview History</h1>
            <p className="text-sm text-slate-500 mt-1">
              Review your past mock interview scores, user answers, and AI feedback reports.
            </p>
          </div>

          <Link to="/interview/setup">
            <Button size="md" icon={Plus} className="gradient-glow">
              Start New Mock Interview
            </Button>
          </Link>
        </div>

        {/* Filter Bar */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
            <Filter className="w-4 h-4 text-indigo-600" />
            <span>Filter Interview Round:</span>
          </div>

          <div className="flex items-center gap-2">
            {['All', 'Technical', 'HR', 'Mixed'].map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => setFilterType(type)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                  filterType === type
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {type}
              </button>
            ))}
          </div>
        </div>

        {/* History List */}
        {filteredInterviews.length === 0 ? (
          <Card className="p-12 text-center border-dashed border-slate-300">
            <div className="w-12 h-12 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto mb-3">
              <History className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-slate-900 text-base">No Matching Interview History Found</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              Start a new mock interview session to automatically save your score reports.
            </p>
            <div className="mt-4">
              <Link to="/interview/setup">
                <Button size="sm" icon={BrainCircuit}>Launch AI Mock Interview</Button>
              </Link>
            </div>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filteredInterviews.map((item) => (
              <Card key={item.id} hoverEffect className="p-6 border-slate-200 flex flex-col justify-between space-y-4">
                
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-400 font-semibold flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" />
                      {new Date(item.createdAt).toLocaleDateString()}
                    </span>
                    <Badge variant={item.overallScore >= 80 ? 'emerald' : item.overallScore >= 65 ? 'indigo' : 'amber'}>
                      Score: {item.overallScore}%
                    </Badge>
                  </div>

                  <div>
                    <h3 className="text-lg font-bold text-slate-900">{item.targetRole}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="purple">{item.interviewType} Round</Badge>
                      <Badge variant="slate">{item.difficulty}</Badge>
                      <span className="text-xs text-slate-500">
                        {item.questions?.length || 5} Questions
                      </span>
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-xs text-slate-500">Full AI Feedback Saved</span>
                  <Button size="sm" variant="secondary" icon={ArrowRight} onClick={() => handleOpenReport(item)}>
                    Open Report
                  </Button>
                </div>

              </Card>
            ))}
          </div>
        )}

      </main>
    </div>
  );
};
