'use client';

import React, { useState, useTransition } from 'react';
import { updateDiscordConnection } from './actions';

interface DiscordConnectCardProps {
  userId: string;
  currentDiscordId: string;
}

export default function DiscordConnectCard({ userId, currentDiscordId }: DiscordConnectCardProps) {
  const isDiscordConnected = currentDiscordId.startsWith('discord_') && !currentDiscordId.startsWith('web_user_');
  const displayId = currentDiscordId.replace('discord_', '');

  const [inputVal, setInputVal] = useState(displayId);
  const [isEditing, setIsEditing] = useState(!isDiscordConnected);
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleConnect = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputVal.trim()) return;

    startTransition(async () => {
      const res = await updateDiscordConnection(userId, inputVal);
      if (res.success) {
        setMessage('✅ Discord ID connected successfully! Daily DM reminders enabled.');
        setIsEditing(false);
      } else {
        setMessage(`❌ ${res.error}`);
      }
    });
  };

  return (
    <div className="rounded-2xl border border-indigo-500/30 bg-slate-900/80 p-6 backdrop-blur space-y-4 shadow-xl">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 flex items-center justify-center text-xl font-bold">
            🤖
          </div>
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              Discord Bot Reminders
              {isDiscordConnected ? (
                <span className="rounded-full bg-emerald-500/20 border border-emerald-500/40 px-2 py-0.5 text-[10px] font-bold text-emerald-400">
                  Connected
                </span>
              ) : (
                <span className="rounded-full bg-amber-500/20 border border-amber-500/40 px-2 py-0.5 text-[10px] font-bold text-amber-400">
                  Not Connected
                </span>
              )}
            </h3>
            <p className="text-xs text-slate-400">
              {isDiscordConnected
                ? `Active Account: ${currentDiscordId}`
                : 'Connect your Discord User ID to receive 1-click completion DMs.'}
            </p>
          </div>
        </div>

        <a
          href="https://discord.com/api/oauth2/authorize?client_id=1541144591233851442&permissions=3072&scope=bot"
          target="_blank"
          rel="noreferrer"
          className="rounded-xl border border-indigo-500/40 bg-indigo-500/10 px-4 py-2 text-xs font-semibold text-indigo-300 hover:bg-indigo-500/20 transition-all flex items-center gap-1.5"
        >
          <span>➕</span> Invite Kunjappan Bot
        </a>
      </div>

      {message && (
        <div className={`rounded-xl p-3 text-xs font-semibold ${message.startsWith('✅') ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400' : 'bg-rose-500/10 border border-rose-500/30 text-rose-400'}`}>
          {message}
        </div>
      )}

      {isEditing ? (
        <form onSubmit={handleConnect} className="flex flex-wrap items-center gap-3">
          <input
            type="text"
            value={inputVal}
            onChange={(e) => setInputVal(e.target.value)}
            placeholder="Enter Discord User ID (e.g. 862658625750827028)"
            className="flex-1 rounded-xl border border-slate-800 bg-slate-950/80 px-4 py-2.5 text-xs text-slate-100 placeholder-slate-500 focus:border-indigo-500 focus:outline-none transition-colors"
          />
          <button
            type="submit"
            disabled={isPending || !inputVal.trim()}
            className="rounded-xl bg-indigo-600 hover:bg-indigo-500 px-5 py-2.5 text-xs font-extrabold text-white disabled:opacity-50 transition-all cursor-pointer flex items-center gap-2"
          >
            {isPending ? 'Saving...' : 'Save & Connect'}
          </button>
          {isDiscordConnected && (
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              className="rounded-xl border border-slate-800 bg-slate-950 px-4 py-2.5 text-xs font-semibold text-slate-400 hover:text-slate-200 transition-all"
            >
              Cancel
            </button>
          )}
        </form>
      ) : (
        <div className="flex items-center justify-between bg-slate-950/60 border border-slate-800/80 rounded-xl p-3.5">
          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-400">Discord ID:</span>
            <code className="text-indigo-300 font-semibold bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20">
              {currentDiscordId}
            </code>
          </div>
          <button
            type="button"
            onClick={() => setIsEditing(true)}
            className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 transition-colors"
          >
            Change Discord ID →
          </button>
        </div>
      )}
    </div>
  );
}
