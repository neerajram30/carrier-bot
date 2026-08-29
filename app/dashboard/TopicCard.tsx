'use client';

import { useState, useTransition } from 'react';
import { toggleTopicCompletion } from './actions';

interface TopicCardProps {
  topic: {
    id: string;
    dayNumber: number;
    title: string;
    description: string;
    isCompleted: boolean;
    completedAt?: Date | null;
  };
}

export default function TopicCard({ topic }: TopicCardProps) {
  const [isPending, startTransition] = useTransition();
  const [isExpanded, setIsExpanded] = useState(false);
  const [isCompleted, setIsCompleted] = useState(topic.isCompleted);

  const handleToggle = () => {
    const newStatus = !isCompleted;
    setIsCompleted(newStatus); // Optimistic UI update

    startTransition(async () => {
      const res = await toggleTopicCompletion(topic.id, topic.isCompleted);
      if (!res.success) {
        setIsCompleted(topic.isCompleted); // Revert on failure
      }
    });
  };

  return (
    <div
      className={`group relative rounded-2xl border p-5 transition-all duration-300 ${
        isCompleted
          ? 'border-emerald-500/30 bg-emerald-950/10 shadow-lg shadow-emerald-500/5'
          : 'border-slate-800 bg-slate-900/60 hover:border-slate-700 hover:bg-slate-900/90'
      }`}
    >
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div className="flex items-start gap-3.5 flex-1">
          {/* Checkbox / Toggle Icon */}
          <button
            onClick={handleToggle}
            disabled={isPending}
            title={isCompleted ? 'Mark as incomplete' : 'Mark as completed'}
            className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border text-sm transition-all ${
              isCompleted
                ? 'border-emerald-500 bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                : 'border-slate-700 bg-slate-800/80 text-transparent hover:border-emerald-500/50 hover:text-slate-500'
            } ${isPending ? 'opacity-50 cursor-wait' : 'cursor-pointer'}`}
          >
            ✓
          </button>

          <div className="flex-1 space-y-1.5">
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className={`inline-flex items-center rounded-md px-2.5 py-0.5 text-xs font-semibold tracking-wide ${
                isCompleted
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                  : 'bg-emerald-400/10 text-emerald-400 border border-emerald-400/20'
              }`}>
                Day {String(topic.dayNumber).padStart(2, '0')}
              </span>
              <h3 className={`text-base font-semibold transition-colors ${
                isCompleted ? 'text-slate-400 line-through' : 'text-slate-100 group-hover:text-white'
              }`}>
                {topic.title}
              </h3>
            </div>

            <p className={`text-sm leading-relaxed ${isExpanded ? 'text-slate-300' : 'text-slate-400 line-clamp-2'}`}>
              {topic.description}
            </p>

            {topic.description.length > 120 && (
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="text-xs text-emerald-400 hover:text-emerald-300 font-medium inline-flex items-center gap-1 mt-1 cursor-pointer"
              >
                {isExpanded ? 'Show Less ▲' : 'Read Full Lesson ▼'}
              </button>
            )}
          </div>
        </div>

        {/* Action / Badge Column */}
        <div className="flex items-center sm:flex-col sm:items-end justify-between border-t border-slate-800/80 pt-3 sm:border-t-0 sm:pt-0 shrink-0">
          <span
            className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${
              isCompleted
                ? 'bg-emerald-500/20 text-emerald-300'
                : 'bg-slate-800 text-slate-400'
            }`}
          >
            {isCompleted ? 'Completed' : 'Pending'}
          </span>

          {topic.completedAt && (
            <span className="text-[10px] text-slate-500 mt-1">
              Done {new Date(topic.completedAt).toLocaleDateString()}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
