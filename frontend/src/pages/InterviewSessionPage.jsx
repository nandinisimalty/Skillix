import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { apiService } from '../services/api';
import { demoStorage } from '../services/demoData';
import { 
  BrainCircuit, 
  Sparkles, 
  CheckCircle2, 
  AlertCircle, 
  HelpCircle, 
  Lightbulb, 
  ArrowRight, 
  Send, 
  StopCircle, 
  ThumbsUp, 
  AlertTriangle,
  Award,
  ChevronRight
} from 'lucide-react';
import { Button } from '../components/common/Button';
import { Card } from '../components/common/Card';
import { Badge } from '../components/common/Badge';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { Navbar } from '../components/common/Navbar';

const normalizeEvaluationData = (value) => {
  if (!value || typeof value !== 'object') {
    return null;
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
    what_was_correct: Array.isArray(value.what_was_correct)
      ? value.what_was_correct.filter(Boolean)
      : Array.isArray(value.what_went_well)
        ? value.what_went_well.filter(Boolean)
        : [],
    what_was_wrong: Array.isArray(value.what_was_wrong)
      ? value.what_was_wrong.filter(Boolean)
      : Array.isArray(value.what_is_missing)
        ? value.what_is_missing.filter(Boolean)
        : [],
    missing_concepts: Array.isArray(value.missing_concepts) ? value.missing_concepts.filter(Boolean) : [],
    explanation: value.explanation || value.summary || 'No detailed explanation was provided for this evaluation.',
    improved_answer: value.improved_answer || value.better_answer_example || 'A stronger answer would explain the core idea clearly and include a concrete example.',
    is_mock_response: Boolean(value.is_mock_response)
  };
};

