import React from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  BookOpen,
  BrainCircuit,
  FileText,
  Sparkles,
} from 'lucide-react';
import { Button } from '../components/common/Button';
import { Navbar } from '../components/common/Navbar';
import './LandingPage.css';

const currentYear = new Date().getFullYear();

const features = [
  {
    title: 'AI Mock Interviews',
    description: 'Practice realistic interviews with personalized AI feedback.',
    detail: 'Practice with purpose',
    icon: BrainCircuit,
    className: 'landing-feature-card--interviews',
  },
  {
    title: 'AI Resume Analyzer',
    description: 'Analyze your resume and identify skill gaps.',
    detail: 'Know where you stand',
    icon: FileText,
    className: 'landing-feature-card--resume',
  },
  {
    title: 'Personalized Study Roadmap',
    description: 'Get recommendations based on your preparation needs.',
    detail: 'Make every session count',
    icon: BookOpen,
    className: 'landing-feature-card--roadmap',
  },
];

export const LandingPage = () => {
  return (
    <div className="landing-page min-h-screen bg-white flex flex-col font-sans selection:bg-indigo-100 selection:text-indigo-900">
      <Navbar publicOnly={true} />

      <main className="flex-1">
        <section className="landing-hero mx-auto grid w-full max-w-7xl items-center gap-12 px-4 pb-14 pt-14 sm:px-6 sm:pt-20 lg:grid-cols-[0.94fr_1.06fr] lg:gap-10 lg:px-8 lg:pb-20 lg:pt-16">
          <div className="landing-hero-copy mx-auto max-w-2xl text-center lg:mx-0 lg:text-left">
            <div className="landing-eyebrow mb-6 inline-flex items-center gap-2 rounded-full border border-indigo-100 bg-indigo-50/80 px-3.5 py-1.5 text-xs font-semibold text-indigo-800">
              <Sparkles className="h-3.5 w-3.5 text-indigo-600" />
              <span>AI-Powered Interview Preparation</span>
            </div>

            <h1 className="mx-auto max-w-2xl text-4xl font-extrabold leading-[1.12] tracking-tight text-slate-900 sm:text-5xl md:text-6xl lg:mx-0">
              Prepare Smarter.{' '}
              <span className="text-indigo-600">Interview Better.</span>
            </h1>

            <p className="mx-auto mt-5 max-w-xl text-base leading-7 text-slate-600 sm:text-lg sm:leading-8 lg:mx-0">
              Practice mock interviews, analyze your resume, and improve your answers with personalized AI feedback.
            </p>

            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row lg:justify-start">
              <Link to="/signup" className="w-full sm:w-auto">
                <Button
                  size="md"
                  className="landing-primary-cta w-full rounded-xl px-5 py-3 text-sm shadow-lg sm:w-auto"
                >
                  <span className="inline-flex items-center gap-2">
                    Get Started
                    <ArrowRight className="landing-cta-arrow h-4 w-4" />
                  </span>
                </Button>
              </Link>
              <Link to="/login" className="w-full sm:w-auto">
                <Button
                  variant="outline"
                  size="md"
                  className="landing-secondary-cta w-full rounded-xl border-indigo-200 px-5 py-3 text-sm text-slate-700 shadow-none hover:border-indigo-300 hover:bg-indigo-50/60 hover:text-indigo-700 sm:w-auto"
                >
                  Log In
                </Button>
              </Link>
            </div>

            <p className="mt-5 text-xs font-medium tracking-wide text-slate-500">
              A clearer path from preparation to your next opportunity
            </p>
          </div>

          <div className="landing-showcase" aria-label="Skillix features">
            <div className="landing-showcase-halo" aria-hidden="true" />
            {features.map(({ title, description, detail, icon: Icon, className }) => (
              <article
                key={title}
                className={`landing-feature-card ${className}`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="landing-feature-icon">
                    <Icon className="h-5 w-5" strokeWidth={1.8} />
                  </div>
                  <span className="landing-feature-mark" aria-hidden="true">
                    <ArrowRight className="h-3.5 w-3.5" />
                  </span>
                </div>
                <div className="mt-5">
                  <p className="landing-feature-detail">{detail}</p>
                  <h2 className="mt-1.5 text-lg font-bold tracking-tight text-slate-900">
                    {title}
                  </h2>
                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    {description}
                  </p>
                </div>
              </article>
            ))}
          </div>
        </section>
      </main>

      <footer className="border-t border-slate-100 py-6 text-center text-xs text-slate-400">
        <p>&copy; {currentYear} Skillix AI. All rights reserved.</p>
      </footer>
    </div>
  );
};
