import Link from "next/link";
import { Globe, BrainCircuit, Construction } from "lucide-react";

const SERVERS = [
  {
    href: "/management",
    icon: BrainCircuit,
    name: "Management Grundlagen",
    desc: "Flashcard quiz · KI-Feedback",
    ping: "12ms",
    players: "1/1",
    color:
      "from-green-500/10 to-emerald-500/5 border-green-500/20 hover:border-green-400/40",
    dot: "bg-green-400",
  },
  {
    href: "/ap1",
    icon: Construction,
    name: "AP1",
    desc: "Coming soon",
    ping: "-",
    players: "0/1",
    color:
      "from-zinc-500/10 to-zinc-500/5 border-zinc-500/20 hover:border-zinc-400/30",
    dot: "bg-zinc-500",
  },
];

export default function Hub() {
  return (
    <div className="flex flex-col items-center justify-center h-full gap-8 px-4">
      {/* Title */}
      <div className="flex flex-col items-center gap-1 text-center">
        <Globe className="w-8 h-8 text-zinc-400 dark:text-zinc-500" />
        <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 tracking-tight">
          Select Server
        </h1>
        <p className="text-xs text-zinc-400 dark:text-zinc-500">
          Wähle deinen Lernmodus
        </p>
      </div>

      {/* Server list */}
      <div className="flex flex-col gap-3 w-full max-w-sm">
        {SERVERS.map((s) => {
          const Icon = s.icon;
          return (
            <Link
              key={s.href}
              href={s.href}
              className={`
                group relative flex items-center gap-4 rounded-2xl border bg-gradient-to-br px-4 py-4
                transition-all duration-150 active:scale-[0.98]
                ${s.color}
              `}
            >
              <div className="flex-none w-12 h-12 rounded-xl bg-white/10 dark:bg-black/20 flex items-center justify-center border border-white/10">
                <Icon className="w-6 h-6 text-zinc-700 dark:text-zinc-300" />
              </div>

              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm text-zinc-900 dark:text-zinc-100 truncate">
                  {s.name}
                </p>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 truncate mt-0.5">
                  {s.desc}
                </p>
              </div>

              <div className="flex-none flex flex-col items-end gap-1">
                <div className="flex items-center gap-1.5">
                  <span className={`w-2 h-2 rounded-full ${s.dot}`} />
                  <span className="text-[11px] text-zinc-500 dark:text-zinc-400 tabular-nums">
                    {s.ping}
                  </span>
                </div>
                <span className="text-[11px] text-zinc-400 dark:text-zinc-500 tabular-nums">
                  {s.players}
                </span>
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
