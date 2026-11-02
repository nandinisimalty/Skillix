import React from 'react';
import { Link } from 'react-router-dom';
import { 
  Sparkles, 
  ArrowRight, 
  BrainCircuit, 
  FileText, 
  BookOpen, 
  CheckCircle2, 
  TrendingUp, 
  Star 
} from 'lucide-react';
import { Button } from '../components/common/Button';
import { Card } from '../components/common/Card';
import { Navbar } from '../components/common/Navbar';

export const LandingPage = () => {
  return (
    <div className="min-h-screen bg-white flex flex-col font-sans selection:bg-indigo-100 selection:text-indigo-900">
      {/* Dedicated Public Navbar */}
      <Navbar publicOnly={true} />

      <main className="flex-1 flex flex-col items-center">
        {/* Compact, Premium Hero Section */}
        <section className="w-full max-w-4xl mx-auto px-4 sm:px-6 pt-16 sm:pt-20 pb-12 text-center">
          
          {/* Small badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 border border-slate-200/80 text-slate-700 text-xs font-medium mb-6">
            <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
            <span>AI-Powered Interview Preparation</span>
          </div>

          {/* Heading */}
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-slate-900 tracking-tight leading-tight max-w-2xl mx-auto">
            Prepare Smarter.{' '}
            <span className="text-indigo-600">Interview Better.</span>
          </h1>

          {/* Description */}
          <p className="mt-4 text-base sm:text-lg text-slate-600 max-w-xl mx-auto leading-relaxed">
            Practice mock interviews, analyze your resume, and improve your answers with personalized AI feedback.
          </p>

          {/* Primary & Secondary Call to Actions */}
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link to="/signup" className="w-full sm:w-auto">
              <Button size="lg" className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs px-6 py-3">
                Get Started
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
            <Link to="/login" className="w-full sm:w-auto">
              <Button variant="outline" size="lg" className="w-full sm:w-auto border-slate-200 text-slate-700 hover:bg-slate-50 px-6 py-3">
                Log In
              </Button>
            </Link>
          </div>
        </section>

        {/* Small, Subtle Dashboard Preview (Using existing UI components, no stock photos) */}
        <section className="w-full max-w-5xl mx-auto px-4 sm:px-6 pb-20">
          <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-2 sm:p-3 shadow-sm">
            {/* Window title bar preview */}
            <div className="flex items-center justify-between px-3 py-2 border-b border-slate-200/70 mb-3 text-xs text-slate-500">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-slate-300 inline-block" />
                <span className="w-2.5 h-2.5 rounded-full bg-slate-300 inline-block" />
                <span className="w-2.5 h-2.5 rounded-full bg-slate-300 inline-block" />
                <span className="ml-2 font-medium text-slate-600">Skillix Workspace</span>
              </div>
              <span className="text-[11px] text-slate-400 font-medium">Interactive Demo View</span>
            </div>

            {/* Dashboard Mockup Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              
              {/* Feature 1: AI Mock Interview Session */}
              <Card className="p-4 bg-white border border-slate-200/80 shadow-2xs">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600">
                      <BrainCircuit className="w-4 h-4" />
                    </div>
                    <span className="text-xs font-semibold text-slate-800">Mock Interview</span>
                  </div>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-bold border border-emerald-200">
                    Active
                  </span>
                </div>
                <p className="text-xs text-slate-600 font-medium line-clamp-2 mb-2.5">
                  "Explain how indexing improves query performance in relational databases."
                </p>
                <div className="bg-slate-50 p-2 rounded-lg border border-slate-100 flex items-center justify-between text-[11px]">
                  <span className="text-slate-500">AI Score:</span>
                  <span className="font-bold text-indigo-600 flex items-center gap-1">
                    <Star className="w-3 h-3 fill-indigo-600 text-indigo-600" />
                    88 / 100
                  </span>
                </div>
              </Card>

              {/* Feature 2: Resume Analyzer */}
              <Card className="p-4 bg-white border border-slate-200/80 shadow-2xs">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600">
                      <FileText className="w-4 h-4" />
                    </div>
                    <span className="text-xs font-semibold text-slate-800">Resume Analyzer</span>
                  </div>
                  <span className="text-[10px] text-slate-400">PyMuPDF + Gemini</span>
                </div>
                <div className="space-y-1.5 text-xs">
                  <div className="flex justify-between text-slate-600">
                    <span>Role Match</span>
                    <span className="font-semibold text-slate-900">Software Engineer</span>
                  </div>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {['Python', 'React', 'SQL', 'FastAPI'].map((skill) => (
                      <span key={skill} className="px-1.5 py-0.5 rounded bg-slate-100 text-[10px] text-slate-600 font-medium">
                        {skill}
                      </span>
                    ))}
                  </div>
                  <div className="flex items-center gap-1 text-[11px] text-emerald-700 font-medium pt-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Skills alignment verified</span>
                  </div>
                </div>
              </Card>

              {/* Feature 3: Tailored Study Plan */}
              <Card className="p-4 bg-white border border-slate-200/80 shadow-2xs">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600">
                      <BookOpen className="w-4 h-4" />
                    </div>
                    <span className="text-xs font-semibold text-slate-800">Study Roadmap</span>
                  </div>
                  <span className="text-[10px] text-indigo-600 font-bold">5-Day Plan</span>
                </div>
                <div className="space-y-1.5 text-[11px]">
                  <div className="flex items-center justify-between p-1.5 rounded bg-slate-50 border border-slate-100">
                    <span className="font-medium text-slate-700">Day 1: Algorithms</span>
                    <span className="text-emerald-600 font-bold">Completed</span>
                  </div>
                  <div className="flex items-center justify-between p-1.5 rounded bg-indigo-50/50 border border-indigo-100/60">
                    <span className="font-medium text-indigo-900">Day 2: System Design</span>
                    <span className="text-indigo-600 font-semibold">Today</span>
                  </div>
                </div>
              </Card>

            </div>
          </div>
        </section>
      </main>

      {/* Simple Footer */}
      <footer className="border-t border-slate-100 py-6 text-center text-xs text-slate-400">
        <p>&copy; {new Date().getFullYear()} Skillix AI. All rights reserved.</p>
      </footer>
    </div>
  );
};
