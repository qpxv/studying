"use client";

import { Construction, Sparkles, Ticket, TicketCheckIcon } from "lucide-react";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function Ap1Page() {
  return (
    <div className="flex flex-col items-center justify-center h-full px-4 gap-4">
      <Link
        href="/"
        className="flex items-center gap-1.5 text-xs text-zinc-400 dark:text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 transition-colors"
      >
        <ArrowLeft className="w-3 h-3" /> Zurück zum Hub
      </Link>
      <div className="w-full max-w-sm rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 p-6 flex flex-col gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
            <Construction className="w-5 h-5 text-zinc-500 dark:text-zinc-400" />
          </div>
          <div>
            <p className="font-semibold text-sm text-zinc-900 dark:text-zinc-100">
              AP1
            </p>
            <p className="text-xs text-zinc-400 dark:text-zinc-500">
              In Planung
            </p>
          </div>
        </div>

        <p className="text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed">
          {"Keine Ahnung was wir hier hin machen sollen."}
          <br />
          <br />
          {"Da müssen wir mal brainstormen und Ideen sammeln :)"}
        </p>
      </div>
    </div>
  );
}
