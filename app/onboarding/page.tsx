'use client';

import React, { useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createRoadmapFromWeb } from './actions';

export default function OnboardingPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [file, setFile] = useState<File | null>(null);
  const [targetDuration, setTargetDuration] = useState('14 days');
  const [userGoals, setUserGoals] = useState('Senior Full Stack AI Developer specializing in Next.js App Router and System Design');
  const [discordUserId, setDiscordUserId] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (selected) {
      if (!selected.name.endsWith('.pdf')) {
        setErrorMsg('Please select a valid PDF resume file (.pdf).');
        setFile(null);
        return;
      }
      setErrorMsg(null);
      setFile(selected);
    }
  };

  const nextStep = () => {
    if (currentStep === 1 && !file) {
      setErrorMsg('Please upload a PDF resume file before proceeding.');
      return;
    }
    if (currentStep === 3 && !userGoals.trim()) {
      setErrorMsg('Please enter your career goals or target job role.');
      return;
    }
    setErrorMsg(null);
    setCurrentStep((prev) => Math.min(prev + 1, 4));
  };

  const prevStep = () => {
    setErrorMsg(null);
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      setErrorMsg('Please upload a PDF resume file before submitting.');
      return;
    }

    const formData = new FormData();
    formData.append('resume', file);
    formData.append('targetDuration', targetDuration);
    formData.append('userGoals', userGoals);
    formData.append('discordUserId', discordUserId);

    startTransition(async () => {
      const res = await createRoadmapFromWeb(formData);
      if (res.success) {
        router.push('/dashboard');
        router.refresh();
      } else {
        setErrorMsg(res.error || 'An error occurred generating your AI roadmap.');
      }
    });
  };

  const presetGoals = [
    'Senior Full Stack AI Developer (Next.js, Python, LangChain)',
    'Lead Cloud & System Architect (AWS, Kubernetes, System Design)',
    'Senior DevOps & Infrastructure Engineer',
    'Full Stack Engineer (TypeScript, React 19, PostgreSQL)',
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans antialiased">
      {/* Background Decorator Gradients */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 h-[500px] w-[800px] rounded-full bg-gradient-to-tr from-emerald-600/20 via-teal-500/10 to-transparent blur-3xl" />
      </div>

      <div className="relative z-10 mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8 space-y-8">
        {/* Navigation Bar */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-6">
          <Link href="/" className="text-xl font-extrabold tracking-tight text-white flex items-center gap-2">
            <span className="h-3 w-3 rounded-full bg-emerald-400 animate-pulse" />
            AI Career Coach
          </Link>
          <Link
            href="/dashboard"
            className="text-xs font-semibold text-emerald-400 hover:text-emerald-300 transition-colors"
          >
            Go to Web Dashboard →
          </Link>
        </div>

        {/* Header */}
        <div className="text-center space-y-3">
          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white">
            Career Roadmap <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-300">Wizard</span>
          </h1>
          <p className="text-sm sm:text-base text-slate-300 max-w-2xl mx-auto">
            Complete the 4-step wizard to extract your resume gaps, formulate your AI learning curriculum, and connect Discord reminders!
          </p>
        </div>

        {/* Stepper Progress Indicator Bar */}
        <div className="rounded-2xl border border-slate-800/80 bg-slate-900/60 p-4 sm:p-6 backdrop-blur">
          <div className="flex items-center justify-between relative z-10">
            {[
              { num: 1, label: 'Upload Resume', icon: '📄' },
              { num: 2, label: 'Timeline', icon: '⏱️' },
              { num: 3, label: 'Career Goals', icon: '🎯' },
              { num: 4, label: 'Discord & Review', icon: '🤖' },
            ].map((step) => (
              <div
                key={step.num}
                onClick={() => {
                  if (step.num < currentStep) setCurrentStep(step.num);
                }}
                className={`flex flex-col items-center gap-1.5 cursor-pointer group transition-all ${
                  step.num <= currentStep ? 'opacity-100' : 'opacity-40'
                }`}
              >
                <div
                  className={`h-10 w-10 sm:h-12 sm:w-12 rounded-2xl flex items-center justify-center font-bold text-sm sm:text-base transition-all ${
                    currentStep === step.num
                      ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 shadow-lg shadow-emerald-500/25 scale-110'
                      : step.num < currentStep
                      ? 'bg-emerald-500/20 border border-emerald-500/40 text-emerald-400'
                      : 'bg-slate-950 border border-slate-800 text-slate-500'
                  }`}
                >
                  {step.num < currentStep ? '✓' : step.icon}
                </div>
                <span className={`text-[11px] sm:text-xs font-semibold ${currentStep === step.num ? 'text-emerald-400' : 'text-slate-400'}`}>
                  {step.label}
                </span>
              </div>
            ))}
          </div>

          {/* Progress Connector Line */}
          <div className="relative mt-4 h-1.5 w-full bg-slate-950 rounded-full overflow-hidden border border-slate-800">
            <div
              className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-300"
              style={{ width: `${((currentStep - 1) / 3) * 100}%` }}
            />
          </div>
        </div>

        {/* Wizard Card Body */}
        <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-6 sm:p-10 backdrop-blur shadow-2xl space-y-6">
          {errorMsg && (
            <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-4 text-xs font-semibold text-rose-400">
              ⚠️ {errorMsg}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* STEP 1: UPLOAD RESUME */}
            {currentStep === 1 && (
              <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                <div className="border-b border-slate-800 pb-3">
                  <h2 className="text-lg font-bold text-white flex items-center gap-2">
                    <span>📄</span> Step 1: Upload Your PDF Resume
                  </h2>
                  <p className="text-xs text-slate-400">Our parser reads your work experience, tech stack, and background to perform skill gap analysis.</p>
                </div>

                <div className="relative border-2 border-dashed border-slate-700 hover:border-emerald-500/50 bg-slate-950/50 rounded-2xl p-10 text-center transition-all cursor-pointer group">
                  <input
                    type="file"
                    accept=".pdf"
                    onChange={handleFileChange}
                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                  />
                  <div className="space-y-3 pointer-events-none">
                    <div className="h-16 w-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center text-3xl mx-auto group-hover:scale-110 transition-transform">
                      📄
                    </div>
                    {file ? (
                      <div>
                        <p className="text-base font-bold text-emerald-400">{file.name}</p>
                        <p className="text-xs text-slate-400 mt-1">{(file.size / 1024).toFixed(1)} KB — PDF Ready for AI Analysis</p>
                      </div>
                    ) : (
                      <div>
                        <p className="text-sm font-semibold text-slate-200">Click or Drag & Drop PDF Resume here</p>
                        <p className="text-xs text-slate-500 mt-1">Supports PDF document format up to 10MB</p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    type="button"
                    onClick={nextStep}
                    disabled={!file}
                    className="rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 px-6 py-3 text-xs font-extrabold text-slate-950 shadow-md shadow-emerald-500/20 hover:from-emerald-400 hover:to-teal-400 disabled:opacity-40 transition-all cursor-pointer"
                  >
                    Next: Set Timeline →
                  </button>
                </div>
              </div>
            )}

            {/* STEP 2: TIMELINE / DURATION */}
            {currentStep === 2 && (
              <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                <div className="border-b border-slate-800 pb-3">
                  <h2 className="text-lg font-bold text-white flex items-center gap-2">
                    <span>⏱️</span> Step 2: Select Learning Timeline
                  </h2>
                  <p className="text-xs text-slate-400">Choose how many days or weeks your micro-learning roadmap will cover.</p>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 py-2">
                  {[
                    { title: '7 Days', subtitle: '1 Week Sprint', val: '7 days' },
                    { title: '14 Days', subtitle: '2 Weeks Recommended', val: '14 days' },
                    { title: '30 Days', subtitle: '1 Month Masterclass', val: '30 days' },
                    { title: '4 Weeks', subtitle: 'Structured Curriculum', val: '4 weeks' },
                  ].map((dur) => (
                    <button
                      key={dur.val}
                      type="button"
                      onClick={() => setTargetDuration(dur.val)}
                      className={`rounded-2xl border p-4 text-center space-y-1 transition-all cursor-pointer ${
                        targetDuration === dur.val
                          ? 'border-emerald-500 bg-emerald-500/20 text-emerald-300 shadow-lg shadow-emerald-500/10 scale-105'
                          : 'border-slate-800 bg-slate-950/60 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                      }`}
                    >
                      <p className="text-sm font-bold text-white">{dur.title}</p>
                      <p className="text-[11px] text-slate-400">{dur.subtitle}</p>
                    </button>
                  ))}
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={prevStep}
                    className="rounded-xl border border-slate-800 bg-slate-950 px-5 py-2.5 text-xs font-semibold text-slate-400 hover:border-slate-700 hover:text-slate-200 transition-all cursor-pointer"
                  >
                    ← Back
                  </button>
                  <button
                    type="button"
                    onClick={nextStep}
                    className="rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 px-6 py-3 text-xs font-extrabold text-slate-950 shadow-md shadow-emerald-500/20 hover:from-emerald-400 hover:to-teal-400 transition-all cursor-pointer"
                  >
                    Next: Career Goals →
                  </button>
                </div>
              </div>
            )}

            {/* STEP 3: CAREER GOALS */}
            {currentStep === 3 && (
              <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                <div className="border-b border-slate-800 pb-3">
                  <h2 className="text-lg font-bold text-white flex items-center gap-2">
                    <span>🎯</span> Step 3: Target Role & Career Objectives
                  </h2>
                  <p className="text-xs text-slate-400">Describe your dream role, desired skills, or select a preset target profile.</p>
                </div>

                <div className="space-y-3">
                  <textarea
                    rows={3}
                    value={userGoals}
                    onChange={(e) => setUserGoals(e.target.value)}
                    placeholder="e.g. Master Senior Full Stack AI Engineer skills, Next.js App Router, and System Design"
                    className="w-full rounded-2xl border border-slate-800 bg-slate-950/60 p-4 text-xs text-slate-100 placeholder-slate-500 focus:border-emerald-500 focus:outline-none transition-colors"
                    required
                  />

                  <div className="space-y-2">
                    <p className="text-[11px] font-semibold text-slate-400">Quick Presets:</p>
                    <div className="flex flex-wrap gap-2">
                      {presetGoals.map((preset) => (
                        <button
                          key={preset}
                          type="button"
                          onClick={() => setUserGoals(preset)}
                          className="rounded-xl border border-slate-800 bg-slate-950/60 px-3 py-1.5 text-[11px] font-medium text-slate-300 hover:border-emerald-500/50 hover:text-emerald-300 transition-all text-left"
                        >
                          + {preset}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={prevStep}
                    className="rounded-xl border border-slate-800 bg-slate-950 px-5 py-2.5 text-xs font-semibold text-slate-400 hover:border-slate-700 hover:text-slate-200 transition-all cursor-pointer"
                  >
                    ← Back
                  </button>
                  <button
                    type="button"
                    onClick={nextStep}
                    disabled={!userGoals.trim()}
                    className="rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 px-6 py-3 text-xs font-extrabold text-slate-950 shadow-md shadow-emerald-500/20 hover:from-emerald-400 hover:to-teal-400 disabled:opacity-40 transition-all cursor-pointer"
                  >
                    Next: Review & Discord →
                  </button>
                </div>
              </div>
            )}

            {/* STEP 4: DISCORD CONNECTION & REVIEW */}
            {currentStep === 4 && (
              <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                <div className="border-b border-slate-800 pb-3">
                  <h2 className="text-lg font-bold text-white flex items-center gap-2">
                    <span>🤖</span> Step 4: Discord Reminders & Final Review
                  </h2>
                  <p className="text-xs text-slate-400">Connect your Discord User ID for daily DMs and review your configuration.</p>
                </div>

                <div className="space-y-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-300">
                    Discord User ID (Optional)
                  </label>
                  <input
                    type="text"
                    value={discordUserId}
                    onChange={(e) => setDiscordUserId(e.target.value)}
                    placeholder="e.g. 862658625750827028 or discord_862658625750827028"
                    className="w-full rounded-2xl border border-slate-800 bg-slate-950/60 p-4 text-xs text-slate-100 placeholder-slate-500 focus:border-emerald-500 focus:outline-none transition-colors"
                  />
                  <p className="text-[11px] text-slate-500">
                    💡 You can invite bot <strong className="text-emerald-400">Kunjappan#2837</strong> on Discord anytime to receive 1-click completion DMs.
                  </p>
                </div>

                {/* Summary Preview Card */}
                <div className="rounded-2xl border border-slate-800/80 bg-slate-950/60 p-5 space-y-3">
                  <p className="text-xs font-bold text-emerald-400 uppercase tracking-wider">Configuration Summary:</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div>
                      <span className="text-slate-500">Resume File:</span>
                      <p className="font-semibold text-slate-200">{file?.name}</p>
                    </div>
                    <div>
                      <span className="text-slate-500">Target Timeline:</span>
                      <p className="font-semibold text-slate-200">{targetDuration}</p>
                    </div>
                    <div className="sm:col-span-2">
                      <span className="text-slate-500">Target Career Goal:</span>
                      <p className="font-semibold text-slate-200">{userGoals}</p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={prevStep}
                    disabled={isPending}
                    className="rounded-xl border border-slate-800 bg-slate-950 px-5 py-2.5 text-xs font-semibold text-slate-400 hover:border-slate-700 hover:text-slate-200 disabled:opacity-40 transition-all cursor-pointer"
                  >
                    ← Back
                  </button>

                  <button
                    type="submit"
                    disabled={isPending || !file}
                    className="rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 px-8 py-3.5 text-xs font-extrabold text-slate-950 shadow-lg shadow-emerald-500/25 hover:from-emerald-400 hover:to-teal-400 disabled:opacity-50 transition-all cursor-pointer flex items-center gap-2"
                  >
                    {isPending ? (
                      <>
                        <span className="h-4 w-4 rounded-full border-2 border-slate-950 border-t-transparent animate-spin" />
                        Generating AI Roadmap with Gemini 3.6 Flash...
                      </>
                    ) : (
                      '🚀 Generate AI Career Roadmap'
                    )}
                  </button>
                </div>
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}
