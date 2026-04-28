'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Layers, HelpCircle, MessageCircle, NotebookPen } from 'lucide-react';

const NAV_ITEMS = [
  { href: '/ap1/karteikarten', label: 'Karteikarten', icon: Layers },
  { href: '/ap1/quiz',         label: 'Quiz',         icon: HelpCircle },
  { href: '/ap1/notizen',      label: 'Notizen',      icon: NotebookPen },
  { href: '/ap1/feedback',     label: 'Feedback',     icon: MessageCircle },
];

export function Ap1Nav({ orientation }: { orientation: 'vertical' | 'horizontal' }) {
  const pathname = usePathname();

  if (orientation === 'vertical') {
    return (
      <div className="flex flex-col gap-0.5">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const active = pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm transition-colors
                ${active
                  ? 'bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 font-medium'
                  : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-zinc-100'
                }`}
            >
              <Icon className="w-4 h-4 flex-none" />
              {label}
            </Link>
          );
        })}
      </div>
    );
  }

  return (
    <div className="flex w-full">
      {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
        const active = pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            className={`flex-1 flex flex-col items-center gap-1 py-2.5 transition-colors
              ${active
                ? 'text-zinc-900 dark:text-zinc-100'
                : 'text-zinc-400 dark:text-zinc-500'
              }`}
          >
            <Icon className={`w-5 h-5 ${active ? 'stroke-2' : 'stroke-[1.5]'}`} />
            <span className="text-[11px]">{label}</span>
          </Link>
        );
      })}
    </div>
  );
}
