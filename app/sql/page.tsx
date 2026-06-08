import Link from 'next/link';
import { BrainCircuit, Terminal, ArrowRight, Home } from 'lucide-react';

const MODES = [
  {
    href: '/sql/quiz',
    icon: BrainCircuit,
    name: 'Quiz',
    desc: 'Theoriefragen · KI-Feedback',
  },
  {
    href: '/sql/praxis',
    icon: Terminal,
    name: 'SQL Praxis',
    desc: 'Schema · Query schreiben · KI-Feedback',
  },
];

export default function SqlHub() {
  return (
    <div className="flex flex-col items-center justify-center h-full gap-8 px-6">
      <div className="flex flex-col items-center gap-1.5 text-center">
        <h1 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">SQL</h1>
        <p className="text-xs text-zinc-400 dark:text-zinc-500">Wähle einen Lernmodus</p>
      </div>

      <div className="flex flex-col gap-3 w-full max-w-sm">
        {MODES.map((m) => {
          const Icon = m.icon;
          return (
            <Link
              key={m.href}
              href={m.href}
              className="group flex items-center gap-4 rounded-2xl px-5 py-5 border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:border-zinc-300 dark:hover:border-zinc-700 hover:shadow-sm transition-all duration-150 active:scale-[0.98]"
            >
              <div className="flex-none w-11 h-11 rounded-xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
                <Icon className="w-5 h-5 text-zinc-600 dark:text-zinc-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 truncate">{m.name}</p>
                <p className="text-xs text-zinc-400 dark:text-zinc-500 truncate mt-0.5">{m.desc}</p>
              </div>
              <ArrowRight className="w-4 h-4 text-zinc-300 dark:text-zinc-600 opacity-0 group-hover:opacity-100 transition-opacity flex-none" />
            </Link>
          );
        })}
      </div>

      <Link
        href="/"
        className="flex items-center gap-1.5 text-xs text-zinc-400 dark:text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 transition-colors"
      >
        <Home className="w-3 h-3" /> Hub
      </Link>
    </div>
  );
}
