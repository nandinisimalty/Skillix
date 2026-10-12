import React from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { 
  Award, 
  Sparkles, 
  CheckCircle2, 
  AlertTriangle, 
  ThumbsUp, 
  ArrowRight, 
  RotateCcw, 
  LayoutDashboard,
  BookOpen,
  HelpCircle,
  FileCheck
} from 'lucide-react';
import { Button } from '../components/common/Button';
import { Card } from '../components/common/Card';
import { Badge } from '../components/common/Badge';
import { Navbar } from '../components/common/Navbar';

const normalizeFeedbackData = (value) => {
  if (!value || typeof value !== 'object') {
    return {
      score: 0,
      verdict: 'Incorrect',
      what_was_correct: [],
      what_was_wrong: [],
      missing_concepts: [],
      explanation: 'No evaluation details were available for this question.',
      improved_answer: '',
      is_mock_response: true
    };
  }

  const score = Number.isFinite(Number(value.score)) ? Math.max(0, Math.min(100, Number(value.score))) : 0;
  const verdict = typeof value.verdict === 'string' && value.verdict.trim()
    ? value.verdict.trim()
    : score >= 80
      ? 'Correct'
      : score >= 65
        ? 'Mostly Correct'
        : score >= 40
          ? 'Partially Correct'
          : 'Incorrect';

  return {
    score,
    verdict,
    what_was_correct: Array.isArray(value.what_was_correct) ? value.what_was_correct.filter(Boolean) : Array.isArray(value.what_went_well) ? value.what_went_well.filter(Boolean) : [],
    what_was_wrong: Array.isArray(value.what_was_wrong) ? value.what_was_wrong.filter(Boolean) : Array.isArray(value.what_is_missing) ? value.what_is_missing.filter(Boolean) : [],
    missing_concepts: Array.isArray(value.missing_concepts) ? value.missing_concepts.filter(Boolean) : [],
    explanation: value.explanation || value.summary || 'No explanation was included with this evaluation.',
    improved_answer: value.improved_answer || value.better_answer_example || '',
    is_mock_response: Boolean(value.is_mock_response)
  };
};

