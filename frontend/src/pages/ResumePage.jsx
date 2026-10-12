import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { apiService } from '../services/api';
import { demoStorage } from '../services/demoData';
import { 
  FileText, 
  UploadCloud, 
  CheckCircle2, 
  AlertCircle, 
  Sparkles, 
  Code, 
  GraduationCap, 
  Briefcase, 
  ThumbsUp, 
  AlertTriangle, 
  HelpCircle, 
  ArrowRight,
  FileCheck,
  RefreshCw,
  BrainCircuit
} from 'lucide-react';
import { Button } from '../components/common/Button';
import { Card } from '../components/common/Card';
import { Badge } from '../components/common/Badge';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { Navbar } from '../components/common/Navbar';


export const ResumePage = () => {
  const { userProfile } = useAuth();
  const navigate = useNavigate();

  const [file, setFile] = useState(null);
  const [targetRole, setTargetRole] = useState(userProfile?.targetRole || 'Software Engineer');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [analysis, setAnalysis] = useState(() => demoStorage.getResumeAnalysis());

  const handleFileChange = (e) => {
    setError('');
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      if (!selectedFile.name.lowerCase?.endsWith('.pdf') && selectedFile.type !== 'application/pdf') {
        setError('Only PDF resume files are accepted.');
        return;
      }
      if (selectedFile.size > 10 * 1024 * 1024) {
        setError('File size exceeds the 10MB limit.');
        return;
      }
      setFile(selectedFile);
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) {
      setError('Please select a PDF resume file to upload.');
      return;
    }

    try {
      setLoading(true);
      setError('');

      const result = await apiService.analyzeResume(file, targetRole);
      setAnalysis(result);
      demoStorage.saveResumeAnalysis(result);
    } catch (err) {
      console.error(err);
      setError(err.message || 'Failed to analyze PDF resume. Please ensure it contains readable text.');
    } finally {
      setLoading(false);
    }
  };

  const startResumeInterview = () => {
    navigate('/interview/setup', {
      state: {
        targetRole,
        topics: analysis?.detected_skills || ['Python', 'React', 'SQL']
      }
    });
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      <Navbar />

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        
        {/* Header */}
        <div className="max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-semibold mb-2">
            <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
            <span>PyMuPDF + Gemini 2.5 AI Analysis</span>
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">AI Resume Analyzer</h1>
          <p className="text-sm text-slate-500 mt-1">
            Upload your PDF resume to extract detected technical skills, identify key strengths, and get tailored interview questions.
          </p>
        </div>

        {/* Upload Card */}
        <Card className="p-6 sm:p-8 shadow-md border-indigo-100">
          <form onSubmit={handleUpload} className="space-y-6">
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1">Upload PDF Resume *</label>
                <div className="border-2 border-dashed border-slate-300 hover:border-indigo-400 rounded-2xl p-6 text-center bg-slate-50/50 hover:bg-indigo-50/20 transition-all cursor-pointer relative">
                  <input
                    type="file"
                    accept=".pdf,application/pdf"
                    onChange={handleFileChange}
                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                  />
                  <div className="flex flex-col items-center justify-center gap-2">
                    <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                      <UploadCloud className="w-5 h-5" />
                    </div>
                    {file ? (
                      <div>
                        <p className="text-sm font-bold text-slate-900 flex items-center gap-1.5 justify-center">
                          <FileCheck className="w-4 h-4 text-emerald-600" />
                          {file.name}
                        </p>
                        <p className="text-xs text-slate-400 mt-0.5">{(file.size / (1024 * 1024)).toFixed(2)} MB PDF</p>
                      </div>
                    ) : (
                      <div>
                        <p className="text-sm font-semibold text-slate-700">Click or Drag & Drop PDF Resume</p>
                        <p className="text-xs text-slate-400 mt-0.5">Maximum file size 10MB</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Target Job Role</label>
                <input
                  type="text"
                  value={targetRole}
                  onChange={(e) => setTargetRole(e.target.value)}
                  placeholder="e.g. Software Engineer"
                  className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white focus:outline-none transition-all"
                />
                <p className="text-[11px] text-slate-400 mt-2">
                  Gemini will evaluate your resume alignment specifically against this position.
                </p>
              </div>
            </div>

            {error && (
              <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div className="flex items-center justify-end">
              <Button
                type="submit"
                size="lg"
                isLoading={loading}
                icon={Sparkles}
                disabled={!file}
              >
                Analyze Resume with Gemini
              </Button>
            </div>

          </form>
        </Card>

        {/* Loading Indicator */}
        {loading && <LoadingSpinner message="Extracting text with PyMuPDF & Analyzing with Gemini..." />}

        {/* Analysis Results Display */}
        {analysis && !loading && (
          <div className="space-y-6">
            
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
              <div>
                <h2 className="text-xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
                  <FileCheck className="w-5 h-5 text-indigo-600" />
                  Resume Analysis Results
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Extracted for role: <span className="font-bold text-slate-800">{targetRole}</span>
                </p>
              </div>

              <Button size="md" icon={BrainCircuit} onClick={startResumeInterview} className="gradient-glow">
                Start Mock Interview Based on Resume
              </Button>
            </div>

            {/* Grid 1: Skills & Executive Summary */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              {/* Executive Summary */}
              <Card className="p-6 md:col-span-2 border-slate-200">
                <h3 className="text-sm font-bold text-slate-900 mb-2 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-indigo-600" />
                  Executive Summary
                </h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                  {analysis.summary || "Your resume exhibits solid technical preparation for software engineering roles."}
                </p>
              </Card>

              {/* Detected Skills */}
              <Card className="p-6 border-slate-200">
                <h3 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
                  <Code className="w-4 h-4 text-indigo-600" />
                  Detected Skills
                </h3>
                <div className="flex flex-wrap gap-1.5">
                  {analysis.detected_skills?.map((skill, i) => (
                    <Badge key={i} variant="indigo">{skill}</Badge>
                  ))}
                </div>
              </Card>

            </div>

            {/* Grid 2: Strengths & Improvements */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Strengths */}
              <Card className="p-6 border-emerald-100 bg-emerald-50/20">
                <h3 className="text-sm font-bold text-emerald-900 mb-3 flex items-center gap-2">
                  <ThumbsUp className="w-4 h-4 text-emerald-600" />
                  Resume Strengths
                </h3>
                <ul className="space-y-2 text-xs text-slate-700">
                  {analysis.strengths?.map((str, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                      <span>{str}</span>
                    </li>
                  ))}
                </ul>
              </Card>

              {/* Areas for Improvement */}
              <Card className="p-6 border-amber-100 bg-amber-50/20">
                <h3 className="text-sm font-bold text-amber-900 mb-3 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-600" />
                  Areas for Improvement
                </h3>
                <ul className="space-y-2 text-xs text-slate-700">
                  {analysis.areas_for_improvement?.map((gap, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <AlertCircle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                      <span>{gap}</span>
                    </li>
                  ))}
                </ul>
              </Card>

            </div>

            {/* Suggestions & Actionable Advice */}
            <Card className="p-6 border-slate-200">
              <h3 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-purple-600" />
                Actionable Recommendations to Improve Your Resume
              </h3>
              <ul className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs text-slate-700">
                {analysis.suggestions?.map((sug, idx) => (
                  <li key={idx} className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 flex items-start gap-2">
                    <span className="w-5 h-5 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                      {idx + 1}
                    </span>
                    <span>{sug}</span>
                  </li>
                ))}
              </ul>
            </Card>

            {/* Resume Questions */}
            <Card className="p-6 border-indigo-100">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <HelpCircle className="w-4 h-4 text-indigo-600" />
                  Possible Interview Questions Based on Your Resume
                </h3>
                <Badge variant="purple">AI Generated</Badge>
              </div>

              <div className="space-y-2.5">
                {analysis.possible_interview_questions?.map((q, idx) => (
                  <div key={idx} className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-medium text-slate-800 flex items-start gap-3">
                    <span className="font-bold text-indigo-600">Q{idx + 1}.</span>
                    <span>{q}</span>
                  </div>
                ))}
              </div>
            </Card>

          </div>
        )}

      </main>
    </div>
  );
};
