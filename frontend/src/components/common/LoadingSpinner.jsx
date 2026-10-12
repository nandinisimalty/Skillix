import React from 'react';
import { Loader2, Sparkles } from 'lucide-react';

export const LoadingSpinner = ({ message = "AI is thinking...", fullPage = false }) => {
  const content = (
    <div className="flex flex-col items-center justify-center gap-3 p-8 text-center">
      <div className="relative">
        <div className="w-12 h-12 rounded-2xl gradient-bg flex items-center justify-center text-white shadow-lg animate-pulse">
          <Sparkles className="w-6 h-6 animate-spin" />
        </div>
      </div>
      <div className="space-y-1">
        <p className="text-sm font-semibold text-slate-800 flex items-center gap-1.5 justify-center">
          <Loader2 className="w-4 h-4 animate-spin text-indigo-600" />
          {message}
        </p>
        <p className="text-xs text-slate-500">Evaluating response with Gemini AI model...</p>
      </div>
    </div>
  );

  if (fullPage) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        {content}
      </div>
    );
  }

  return content;
};
