import { prisma } from '@/lib/prisma';
import TopicCard from './TopicCard';
import Link from 'next/link';

export const revalidate = 0; // Dynamic server page

interface TopicItem {
  id: string;
  dayNumber: number;
  title: string;
  description: string;
  isCompleted: boolean;
  completedAt?: Date | null;
}

export default async function DashboardPage() {
  // Fetch users with their goal and topics directly from Prisma DB
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const users: any[] = await prisma.user.findMany({
    include: {
      goal: {
        include: {
          topics: {
            orderBy: { dayNumber: 'asc' },
          },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  const primaryUser = users[0];
  const goal = primaryUser?.goal;
  const topics: TopicItem[] = goal?.topics || [];

  const completedCount = topics.filter((t: TopicItem) => t.isCompleted).length;
  const totalCount = topics.length;
  const progressPercentage = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans antialiased">
      {/* Background Decorator Gradients */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute -top-40 -left-40 h-96 w-96 rounded-full bg-emerald-600/10 blur-3xl" />
        <div className="absolute top-1/3 -right-40 h-96 w-96 rounded-full bg-teal-600/10 blur-3xl" />
        <div className="absolute -bottom-40 left-1/3 h-96 w-96 rounded-full bg-emerald-700/10 blur-3xl" />
      </div>

      <div className="relative z-10 mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-8">
        {/* Navigation Bar */}
        <header className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-6">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-bold text-xl shadow-lg shadow-emerald-500/10">
              💬
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
                WhatsApp AI Career Coach
                <span className="rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-semibold text-emerald-400 border border-emerald-500/20">
                  Dashboard
                </span>
              </h1>
              <p className="text-xs text-slate-400 mt-0.5">
                Headless Meta WhatsApp Backend & RSC Visual Learning Roadmap
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="rounded-lg border border-slate-800 bg-slate-900 px-3.5 py-2 text-xs font-medium text-slate-300 hover:border-slate-700 hover:bg-slate-800 transition"
            >
              ← System Overview & Documentation
            </Link>
          </div>
        </header>

        {/* Main Grid Content */}
        {!primaryUser ? (
          /* Empty State */
          <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-12 text-center shadow-xl backdrop-blur">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-3xl text-emerald-400 mb-4">
              📱
            </div>
            <h2 className="text-xl font-bold text-white mb-2">No Active WhatsApp Users Yet</h2>
            <p className="text-sm text-slate-400 max-w-md mx-auto mb-6">
              Connect your Meta WhatsApp Cloud API endpoint to start onboarding users, parsing PDF resumes, and generating custom daily AI roadmaps.
            </p>
            <div className="inline-flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-950 px-4 py-3 text-xs text-slate-300 font-mono">
              <span className="text-emerald-400">Webhook Endpoint:</span> /api/webhook
            </div>
          </div>
        ) : (
          <>
            {/* User Overview Bar */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* User Profile Card */}
              <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 backdrop-blur space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium uppercase tracking-wider text-slate-400">Candidate Profile</span>
                  <span className="inline-flex items-center rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-semibold text-emerald-400 border border-emerald-500/20">
                    {primaryUser.botState}
                  </span>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white font-mono">{primaryUser.phone}</h3>
                  <p className="text-xs text-slate-400 mt-1">
                    Timeline: <span className="text-slate-200 font-medium">{primaryUser.targetDuration || 'Not set'}</span>
                  </p>
                </div>
                {primaryUser.resumeText && (
                  <div className="rounded-xl border border-slate-800 bg-slate-950/80 p-3 text-xs text-slate-400 line-clamp-3">
                    <span className="font-semibold text-slate-300 block mb-1">Extracted Resume Extract:</span>
                    {primaryUser.resumeText}
                  </div>
                )}
              </div>

              {/* Progress Summary Card */}
              <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 backdrop-blur space-y-4 md:col-span-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium uppercase tracking-wider text-slate-400">Roadmap Completion</span>
                  <span className="text-sm font-bold text-emerald-400">{progressPercentage}% Complete</span>
                </div>

                {/* Progress Bar */}
                <div className="h-3 w-full rounded-full bg-slate-800 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-500 rounded-full"
                    style={{ width: `${progressPercentage}%` }}
                  />
                </div>

                <div className="grid grid-cols-3 gap-4 pt-2 text-center">
                  <div className="rounded-xl border border-slate-800/80 bg-slate-950/50 p-3">
                    <span className="block text-xl font-bold text-white">{totalCount}</span>
                    <span className="text-xs text-slate-400">Total Topics</span>
                  </div>
                  <div className="rounded-xl border border-slate-800/80 bg-slate-950/50 p-3">
                    <span className="block text-xl font-bold text-emerald-400">{completedCount}</span>
                    <span className="text-xs text-slate-400">Completed</span>
                  </div>
                  <div className="rounded-xl border border-slate-800/80 bg-slate-950/50 p-3">
                    <span className="block text-xl font-bold text-teal-300">{totalCount - completedCount}</span>
                    <span className="text-xs text-slate-400">Remaining</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Overarching Goal Header */}
            {goal && (
              <div className="rounded-2xl border border-emerald-500/20 bg-gradient-to-r from-emerald-950/20 via-slate-900/80 to-slate-900/80 p-6 backdrop-blur space-y-3">
                <div className="flex items-center gap-2 text-emerald-400 text-xs font-semibold uppercase tracking-wider">
                  <span>🎯 AI Personalized Career Strategy</span>
                </div>
                <h2 className="text-xl font-bold text-white">{goal.title}</h2>
                <p className="text-sm text-slate-300 leading-relaxed">{goal.description}</p>
                {goal.roadmapSummary && (
                  <div className="pt-2 border-t border-slate-800/80 text-xs text-slate-400">
                    <strong className="text-slate-300">Curriculum Breakdown:</strong> {goal.roadmapSummary}
                  </div>
                )}
              </div>
            )}

            {/* Topics Timeline Section */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold text-white">Daily Learning Roadmap</h3>
                  <p className="text-xs text-slate-400">
                    Click any checkbox to toggle completed status from the web dashboard.
                  </p>
                </div>
              </div>

              {topics.length === 0 ? (
                <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-8 text-center text-slate-400 text-sm">
                  No topics generated yet for this user. Continue the WhatsApp onboarding flow to generate topics.
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-4">
                  {topics.map((t: TopicItem) => (
                    <TopicCard key={t.id} topic={t} />
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
