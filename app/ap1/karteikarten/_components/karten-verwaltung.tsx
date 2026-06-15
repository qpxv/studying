'use client';

import { useState, useTransition } from 'react';
import { ChevronDown, Trash2, Pencil, Check, X } from 'lucide-react';
import { deleteKarteikarte, updateKarteikarte } from '../actions';
import { DifficultyDots } from './difficulty-dots';

interface Card {
  id: number;
  karteikartenNr: number;
  question: string;
  answer: string;
  difficulty: number;
}

interface Props {
  cards: Card[];
}

const DIFFICULTY_LABELS: Record<number, string> = { 1: 'Leicht', 2: 'Mittel', 3: 'Schwer' };

function DifficultyPills({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <div className="flex rounded-xl overflow-hidden border border-zinc-200 dark:border-zinc-700">
      {[1, 2, 3].map((level) => (
        <button
          key={level}
          type="button"
          onClick={() => onChange(level)}
          className={`flex-1 py-1.5 text-xs font-medium transition-colors ${
            value === level
              ? 'bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900'
              : 'text-zinc-500 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800'
          }`}
        >
          {DIFFICULTY_LABELS[level]}
        </button>
      ))}
    </div>
  );
}

function CardRow({ card }: { card: Card }) {
  const [editing, setEditing] = useState(false);
  const [karteikartenNr, setKarteikartenNr] = useState(card.karteikartenNr);
  const [question, setQuestion] = useState(card.question);
  const [answer, setAnswer] = useState(card.answer);
  const [difficulty, setDifficulty] = useState(card.difficulty);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSave() {
    if (!question.trim() || !answer.trim() || !karteikartenNr || karteikartenNr < 1) return;
    startTransition(async () => {
      await updateKarteikarte(card.id, question, answer, difficulty, karteikartenNr);
      setEditing(false);
    });
  }

  function handleCancelEdit() {
    setKarteikartenNr(card.karteikartenNr);
    setQuestion(card.question);
    setAnswer(card.answer);
    setDifficulty(card.difficulty);
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

  return (
    <>
      {/* Normal list row */}
      <div className="flex flex-col gap-0.5 border-b border-zinc-100 dark:border-zinc-800 last:border-0">
        {deleteError && (
          <p className="text-xs text-red-500 px-0 pt-2">{deleteError}</p>
        )}
        <div className="group flex items-center gap-3 py-3">
          <span className="text-xs text-zinc-400 dark:text-zinc-500 w-8 shrink-0">#{card.karteikartenNr}</span>
          <DifficultyDots difficulty={card.difficulty} />
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

      {/* Edit dialog */}
      {editing && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-[5vh] bg-black/50 backdrop-blur-sm"
          onClick={(e) => { if (e.target === e.currentTarget) handleCancelEdit(); }}
        >
          <div className="w-full max-w-2xl h-[90vh] flex flex-col rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden shadow-2xl">

            {/* Dialog header */}
            <div className="flex-none flex items-center justify-between gap-4 px-5 py-4 border-b border-zinc-200 dark:border-zinc-800">
              <div className="flex items-center gap-2">
                <span className="text-xs text-zinc-400 dark:text-zinc-500 font-medium">#</span>
                <input
                  type="number"
                  min={1}
                  value={karteikartenNr}
                  onChange={(e) => setKarteikartenNr(Number(e.target.value))}
                  className="w-20 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 px-2 py-1.5 text-sm outline-none focus:border-zinc-400 dark:focus:border-zinc-500 transition-colors"
                />
                <DifficultyPills value={difficulty} onChange={setDifficulty} />
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={handleCancelEdit}
                  disabled={isPending}
                  className="flex items-center gap-1.5 text-sm text-zinc-400 dark:text-zinc-500 px-3 py-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors disabled:opacity-40"
                >
                  <X className="w-3.5 h-3.5" />
                  Abbrechen
                </button>
                <button
                  onClick={handleSave}
                  disabled={isPending || !question.trim() || !answer.trim() || !karteikartenNr || karteikartenNr < 1}
                  className="flex items-center gap-1.5 text-sm font-medium px-3 py-1.5 rounded-lg bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 hover:opacity-80 active:scale-95 transition-all disabled:opacity-40"
                >
                  <Check className="w-3.5 h-3.5" />
                  {isPending ? 'Speichern…' : 'Speichern'}
                </button>
              </div>
            </div>

            {/* Dialog body */}
            <div className="flex-1 min-h-0 flex flex-col p-5 gap-4">
              {/* Frage — small */}
              <div className="flex-none flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">Frage</label>
                <textarea
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  rows={3}
                  className="w-full rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 px-3 py-2.5 text-sm outline-none focus:border-zinc-400 dark:focus:border-zinc-500 transition-colors resize-none"
                />
              </div>

              {/* Antwort — fills remaining height */}
              <div className="flex-1 min-h-0 flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">Antwort</label>
                <textarea
                  value={answer}
                  onChange={(e) => setAnswer(e.target.value)}
                  className="flex-1 min-h-0 w-full rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 px-3 py-2.5 text-sm outline-none focus:border-zinc-400 dark:focus:border-zinc-500 transition-colors resize-none"
                />
              </div>
            </div>

          </div>
        </div>
      )}
    </>
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
