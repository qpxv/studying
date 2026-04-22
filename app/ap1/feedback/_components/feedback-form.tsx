"use client";

import { useState, useTransition } from "react";
import { createFeedback } from "../actions";

type Entry = {
  id: string;
  author: string | null;
  content: string;
  createdAt: Date;
};

function timeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (seconds < 60) return "gerade eben";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `vor ${minutes} Min.`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `vor ${hours} Std.`;
  const days = Math.floor(hours / 24);
  return `vor ${days} Tag${days !== 1 ? "en" : ""}`;
}

export function FeedbackForm({
  initialEntries,
  userName,
}: {
  initialEntries: Entry[];
  userName: string | null;
}) {
  const [content, setContent] = useState("");
  const [entries, setEntries] = useState<Entry[]>(initialEntries);
  const [confirmed, setConfirmed] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit() {
    if (!content.trim()) return;
    setError(null);

    startTransition(async () => {
      try {
        await createFeedback(userName ?? undefined, content);
        const optimistic: Entry = {
          id: crypto.randomUUID(),
          author: userName,
          content: content.trim(),
          createdAt: new Date(),
        };
        setEntries((prev) => [optimistic, ...prev]);
        setContent("");
        setConfirmed(true);
        setTimeout(() => setConfirmed(false), 3000);
      } catch {
        setError("Ups, da ist was schiefgelaufen. Versuch es nochmal.");
      }
    });
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  }

  return (
    <div className="flex flex-col gap-4 w-full">
      {/* Submit card */}
      <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 p-5 flex flex-col gap-3">
        <p className="text-xs font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">
          Idee einreichen
        </p>

        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Deine Idee oder dein Feedback…"
          rows={3}
          disabled={isPending}
          className="w-full resize-none rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-500 px-4 py-3 text-sm leading-relaxed outline-none focus:border-zinc-400 dark:focus:border-zinc-500 transition-colors disabled:opacity-50"
        />

        <div className="flex items-center justify-between gap-3">
          <div className="text-xs">
            {confirmed && (
              <span className="text-green-600 dark:text-green-400 font-medium">
                Danke! Feedback gespeichert.
              </span>
            )}
            {error && <span className="text-red-500">{error}</span>}
          </div>
          <button
            onClick={handleSubmit}
            disabled={!content.trim() || isPending}
            className="flex-none px-4 py-2 rounded-xl bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 text-sm font-medium hover:opacity-80 active:scale-95 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
          >
            {isPending ? "Senden…" : "Senden"}
          </button>
        </div>
      </div>

      {/* Feed */}
      <div className="flex flex-col gap-2">
        <p className="text-xs font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider px-1">
          Alle Einträge
        </p>

        {entries.length === 0 ? (
          <p className="text-sm text-zinc-400 dark:text-zinc-500 px-1 py-4 text-center">
            Noch kein Feedback — sei der Erste!
          </p>
        ) : (
          entries.map((entry) => (
            <div
              key={entry.id}
              className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-4 py-3 flex flex-col gap-1"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 truncate">
                  {entry.author ?? "Anonym"}
                </span>
                <span className="text-[11px] text-zinc-400 dark:text-zinc-500 flex-none">
                  {timeAgo(entry.createdAt)}
                </span>
              </div>
              <p className="text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed whitespace-pre-wrap">
                {entry.content}
              </p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
