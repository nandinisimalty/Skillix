import React from 'react';
import { Link } from 'react-router-dom';
import { 
  Sparkles, 
  FileCheck, 
  BrainCircuit, 
  CheckCircle2, 
  BookMarked, 
  ArrowRight, 
  ShieldCheck, 
  Target, 
  Award,
  Zap,
  Users,
  BarChart3
} from 'lucide-react';
import { Button } from '../components/common/Button';
import { Card } from '../components/common/Card';
import { Navbar } from '../components/common/Navbar';

export const LandingPage = () => {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      <Navbar />

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 pb-20 md:pt-20 md:pb-28 bg-gradient-to-b from-indigo-50/70 via-slate-50 to-slate-50">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-96 bg-gradient-to-tr from-indigo-200/40 to-purple-200/40 blur-3xl pointer-events-none rounded-full" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-100/80 border border-indigo-200 text-indigo-700 text-xs font-semibold mb-6 animate-pulse-subtle shadow-2xs">
            <Sparkles className="w-4 h-4 text-indigo-600" />
            <span>AI-Powered Interview Coach for Graduates & Developers</span>
          </div>

          {/* Heading */}
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 tracking-tight leading-[1.15] max-w-4xl mx-auto">
            Prepare Smarter. <br />
            <span className="gradient-text">Interview Better.</span>
          </h1>

          {/* Description */}
          <p className="mt-6 text-lg sm:text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed">
            Practice interviews, analyze your resume, and receive personalized AI feedback to improve your interview skills and build confidence.
          </p>

          {/* Buttons */}
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link to="/signup">
              <Button size="lg" icon={Sparkles} className="gradient-glow w-full sm:w-auto">
                Start Practicing Free
              </Button>
            </Link>
            <a href="#features">
              <Button variant="outline" size="lg" icon={ArrowRight} className="w-full sm:w-auto">
                Explore Features
              </Button>
            </a>
          </div>

          {/* Quick Metrics Banner */}
          <div className="mt-14 pt-8 border-t border-slate-200/80 grid grid-cols-2 md:grid-cols-4 gap-6 text-center max-w-4xl mx-auto">
            <div>
              <p className="text-2xl font-bold text-slate-900">100% Free</p>
              <p className="text-xs text-slate-500 mt-0.5">For Students & Job Seekers</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-indigo-600">Instant AI</p>
              <p className="text-xs text-slate-500 mt-0.5">Feedback & Detailed Scoring</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">PDF Parsing</p>
              <p className="text-xs text-slate-500 mt-0.5">PyMuPDF Resume Analysis</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-purple-600">Gemini 2.5</p>
              <p className="text-xs text-slate-500 mt-0.5">Powered by Google AI</p>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Cards Section */}
      <section id="features" className="py-16 md:py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-xs font-bold uppercase tracking-wider text-indigo-600">Comprehensive AI Toolkit</h2>
            <p className="mt-2 text-3xl font-extrabold text-slate-900 tracking-tight sm:text-4xl">
              Everything You Need to Ace Tech & HR Interviews
            </p>
            <p className="mt-4 text-slate-600 text-sm sm:text-base">
              Designed to help entry-level job seekers highlight their strengths and systematically close skill gaps.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            
            {/* Feature 1 */}
            <Card hoverEffect className="flex flex-col justify-between border-indigo-100 hover:border-indigo-300">
              <div>
                <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-5">
                  <FileCheck className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-slate-900">AI Resume Analysis</h3>
                <p className="mt-2 text-sm text-slate-600 leading-relaxed">
                  Upload your PDF resume to extract skills, project achievements, strengths, and actionable improvement tips.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-indigo-600">
                <span>PDF Extraction</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </div>
            </Card>

            {/* Feature 2 */}
            <Card hoverEffect className="flex flex-col justify-between border-indigo-100 hover:border-indigo-300">
              <div>
                <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center mb-5">
                  <BrainCircuit className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-slate-900">AI Mock Interviews</h3>
                <p className="mt-2 text-sm text-slate-600 leading-relaxed">
                  Simulate technical, HR, or mixed interview rounds customized by role, difficulty, and selected core topics.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-purple-600">
                <span>Tailored Questions</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </div>
            </Card>

            {/* Feature 3 */}
            <Card hoverEffect className="flex flex-col justify-between border-indigo-100 hover:border-indigo-300">
              <div>
                <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-5">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-slate-900">Instant Answer Feedback</h3>
                <p className="mt-2 text-sm text-slate-600 leading-relaxed">
                  Receive scores out of 100, what went well, missing key details, and high-scoring example model answers.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-emerald-600">
                <span>Scoring & Examples</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </div>
            </Card>

            {/* Feature 4 */}
            <Card hoverEffect className="flex flex-col justify-between border-indigo-100 hover:border-indigo-300">
              <div>
                <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mb-5">
                  <BookMarked className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-slate-900">Study Recommendations</h3>
                <p className="mt-2 text-sm text-slate-600 leading-relaxed">
                  Get a personalized 5-day study plan with daily revision goals and recommended practice problems.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-amber-600">
                <span>Actionable Plans</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </div>
            </Card>

          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-16 md:py-24 bg-slate-50 border-t border-b border-slate-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-xs font-bold uppercase tracking-wider text-indigo-600">Step-By-Step Workflow</h2>
            <p className="mt-2 text-3xl font-extrabold text-slate-900 tracking-tight sm:text-4xl">
              How Skillix Prepares You For Success
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            
            {/* Step 1 */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs relative">
              <div className="w-8 h-8 rounded-full gradient-bg text-white font-extrabold text-sm flex items-center justify-center mb-4">
                1
              </div>
              <h4 className="font-bold text-slate-900 text-base">Upload Your Resume</h4>
              <p className="mt-2 text-xs text-slate-600 leading-relaxed">
                Extract text with PyMuPDF and detect key skills and project areas.
              </p>
            </div>

            {/* Step 2 */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs relative">
              <div className="w-8 h-8 rounded-full gradient-bg text-white font-extrabold text-sm flex items-center justify-center mb-4">
                2
              </div>
              <h4 className="font-bold text-slate-900 text-base">Practice Questions</h4>
              <p className="mt-2 text-xs text-slate-600 leading-relaxed">
                Answer custom technical or HR interview questions generated by Gemini AI.
              </p>
            </div>

            {/* Step 3 */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs relative">
              <div className="w-8 h-8 rounded-full gradient-bg text-white font-extrabold text-sm flex items-center justify-center mb-4">
                3
              </div>
              <h4 className="font-bold text-slate-900 text-base">Receive AI Feedback</h4>
              <p className="mt-2 text-xs text-slate-600 leading-relaxed">
                Get immediate scores, missing details, pros, and model response samples.
              </p>
            </div>

            {/* Step 4 */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs relative">
              <div className="w-8 h-8 rounded-full gradient-bg text-white font-extrabold text-sm flex items-center justify-center mb-4">
                4
              </div>
              <h4 className="font-bold text-slate-900 text-base">Improve Your Answers</h4>
              <p className="mt-2 text-xs text-slate-600 leading-relaxed">
                Follow personalized daily study goals to refine your technical knowledge.
              </p>
            </div>

          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 md:py-20 bg-slate-900 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-600/20 blur-3xl rounded-full pointer-events-none" />

        <div className="max-w-4xl mx-auto px-4 text-center relative z-10">
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
            Ready to Ace Your Next Tech Interview?
          </h2>
          <p className="mt-4 text-slate-300 text-base max-w-xl mx-auto">
            Join student developers and fresh graduates building real interview confidence with Skillix.
          </p>
          <div className="mt-8 flex justify-center">
            <Link to="/signup">
              <Button size="lg" icon={Sparkles} className="gradient-glow">
                Get Started Now — Free
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};
