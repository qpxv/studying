'use client';

import { useState } from 'react';
import { Plus } from 'lucide-react';

interface Props {
  onAdd: (name: string) => Promise<void>;
  isPending: boolean;
}

export function CategoryForm({ onAdd, isPending }: Props) {
  const [value, setValue] = useState('');

  async function handleSubmit() {
    const trimmed = value.trim();
    if (!trimmed || isPending) return;
    await onAdd(trimmed);
    setValue('');
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSubmit();
    }
  }

  return (
    <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5">
      <p className="text-xs font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider mb-3">
        Neue Kategorie
      </p>
      <div className="flex items-center gap-2">
        <input
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Kategoriename…"
          disabled={isPending}
          className="flex-1 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-500 px-4 py-2.5 text-sm outline-none focus:border-zinc-400 dark:focus:border-zinc-500 transition-colors disabled:opacity-50"
        />
        <button
          onClick={handleSubmit}
          disabled={!value.trim() || isPending}
          className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 text-sm font-medium hover:opacity-80 active:scale-95 transition-all disabled:opacity-40"
        >
          <Plus className="w-4 h-4" />
          Hinzufügen
        </button>
      </div>
    </div>
  );
}
