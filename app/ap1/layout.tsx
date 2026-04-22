import Link from 'next/link';
import { Construction, Home } from 'lucide-react';
import { Ap1Nav } from './_components/ap1-nav';

export default function Ap1Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col h-full">

      {/* Header */}
      <header className="flex-none flex items-center justify-between px-4 py-3 border-b border-zinc-200 dark:border-zinc-800 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-sm">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
            <Construction className="w-4 h-4 text-zinc-600 dark:text-zinc-400" />
          </div>
          <span className="font-semibold text-sm text-zinc-900 dark:text-zinc-100">AP1</span>
        </div>
        <Link
          href="/"
          className="flex items-center gap-1 text-xs text-zinc-400 dark:text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 transition-colors"
        >
          <Home className="w-3 h-3" />
        </Link>
      </header>

      {/* Body */}
      <div className="flex flex-1 overflow-hidden">

        {/* Desktop sidebar */}
        <aside className="hidden md:flex flex-col flex-none w-52 border-r border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 px-2 py-3">
          <Ap1Nav orientation="vertical" />
        </aside>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto overscroll-y-contain">
          {children}
        </main>

      </div>

      {/* Mobile bottom nav */}
      <nav
        className="md:hidden flex-none flex border-t border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        <Ap1Nav orientation="horizontal" />
      </nav>

    </div>
  );
}
