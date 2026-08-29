import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans antialiased">
      {/* Background Decorator Gradients */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 h-[500px] w-[800px] rounded-full bg-gradient-to-tr from-emerald-600/20 via-teal-500/10 to-transparent blur-3xl" />
      </div>

      <div className="relative z-10 mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8 space-y-16">
        {/* Hero Section */}
        <div className="text-center space-y-6 max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-4 py-1.5 text-xs font-semibold text-emerald-400">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            Web PDF Onboarding + Gemini 3.6 Flash + Interactive Discord Bot
          </div>

          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-white leading-tight">
            AI Career Coach <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-300">& Interactive Discord Bot</span>
          </h1>

          <p className="text-base sm:text-lg text-slate-300 leading-relaxed">
            Upload your PDF resume on the web, let Google Gemini AI perform a skill gap analysis, track your 14-day timeline on the Web Dashboard, and receive interactive 1-click completion DMs on Discord!
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
            <Link
              href="/onboarding"
              className="rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 px-6 py-3.5 text-sm font-extrabold text-slate-950 shadow-lg shadow-emerald-500/25 hover:from-emerald-400 hover:to-teal-400 transition-all duration-200 cursor-pointer"
            >
              📄 Upload Resume & Create AI Roadmap →
            </Link>
            <Link
              href="/dashboard"
              className="rounded-xl border border-slate-800 bg-slate-900/80 px-6 py-3.5 text-sm font-semibold text-slate-300 hover:border-slate-700 hover:bg-slate-800 transition-all"
            >
              📊 Open Web Dashboard
            </Link>
          </div>
        </div>

        {/* Feature Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6 backdrop-blur space-y-3">
            <div className="h-10 w-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center text-xl font-bold">
              📄
            </div>
            <h3 className="text-lg font-bold text-white">Web-First Onboarding</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Drag-and-drop PDF resume uploader, target duration selector, and goal text area with Next.js Server Actions for instant AI roadmap generation.
            </p>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6 backdrop-blur space-y-3">
            <div className="h-10 w-10 rounded-xl bg-teal-500/10 border border-teal-500/20 text-teal-400 flex items-center justify-center text-xl font-bold">
              🤖
            </div>
            <h3 className="text-lg font-bold text-white">Interactive Discord Bot</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              1-click <code className="text-teal-400">[ ✅ Mark Completed ]</code> buttons inside Discord DMs, intent matching (<code className="text-teal-400">remaining</code>, <code className="text-teal-400">progress</code>, <code className="text-teal-400">today</code>), and Gemini 3.6 Flash AI Tutor fallback.
            </p>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6 backdrop-blur space-y-3">
            <div className="h-10 w-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center text-xl font-bold">
              📊
            </div>
            <h3 className="text-lg font-bold text-white">RSC Web Dashboard</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              React Server Components fetching directly from Prisma PostgreSQL database, featuring Next.js Server Actions for instant client milestone updates and progress tracking.
            </p>
          </div>
        </div>

        {/* Architecture & Endpoints Section */}
        <div id="architecture" className="rounded-3xl border border-slate-800 bg-slate-900/70 p-8 backdrop-blur space-y-8">
          <div className="border-b border-slate-800 pb-6">
            <h2 className="text-2xl font-bold text-white">System Architecture & Endpoints</h2>
            <p className="text-xs text-slate-400 mt-1">
              Unified serverless backend and frontend user interface built entirely inside Next.js App Router.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Route 1 */}
            <div className="rounded-xl border border-slate-800/80 bg-slate-950/60 p-5 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs text-emerald-400 font-bold">GET /onboarding</span>
                <span className="rounded bg-emerald-500/10 px-2 py-0.5 text-[10px] text-emerald-400 font-semibold">
                  Web Onboarding
                </span>
              </div>
              <p className="text-xs text-slate-300">
                Drag-and-drop PDF upload form that extracts text via <code className="text-emerald-400">pdf-parse</code> and invokes Gemini 3.6 Flash AI gap analysis.
              </p>
            </div>

            {/* Route 2 */}
            <div className="rounded-xl border border-slate-800/80 bg-slate-950/60 p-5 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs text-teal-400 font-bold">POST /api/discord</span>
                <span className="rounded bg-teal-500/10 px-2 py-0.5 text-[10px] text-teal-400 font-semibold">
                  Discord Interactions
                </span>
              </div>
              <p className="text-xs text-slate-300">
                Serverless HTTP interactions route handling signature verification, 1-click button completions, and intent commands (<code className="text-slate-400">remaining</code>, <code className="text-slate-400">progress</code>).
              </p>
            </div>

            {/* Route 3 */}
            <div className="rounded-xl border border-slate-800/80 bg-slate-950/60 p-5 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs text-emerald-400 font-bold">GET /dashboard</span>
                <span className="rounded bg-emerald-500/10 px-2 py-0.5 text-[10px] text-emerald-400 font-semibold">
                  RSC Dashboard
                </span>
              </div>
              <p className="text-xs text-slate-300">
                Visual timeline dashboard showing candidate details, overall goal description, topic completion progress, and interactive milestone toggles.
              </p>
            </div>

            {/* Route 4 */}
            <div className="rounded-xl border border-slate-800/80 bg-slate-950/60 p-5 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs text-teal-400 font-bold">GET /api/cron/daily-lesson</span>
                <span className="rounded bg-teal-500/10 px-2 py-0.5 text-[10px] text-teal-400 font-semibold">
                  Vercel Cron
                </span>
              </div>
              <p className="text-xs text-slate-300">
                Automated daily cron (<code className="text-slate-400">0 9 * * *</code>) pushing today&apos;s lesson DM with interactive <code className="text-slate-400">[ ✅ Mark Completed ]</code> button attached.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