export const InterviewSessionPage = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const config = location.state || {
    targetRole: 'Software Engineer',
    interviewType: 'Technical',
    difficulty: 'Medium',
    numQuestions: 5,
    topics: ['Python', 'SQL', 'Data Structures']
  };

  const [loadingQuestions, setLoadingQuestions] = useState(true);
  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  const [answers, setAnswers] = useState({});
  const [currentAnswerText, setCurrentAnswerText] = useState('');
  
  const [evaluations, setEvaluations] = useState({});
  const [evaluating, setEvaluating] = useState(false);
  const [showHints, setShowHints] = useState(false);
  const [error, setError] = useState('');

  // Fetch AI generated questions on mount
  useEffect(() => {
    let isMounted = true;
    const loadQuestions = async () => {
      try {
        setLoadingQuestions(true);
        const res = await apiService.generateQuestions({
          targetRole: config.targetRole,
          interviewType: config.interviewType,
          difficulty: config.difficulty,
          numQuestions: config.numQuestions,
          topics: config.topics
        });
        if (isMounted) {
          setQuestions(res.questions || []);
        }
      } catch (err) {
        console.error("Error loading questions", err);
        if (isMounted) {
          setError("Failed to generate AI questions. Please try again.");
        }
      } finally {
        if (isMounted) setLoadingQuestions(false);
      }
    };
    loadQuestions();
    return () => { isMounted = false; };
  }, []);

  const currentQ = questions[currentIndex];

  const handleEvaluateAnswer = async (e) => {
    e?.preventDefault();
    if (!currentAnswerText.trim()) {
      setError('Please type an answer before submitting.');
      return;
    }

    try {
      setEvaluating(true);
      setError('');
      setEvaluations((prev) => ({ ...prev, [currentIndex]: null }));

      const evalRes = await apiService.evaluateAnswer({
        targetRole: config.targetRole,
        interviewType: config.interviewType,
        question: currentQ.question,
        userAnswer: currentAnswerText,
        questionIndex: currentIndex
      });

      const normalizedEval = normalizeEvaluationData(evalRes);

      setAnswers((prev) => ({ ...prev, [currentIndex]: currentAnswerText }));
      setEvaluations((prev) => ({ ...prev, [currentIndex]: normalizedEval }));
    } catch (err) {
      console.error(err);
      setError('Gemini evaluation is unavailable right now. Your submitted answer is still saved, and you can retry without losing it.');
    } finally {
      setEvaluating(false);
    }
  };

  const handleNext = () => {
    setShowHints(false);
    setError('');
    if (currentIndex < questions.length - 1) {
      const nextIdx = currentIndex + 1;
      setCurrentIndex(nextIdx);
      setCurrentAnswerText(answers[nextIdx] || '');
    } else {
      finishInterview();
    }
  };

  const finishInterview = () => {
    // Compile final interview report
    const finalAnswers = questions.map((q, idx) => answers[idx] || 'No answer provided.');
    const finalFeedback = questions.map((q, idx) => evaluations[idx] || {
      score: 50,
      what_went_well: ["Submitted response"],
      what_is_missing: ["Detailed answer elaboration"],
      areas_for_improvement: ["Provide complete answer text"],
      better_answer_example: "Provide full context."
    });

    const scores = finalFeedback.map((f) => f.score || 0);
    const overallScore = Math.round(scores.reduce((a, b) => a + b, 0) / (scores.length || 1));

    const reportData = {
      targetRole: config.targetRole,
      interviewType: config.interviewType,
      difficulty: config.difficulty,
      questions: questions,
      answers: finalAnswers,
      feedback: finalFeedback,
      scores: scores,
      overallScore: overallScore,
      completedAt: new Date().toISOString()
    };

    // Save report to Storage / Firestore
    demoStorage.saveInterview(reportData);

    navigate('/interview/report', { state: { report: reportData } });
  };

  if (loadingQuestions) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
        <Navbar />
        <main className="flex-1 flex items-center justify-center">
          <LoadingSpinner message={`Generating ${config.numQuestions} ${config.difficulty} ${config.interviewType} questions with Gemini AI...`} fullPage />
        </main>
      </div>
    );
  }

  const currentEval = normalizeEvaluationData(evaluations[currentIndex]);
  const progressPercent = Math.round(((currentIndex + 1) / (questions.length || 1)) * 100);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      <Navbar />

      <main className="flex-1 max-w-4xl mx-auto w-full px-4 sm:px-6 py-8 space-y-6">
        
        {/* Progress Bar & Header */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="w-10 h-10 rounded-xl gradient-bg text-white flex items-center justify-center font-bold text-sm">
              Q{currentIndex + 1}
            </div>
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Question {currentIndex + 1} of {questions.length}
              </p>
              <h2 className="text-sm font-bold text-slate-900">{config.targetRole} • {config.interviewType}</h2>
            </div>
          </div>

          <div className="w-full sm:w-64 space-y-1">
            <div className="flex justify-between text-[11px] font-bold text-slate-500">
              <span>Progress</span>
              <span>{progressPercent}%</span>
            </div>
            <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full gradient-bg transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>

          <Button variant="danger" size="sm" icon={StopCircle} onClick={finishInterview}>
            End Interview
          </Button>
        </div>

        {/* Question Card */}
        {currentQ && (
          <Card className="p-6 sm:p-8 border-indigo-100 shadow-md space-y-4">
            
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Badge variant="indigo">{currentQ.category || 'Core Concepts'}</Badge>
                <Badge variant="purple">{currentQ.difficulty || config.difficulty}</Badge>
              </div>

              {currentQ.hints && currentQ.hints.length > 0 && (
                <button
                  type="button"
                  onClick={() => setShowHints(!showHints)}
                  className="text-xs text-amber-600 hover:text-amber-700 font-semibold flex items-center gap-1 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200/80"
                >
                  <Lightbulb className="w-3.5 h-3.5" />
                  {showHints ? 'Hide Hints' : 'View Hints'}
                </button>
              )}
            </div>

            {/* Question Text */}
            <h3 className="text-lg sm:text-xl font-extrabold text-slate-900 leading-snug">
              {currentQ.question}
            </h3>

            {/* Expandable Hints */}
            {showHints && currentQ.hints && (
              <div className="p-3.5 bg-amber-50/70 border border-amber-200 rounded-xl text-xs text-amber-900 space-y-1">
                <p className="font-bold flex items-center gap-1 text-amber-800">
                  <Lightbulb className="w-3.5 h-3.5 text-amber-600" /> Key Hints:
                </p>
                <ul className="list-disc list-inside space-y-0.5">
                  {currentQ.hints.map((hint, idx) => (
                    <li key={idx}>{hint}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Answer Input Area */}
            <form onSubmit={handleEvaluateAnswer} className="space-y-4 pt-2">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Type Your Detailed Response Below:
                </label>
                <textarea
                  rows={6}
                  value={currentAnswerText}
                  onChange={(e) => setCurrentAnswerText(e.target.value)}
                  placeholder="Explain your approach, technical details, code structure, or STAR situation..."
                  className="w-full p-4 text-sm bg-slate-50 border border-slate-300 rounded-2xl focus:ring-2 focus:ring-indigo-500 focus:bg-white focus:outline-none transition-all leading-relaxed"
                />
              </div>

              {error && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
                <p className="text-xs text-slate-400">
                  {currentAnswerText.trim().length} characters typed
                </p>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <Button
                    type="submit"
                    isLoading={evaluating}
                    icon={Send}
                    className="w-full sm:w-auto"
                  >
                    {currentEval ? 'Re-evaluate Answer' : 'Submit Answer'}
                  </Button>

                  {currentEval && (
                    <Button
                      type="button"
                      variant="dark"
                      onClick={handleNext}
                      icon={ChevronRight}
                      className="w-full sm:w-auto"
                    >
                      {currentIndex === questions.length - 1 ? 'Finish & View Report' : 'Next Question'}
                    </Button>
                  )}
                </div>
              </div>
            </form>

          </Card>
        )}

        {/* Loading Answer Evaluation */}
        {evaluating && <LoadingSpinner message="Gemini AI is evaluating your response..." />}

        {/* Display Answer Evaluation Result */}
        {currentEval && !evaluating && (
          <Card className="p-6 border-indigo-200 bg-gradient-to-b from-white to-indigo-50/20 space-y-5 shadow-lg animate-pulse-subtle">
            {currentEval.is_mock_response && (
              <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
                This is a local fallback evaluation because the Gemini API is not configured. Add the API key to enable live answer scoring.
              </div>
            )}

            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-indigo-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-indigo-600 text-white font-extrabold flex items-center justify-center text-lg">
                  {currentEval.score}
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 text-base">AI Interview Evaluation</h4>
                  <p className="text-xs text-slate-500">Scored out of 100</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Badge variant={currentEval.score >= 80 ? 'emerald' : currentEval.score >= 65 ? 'indigo' : 'amber'}>
                  {currentEval.verdict}
                </Badge>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="p-4 rounded-xl bg-emerald-50/60 border border-emerald-200/80 space-y-2">
                <p className="font-bold text-emerald-900 flex items-center gap-1.5">
                  <ThumbsUp className="w-4 h-4 text-emerald-600" /> What You Got Right:
                </p>
                {currentEval.what_was_correct?.length ? (
                  <ul className="space-y-1 text-slate-700">
                    {currentEval.what_was_correct.map((item, idx) => (
                      <li key={idx} className="flex items-start gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-slate-600">No major strengths were identified in this response.</p>
                )}
              </div>

              <div className="p-4 rounded-xl bg-amber-50/60 border border-amber-200/80 space-y-2">
                <p className="font-bold text-amber-900 flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 text-amber-600" /> What Needs Improvement:
                </p>
                {currentEval.what_was_wrong?.length ? (
                  <ul className="space-y-1 text-slate-700">
                    {currentEval.what_was_wrong.map((item, idx) => (
                      <li key={idx} className="flex items-start gap-1.5">
                        <AlertCircle className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-slate-600">No significant gaps were identified in the submitted answer.</p>
                )}
              </div>
            </div>

            {currentEval.missing_concepts?.length > 0 && (
              <div className="p-4 rounded-xl bg-slate-100 border border-slate-200 text-xs text-slate-700">
                <p className="font-bold text-slate-800 mb-2">Missing Concepts:</p>
                <ul className="list-disc list-inside space-y-1">
                  {currentEval.missing_concepts.map((item, idx) => (
                    <li key={idx}>{item}</li>
                  ))}
                </ul>
              </div>
            )}

            <div className="p-4 rounded-xl bg-indigo-50/60 border border-indigo-200 text-xs text-slate-700 space-y-2">
              <p className="font-bold text-indigo-900 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-indigo-600" /> Explanation:
              </p>
              <p className="leading-relaxed text-slate-700">{currentEval.explanation}</p>
            </div>

            {currentEval.improved_answer && (
              <div className="p-4 rounded-xl bg-slate-900 text-slate-200 text-xs space-y-2">
                <p className="font-bold text-indigo-300 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-indigo-400" /> Improved Answer:
                </p>
                <p className="leading-relaxed text-slate-300">{currentEval.improved_answer}</p>
              </div>
            )}

            <div className="pt-2 flex justify-end">
              <Button size="md" icon={ArrowRight} onClick={handleNext} className="gradient-glow">
                {currentIndex === questions.length - 1 ? 'Finish & View Final Report' : 'Proceed to Next Question'}
              </Button>
            </div>
          </Card>
        )}

      </main>
    </div>
  );
};
