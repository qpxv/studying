import Link from "next/link";
import { BrainCircuit, ArrowRight, BookText, Database } from "lucide-react";

const SECTIONS = [
  {
    label: "FOM",
    routes: [
      {
        href: "/management",
        icon: BrainCircuit,
        name: "Management Grundlagen",
        desc: "Flashcard quiz · KI-Feedback",
        tag: "Online",
        tagColor: "text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-950/50",
        dot: "bg-green-400",
      },
      {
        href: "/sql",
        icon: Database,
        name: "SQL",
        desc: "Flashcard quiz · KI-Feedback",
        tag: "Online",
        tagColor: "text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-950/50",
        dot: "bg-green-400",
      },
    ],
  },
  {
    label: "Advantage",
    routes: [
      {
        href: "/ap1",
        icon: BookText,
        name: "AP1",
        desc: "Notizen · Karteikarten · Quiz",
        tag: "Online",
        tagColor: "text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-950/50",
        dot: "bg-green-400",
      },
    ],
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

      <div className="flex flex-col gap-5 w-full max-w-sm">
        {SECTIONS.map((section) => (
          <div key={section.label} className="flex flex-col gap-2">
            <p className="text-xs font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider px-1">
              {section.label}
            </p>
            <div className="flex flex-col gap-2">
              {section.routes.map((r) => {
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
                        <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${r.tagColor}`}>
                          {r.tag}
                        </span>
                      </div>
                      <ArrowRight className="w-4 h-4 text-zinc-300 dark:text-zinc-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <p className="text-[11px] text-zinc-300 dark:text-zinc-700">
        Lernhub v0.1
      </p>
    </div>
  );
}
