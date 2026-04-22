import { HelpCircle } from 'lucide-react';

export default function QuizPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-full px-4 py-10">
      <div className="w-full max-w-sm rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 p-6 flex flex-col gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
            <HelpCircle className="w-5 h-5 text-zinc-500 dark:text-zinc-400" />
          </div>
          <div>
            <p className="font-semibold text-sm text-zinc-900 dark:text-zinc-100">Quiz</p>
            <p className="text-xs text-zinc-400 dark:text-zinc-500">In Planung</p>
          </div>
        </div>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed">
          KI-gestütztes Quiz für AP1 — kommt bald.
        </p>
      </div>
    </div>
  );
}