export const InterviewReportPage = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const report = location.state?.report || {
    targetRole: 'Software Engineer',
    interviewType: 'Technical',
    difficulty: 'Medium',
    overallScore: 82,
    questions: [
      { question: "Explain RESTful API design principles." },
      { question: "Difference between SQL and NoSQL databases?" }
    ],
    answers: ["REST APIs use standard HTTP verbs...", "SQL is relational with fixed schema..."],
    feedback: [
      { score: 85, what_went_well: ["Clear HTTP verb explanation"], what_is_missing: ["Status code details"], better_answer_example: "Use standard URIs..." },
      { score: 80, what_went_well: ["Good schema comparison"], what_is_missing: ["ACID compliance details"], better_answer_example: "Relational tables..." }
    ],
    completedAt: new Date().toISOString()
  };

  const normalizedFeedback = (report.feedback || []).map(normalizeFeedbackData);

  const handleGenerateStudyPlan = () => {
    const weakTopics = [];
    normalizedFeedback.forEach((f) => {
      if (f.what_was_wrong?.length) {
        weakTopics.push(...f.what_was_wrong);
      }
      if (f.missing_concepts?.length) {
        weakTopics.push(...f.missing_concepts);
      }
    });

    navigate('/study-plan', {
      state: {
        targetRole: report.targetRole,
        weakTopics: weakTopics.slice(0, 4)
      }
    });
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      <Navbar />

      <main className="flex-1 max-w-4xl mx-auto w-full px-4 sm:px-6 py-8 space-y-8">
        
        {/* Header Banner */}
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-purple-950 rounded-3xl p-6 sm:p-8 text-white shadow-xl flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="space-y-2 text-center sm:text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-indigo-200 text-xs font-semibold backdrop-blur-md">
              <Sparkles className="w-3.5 h-3.5 text-indigo-300" />
              <span>Interview Session Completed</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">AI Interview Report</h1>
            <p className="text-sm text-slate-300">
              {report.targetRole} • {report.interviewType} Round ({report.difficulty})
            </p>
          </div>

          {/* Overall Computed Score */}
          <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/20 text-center min-w-[140px]">
            <span className="text-xs font-bold text-slate-300 uppercase tracking-wider block mb-1">Overall Score</span>
            <div className="text-4xl font-extrabold text-white gradient-text">
              {report.overallScore}%
            </div>
            <span className="text-[10px] text-indigo-200 font-semibold block mt-1">
              Calculated Average
            </span>
          </div>
        </div>

        {/* Action Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center gap-2">
            <Link to="/dashboard">
              <Button variant="outline" size="sm" icon={LayoutDashboard}>
                Return to Dashboard
              </Button>
            </Link>
            <Link to="/interview/setup">
              <Button variant="secondary" size="sm" icon={RotateCcw}>
                Start Another Interview
              </Button>
            </Link>
          </div>

          <Button size="sm" icon={BookOpen} onClick={handleGenerateStudyPlan} className="gradient-glow">
            Generate Personalized Study Plan
          </Button>
        </div>

        {/* Question Breakdown */}
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-slate-900 tracking-tight">Detailed Question Breakdown</h2>

          {normalizedFeedback.some((feedback) => feedback.is_mock_response) && (
            <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-800">
              One or more evaluations used local fallback responses because the Gemini API is not configured. Live AI scoring will replace these once the backend key is added.
            </div>
          )}

          {report.questions.map((q, idx) => {
            const ans = report.answers[idx] || '';
            const fb = normalizedFeedback[idx] || normalizeFeedbackData(report.feedback?.[idx]);

            return (
              <Card key={idx} className="p-6 border-slate-200 space-y-4 shadow-sm">
                
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <span className="text-xs font-bold text-indigo-600 uppercase tracking-wider">
                    Question {idx + 1} of {report.questions.length}
                  </span>

                  <Badge variant={fb.score >= 80 ? 'emerald' : fb.score >= 65 ? 'indigo' : 'amber'}>
                    Score: {fb.score || 0} / 100
                  </Badge>
                </div>

                <h3 className="font-extrabold text-slate-900 text-base">
                  {q.question}
                </h3>

                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-700 space-y-1">
                  <span className="font-bold text-slate-900 block">Your Submitted Answer:</span>
                  <p className="leading-relaxed whitespace-pre-wrap">{ans}</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="p-3 bg-emerald-50/50 rounded-xl border border-emerald-200/60 space-y-1">
                    <span className="font-bold text-emerald-900 flex items-center gap-1">
                      <ThumbsUp className="w-3.5 h-3.5 text-emerald-600" /> What You Got Right:
                    </span>
                    {fb.what_was_correct?.length ? (
                      <ul className="space-y-0.5 text-slate-700 list-disc list-inside">
                        {fb.what_was_correct.map((item, i) => (
                          <li key={i}>{item}</li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-slate-600">No major strengths were identified.</p>
                    )}
                  </div>

                  <div className="p-3 bg-amber-50/50 rounded-xl border border-amber-200/60 space-y-1">
                    <span className="font-bold text-amber-900 flex items-center gap-1">
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-600" /> What Needs Improvement:
                    </span>
                    {fb.what_was_wrong?.length ? (
                      <ul className="space-y-0.5 text-slate-700 list-disc list-inside">
                        {fb.what_was_wrong.map((item, i) => (
                          <li key={i}>{item}</li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-slate-600">No significant issues were identified.</p>
                    )}
                  </div>
                </div>

                {fb.missing_concepts?.length > 0 && (
                  <div className="p-3 rounded-xl bg-slate-100 border border-slate-200 text-xs text-slate-700">
                    <span className="font-bold text-slate-800 block mb-1">Missing Concepts:</span>
                    <ul className="list-disc list-inside space-y-0.5">
                      {fb.missing_concepts.map((item, i) => (
                        <li key={i}>{item}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {fb.explanation && (
                  <div className="p-3 rounded-xl bg-indigo-50 border border-indigo-200 text-xs text-slate-700">
                    <span className="font-bold text-indigo-900 block mb-1">Explanation:</span>
                    <p className="leading-relaxed">{fb.explanation}</p>
                  </div>
                )}

                {fb.improved_answer && (
                  <div className="p-3 rounded-xl bg-slate-900 text-slate-200 text-xs space-y-1">
                    <span className="font-bold text-indigo-300 block">Improved Answer:</span>
                    <p className="leading-relaxed text-slate-300">{fb.improved_answer}</p>
                  </div>
                )}

              </Card>
            );
          })}
        </div>

      </main>
    </div>
  );
};
