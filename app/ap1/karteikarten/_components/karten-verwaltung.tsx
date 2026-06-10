'use client';

import { useState, useTransition } from 'react';
import { ChevronDown, Trash2, Pencil, Check, X } from 'lucide-react';
import { deleteKarteikarte, updateKarteikarte } from '../actions';

interface Card {
  id: number;
  question: string;
  answer: string;
}

interface Props {
  cards: Card[];
}

function CardRow({ card }: { card: Card }) {
  const [editing, setEditing] = useState(false);
  const [question, setQuestion] = useState(card.question);
  const [answer, setAnswer] = useState(card.answer);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSave() {
    if (!question.trim() || !answer.trim()) return;
    startTransition(async () => {
      await updateKarteikarte(card.id, question, answer);
      setEditing(false);
    });
  }

  function handleCancelEdit() {
    setQuestion(card.question);
    setAnswer(card.answer);
    setEditing(false);
  }

  function handleDeleteClick() {
    if (!confirmDelete) {
      setConfirmDelete(true);
      setDeleteError(null);
      return;
    }
    startTransition(async () => {
      const result = await deleteKarteikarte(card.id);
      if ('error' in result) {
        setDeleteError(result.error);
        setConfirmDelete(false);
      }
    });
  }

  if (editing) {
    return (
      <div className="py-3 border-b border-zinc-100 dark:border-zinc-800 last:border-0 flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <span className="text-xs text-zinc-400 dark:text-zinc-500">#{card.id}</span>
          <div className="flex items-center gap-1">
            <button
              onClick={handleSave}
              disabled={isPending || !question.trim() || !answer.trim()}
              className="flex items-center gap-1 text-xs text-green-600 dark:text-green-400 font-medium px-2 py-1 rounded-lg hover:bg-green-50 dark:hover:bg-green-950/30 transition-colors disabled:opacity-40"
            >
              <Check className="w-3 h-3" />
              {isPending ? 'Speichern…' : 'Speichern'}
            </button>
            <button
              onClick={handleCancelEdit}
              disabled={isPending}
              className="flex items-center gap-1 text-xs text-zinc-400 dark:text-zinc-500 px-2 py-1 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
            >
              <X className="w-3 h-3" />
              Abbrechen
            </button>
          </div>
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs text-zinc-400 dark:text-zinc-500">Frage</label>
          <textarea
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            rows={2}
            className="w-full rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 px-3 py-2 text-sm outline-none focus:border-zinc-400 dark:focus:border-zinc-500 transition-colors resize-none"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs text-zinc-400 dark:text-zinc-500">Antwort</label>
          <textarea
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            rows={3}
            className="w-full rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 px-3 py-2 text-sm outline-none focus:border-zinc-400 dark:focus:border-zinc-500 transition-colors resize-none"
          />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-0.5 border-b border-zinc-100 dark:border-zinc-800 last:border-0">
      {deleteError && (
        <p className="text-xs text-red-500 px-0 pt-2">{deleteError}</p>
      )}
      <div className="group flex items-center gap-3 py-3">
      <span className="text-xs text-zinc-400 dark:text-zinc-500 w-8 shrink-0">#{card.id}</span>
      <p className="flex-1 text-sm text-zinc-700 dark:text-zinc-300 truncate min-w-0">{card.question}</p>
      <div className={`flex items-center gap-0.5 shrink-0 transition-opacity ${confirmDelete ? '' : 'opacity-0 group-hover:opacity-100'}`}>
        {confirmDelete ? (
          <>
            <button
              onClick={handleDeleteClick}
              disabled={isPending}
              className="text-xs text-red-500 hover:text-red-600 font-medium px-2 py-1 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors disabled:opacity-40"
            >
              {isPending ? 'Löschen…' : 'Löschen?'}
            </button>
            <button
              onClick={() => setConfirmDelete(false)}
              className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </>
        ) : (
          <>
            <button
              onClick={() => setEditing(true)}
              className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
            >
              <Pencil className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={handleDeleteClick}
              className="p-1.5 rounded-lg text-zinc-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </>
        )}
      </div>
      </div>
    </div>
  );
}

export function KartenVerwaltung({ cards }: Props) {
  const [open, setOpen] = useState(false);

  return (
    <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-5 py-4 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors"
      >
        <div className="flex items-center gap-2">
          <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Karten verwalten</p>
          <span className="text-xs text-zinc-400 dark:text-zinc-500 tabular-nums">{cards.length}</span>
        </div>
        <ChevronDown className={`w-4 h-4 text-zinc-400 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="border-t border-zinc-100 dark:border-zinc-800 px-4 max-h-96 overflow-y-auto">
          {cards.length === 0 ? (
            <p className="text-sm text-zinc-400 dark:text-zinc-500 py-6 text-center">Keine Karten vorhanden</p>
          ) : (
            cards.map((card) => <CardRow key={card.id} card={card} />)
          )}
        </div>
      )}
    </div>
  );
}
