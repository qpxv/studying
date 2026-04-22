import Link from "next/link";
import { BrainCircuit, Construction, ArrowRight } from "lucide-react";

const ROUTES = [
  {
    href: "/management",
    icon: BrainCircuit,
    name: "Management Grundlagen",
    desc: "Flashcard quiz · KI-Feedback",
    tag: "Online",
    tagColor:
      "text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-950/50",
    dot: "bg-green-400",
  },
  {
    href: "/ap1",
    icon: Construction,
    name: "AP1",
    desc: "Coming soon",
    tag: "Partial",
    tagColor:
      "text-yellow-600 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-950/50",
    dot: "bg-yellow-400 ",
  },
];

export default function Hub() {
  return (
    <div className="flex flex-col items-center justify-center h-full gap-8 px-6">
      <div className="flex flex-col items-center gap-1.5 text-center">
        <h1 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
          Select Mode
        </h1>
        <p className="text-xs text-zinc-400 dark:text-zinc-500">
          Pick the category you want to get better at
        </p>
      </div>

      <div className="flex flex-col gap-3 w-full max-w-sm">
        {ROUTES.map((r) => {
          const Icon = r.icon;
          return (
            <Link
              key={r.href}
              href={r.href}
              className="group flex items-center gap-4 rounded-2xl px-5 py-5 border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:border-zinc-300 dark:hover:border-zinc-700 hover:shadow-sm transition-all duration-150 active:scale-[0.98]"
            >
              <div className="flex-none w-11 h-11 rounded-xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
                <Icon className="w-5 h-5 text-zinc-600 dark:text-zinc-400" />
              </div>

              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 truncate">
                  {r.name}
                </p>
                <p className="text-xs text-zinc-400 dark:text-zinc-500 truncate mt-0.5">
                  {r.desc}
                </p>
              </div>

              <div className="flex items-center gap-2.5 flex-none">
                <div className="flex items-center gap-1.5">
                  <span className={`w-1.5 h-1.5 rounded-full ${r.dot}`} />
                  <span
                    className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${r.tagColor}`}
                  >
                    {r.tag}
                  </span>
                </div>
                <ArrowRight className="w-4 h-4 text-zinc-300 dark:text-zinc-600 opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </Link>
          );
        })}
      </div>

      <p className="text-[11px] text-zinc-300 dark:text-zinc-700">
        Lernhub v0.1
      </p>
    </div>
  );
}
