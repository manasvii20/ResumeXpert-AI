import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Upload,
  FileText,
  Sparkles,
  ArrowLeft,
  Loader2,
  LayoutTemplate,
  X,
  Download,
} from 'lucide-react';
import axiosInstance from '../utils/axiosInstance';
import { API_PATHS } from '../utils/apiPaths';
import toast, { Toaster } from 'react-hot-toast';
import ATSScoreCard from '../components/ATSScoreCard';
import KeywordSuggestions from '../components/KeywordSuggestions';
import ResumeFeedback from '../components/ResumeFeedback';
import ResumeQualityDashboard from '../components/ResumeQualityDashboard';
import BulletPointRewriter from '../components/BulletPointRewriter';

const ResumeAnalyzer = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const resultsRef = useRef(null);

  const [inputMode, setInputMode] = useState('text'); // 'text' or 'pdf'
  const [resumeText, setResumeText] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [dragActive, setDragActive] = useState(false);

  const handleFileSelect = (file) => {
    if (file && file.type === 'application/pdf') {
      setSelectedFile(file);
      setInputMode('pdf');
    } else {
      toast.error('Please select a valid PDF file');
    }
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleAnalyze = async () => {
    if (inputMode === 'text' && !resumeText.trim()) {
      toast.error('Please paste your resume text');
      return;
    }
    if (inputMode === 'pdf' && !selectedFile) {
      toast.error('Please upload a PDF file');
      return;
    }
    if (!jobDescription.trim()) {
      toast.error('Please enter a job description');
      return;
    }

    setIsAnalyzing(true);
    setAnalysisResult(null);

    try {
      let response;

      if (inputMode === 'pdf' && selectedFile) {
        const formData = new FormData();
        formData.append('resumeFile', selectedFile);
        formData.append('jobDescription', jobDescription);

        response = await axiosInstance.post(
          API_PATHS.AI.ANALYZE_RESUME,
          formData,
          {
            headers: { 'Content-Type': 'multipart/form-data' },
            timeout: 60000,
          }
        );
      } else {
        response = await axiosInstance.post(
          API_PATHS.AI.ANALYZE_RESUME,
          { resumeText, jobDescription },
          { timeout: 60000 }
        );
      }

      if (response.data.success) {
        setAnalysisResult(response.data.data);
        toast.success('Analysis complete!');
        setTimeout(() => {
          resultsRef.current?.scrollIntoView({ behavior: 'smooth' });
        }, 300);
      } else {
        toast.error(response.data.error || 'Analysis failed');
      }
    } catch (error) {
      console.error('Analysis error:', error);
      toast.error(
        error.response?.data?.error || 'Failed to analyze resume. Please try again.'
      );
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleDownloadReport = () => {
    if (!analysisResult) return;

    const report = `
═══════════════════════════════════════
       RESUMEXPERT — AI ANALYSIS REPORT
═══════════════════════════════════════

ATS SCORE: ${analysisResult.ats_score}/100
JOB MATCH SCORE: ${analysisResult.match_score}/100

─── RESUME QUALITY METRICS ───
Keyword Coverage: ${analysisResult.resume_quality_metrics?.keyword_coverage || 0}%
Bullet Strength: ${analysisResult.resume_quality_metrics?.bullet_strength || 0}%
Skills Coverage: ${analysisResult.resume_quality_metrics?.skills_coverage || 0}%
Formatting Score: ${analysisResult.resume_quality_metrics?.formatting_score || 0}%

─── MATCHED KEYWORDS ───
${(analysisResult.matched_keywords || []).join(', ') || 'None'}

─── MISSING KEYWORDS ───
${(analysisResult.missing_keywords || []).join(', ') || 'None'}

─── SUGGESTED KEYWORDS ───
${(analysisResult.keyword_suggestions || []).join(', ') || 'None'}

─── IMPROVEMENT SUGGESTIONS ───
${(analysisResult.improvement_suggestions || []).map((s, i) => `${i + 1}. ${s}`).join('\n') || 'None'}

─── FORMATTING FEEDBACK ───
${(analysisResult.formatting_feedback || []).map((s, i) => `${i + 1}. ${s}`).join('\n') || 'None'}

─── IMPROVED BULLET POINTS ───
${(analysisResult.rewritten_bullets || []).map((b, i) =>
      `${i + 1}. Original: ${b.original}\n   Improved: ${b.improved}`
    ).join('\n\n') || 'None'}

═══════════════════════════════════════
Generated by ResumeXpert AI Analyzer
═══════════════════════════════════════
    `.trim();

    const blob = new Blob([report], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'ResumeXpert_Analysis_Report.txt';
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Report downloaded!');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Ambient glow effects */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-fuchsia-600/8 rounded-full blur-3xl"></div>
      </div>

      {/* Header */}
      <header className="relative z-10 border-b border-slate-800/50 backdrop-blur-md bg-slate-950/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors"
          >
            <ArrowLeft size={18} />
            <span className="text-sm font-medium">Back</span>
          </button>

          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-fuchsia-500 flex items-center justify-center">
              <LayoutTemplate size={16} className="text-white" />
            </div>
            <span className="text-lg font-bold bg-gradient-to-r from-purple-400 to-fuchsia-400 bg-clip-text text-transparent">
              ResumeXpert AI
            </span>
          </div>

          <div className="w-20"></div>
        </div>
      </header>

      <main className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Hero section */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-purple-500/10 border border-purple-500/20 mb-6">
            <Sparkles size={14} className="text-purple-400" />
            <span className="text-xs font-semibold text-purple-400 uppercase tracking-wider">
              AI-Powered Analysis
            </span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-white mb-4">
            Analyze Your Resume with{' '}
            <span className="bg-gradient-to-r from-purple-400 to-fuchsia-400 bg-clip-text text-transparent">
              AI
            </span>
          </h1>
          <p className="text-slate-400 max-w-2xl mx-auto">
            Get instant ATS scoring, keyword analysis, and actionable suggestions to
            make your resume stand out.
          </p>
        </div>

        {/* Input Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Resume Input */}
          <div className="bg-slate-900/80 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-6">
            <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
              <FileText size={16} className="text-purple-400" />
              Your Resume
            </h3>

            {/* Input mode toggle */}
            <div className="flex gap-2 mb-4">
              <button
                onClick={() => setInputMode('text')}
                className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  inputMode === 'text'
                    ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                    : 'bg-slate-800 text-slate-500 border border-slate-700/50 hover:text-slate-300'
                }`}
              >
                Paste Text
              </button>
              <button
                onClick={() => setInputMode('pdf')}
                className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  inputMode === 'pdf'
                    ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                    : 'bg-slate-800 text-slate-500 border border-slate-700/50 hover:text-slate-300'
                }`}
              >
                Upload PDF
              </button>
            </div>

            {inputMode === 'text' ? (
              <textarea
                value={resumeText}
                onChange={(e) => setResumeText(e.target.value)}
                placeholder="Paste your full resume text here..."
                className="w-full h-64 bg-slate-950/50 border border-slate-700/50 rounded-xl px-4 py-3 text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/25 resize-none custom-scrollbar"
              />
            ) : (
              <div
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`h-64 border-2 border-dashed rounded-xl flex flex-col items-center justify-center cursor-pointer transition-all ${
                  dragActive
                    ? 'border-purple-500 bg-purple-500/10'
                    : selectedFile
                    ? 'border-emerald-500/30 bg-emerald-500/5'
                    : 'border-slate-700/50 bg-slate-950/50 hover:border-slate-600'
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf"
                  className="hidden"
                  onChange={(e) =>
                    e.target.files?.[0] && handleFileSelect(e.target.files[0])
                  }
                />
                {selectedFile ? (
                  <div className="text-center">
                    <FileText size={36} className="text-emerald-400 mx-auto mb-3" />
                    <p className="text-sm text-emerald-400 font-medium">
                      {selectedFile.name}
                    </p>
                    <p className="text-xs text-slate-500 mt-1">
                      {(selectedFile.size / 1024).toFixed(1)} KB
                    </p>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedFile(null);
                      }}
                      className="mt-3 text-xs text-red-400 hover:text-red-300 flex items-center gap-1 mx-auto"
                    >
                      <X size={12} /> Remove
                    </button>
                  </div>
                ) : (
                  <div className="text-center">
                    <Upload
                      size={36}
                      className={`mx-auto mb-3 ${
                        dragActive ? 'text-purple-400' : 'text-slate-600'
                      }`}
                    />
                    <p className="text-sm text-slate-400">
                      Drop PDF here or <span className="text-purple-400">browse</span>
                    </p>
                    <p className="text-xs text-slate-600 mt-1">Max 10MB</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Job Description Input */}
          <div className="bg-slate-900/80 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-6">
            <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
              <Sparkles size={16} className="text-fuchsia-400" />
              Job Description
            </h3>
            <textarea
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
              placeholder="Paste the job description for the role you're applying to..."
              className="w-full h-[calc(100%-36px)] min-h-[280px] bg-slate-950/50 border border-slate-700/50 rounded-xl px-4 py-3 text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/25 resize-none custom-scrollbar"
            />
          </div>
        </div>

        {/* Analyze Button */}
        <div className="flex justify-center mb-16">
          <button
            onClick={handleAnalyze}
            disabled={isAnalyzing}
            className="group relative px-10 py-4 rounded-xl text-white font-semibold text-base overflow-hidden transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-fuchsia-600 transition-opacity group-hover:opacity-90"></div>
            <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-fuchsia-500 opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <span className="relative flex items-center gap-3">
              {isAnalyzing ? (
                <>
                  <Loader2 size={20} className="animate-spin" />
                  Analyzing with AI...
                </>
              ) : (
                <>
                  <Sparkles size={20} />
                  Analyze Resume
                </>
              )}
            </span>
          </button>
        </div>

        {/* Loading skeleton */}
        {isAnalyzing && (
          <div className="space-y-6 mb-12 animate-pulse">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="bg-slate-900/60 border border-slate-700/30 rounded-2xl h-48"
              ></div>
            ))}
          </div>
        )}

        {/* Results */}
        {analysisResult && (
          <div ref={resultsRef} className="space-y-8">
            {/* Download report button */}
            <div className="flex justify-end">
              <button
                onClick={handleDownloadReport}
                className="flex items-center gap-2 px-5 py-2.5 bg-slate-800 border border-slate-700/50 rounded-lg text-sm font-medium text-slate-300 hover:text-white hover:border-slate-600 transition-all"
              >
                <Download size={16} />
                Download Report
              </button>
            </div>

            {/* Score Cards */}
            <ATSScoreCard
              atsScore={analysisResult.ats_score}
              matchScore={analysisResult.match_score}
            />

            {/* Quality Dashboard */}
            <ResumeQualityDashboard
              atsScore={analysisResult.ats_score}
              metrics={analysisResult.resume_quality_metrics}
            />

            {/* Keywords */}
            <KeywordSuggestions
              matchedKeywords={analysisResult.matched_keywords}
              missingKeywords={analysisResult.missing_keywords}
              keywordSuggestions={analysisResult.keyword_suggestions}
            />

            {/* Feedback */}
            <ResumeFeedback
              improvementSuggestions={analysisResult.improvement_suggestions}
              formattingFeedback={analysisResult.formatting_feedback}
            />

            {/* Bullet Point Rewriter */}
            <BulletPointRewriter
              rewrittenBullets={analysisResult.rewritten_bullets}
            />
          </div>
        )}
      </main>
    </div>
  );
};

export default ResumeAnalyzer;
