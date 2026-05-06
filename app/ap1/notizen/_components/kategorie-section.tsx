'use client';

import { useState, memo } from 'react';
import { useDroppable } from '@dnd-kit/core';
import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { ChevronDown, Pencil, Trash2, Check, X, GripVertical, Layers } from 'lucide-react';
import { CategoryAccordion } from './category-accordion';
import { CategoryForm } from './category-form';

interface Thema {
  id: string;
  name: string;
  markdownContent: string | null;
  kategorieId: string | null;
  order: number;
  createdAt: Date;
  updatedAt: Date;
}

interface KategorieData {
  id: string;
  name: string;
  order: number;
  createdAt: Date;
  updatedAt: Date;
}

interface Props {
  kategorie: KategorieData | null;
  themen: Thema[];
  onRenameKategorie?: (id: string, name: string) => Promise<void>;
  onDeleteKategorie?: (id: string) => Promise<void>;
  onAddThema: (name: string) => Promise<void>;
  onRenameThema: (id: string, name: string) => Promise<void>;
  onUploadThema: (id: string, markdown: string) => Promise<void>;
  onDeleteThema: (id: string) => Promise<void>;
  isPending: boolean;
  isDragOver?: boolean;
}

const DraggableThema = memo(function DraggableThema({
  thema,
  onRename,
  onUpload,
  onDelete,
  isPending,
}: {
  thema: Thema;
  onRename: (id: string, name: string) => Promise<void>;
  onUpload: (id: string, markdown: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  isPending: boolean;
}) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: thema.id });

  return (
    <div ref={setNodeRef} className={`flex items-start gap-1.5 ${isDragging ? 'opacity-40' : ''}`}>
      <button
        {...attributes}
        {...listeners}
        className="mt-4 flex-none p-1 text-zinc-300 dark:text-zinc-600 cursor-grab active:cursor-grabbing hover:text-zinc-400 dark:hover:text-zinc-500 transition-colors touch-none"
        aria-label="Thema verschieben"
      >
        <GripVertical className="w-4 h-4" />
      </button>
      <div className="flex-1 min-w-0">
        <CategoryAccordion
          category={thema}
          onRename={onRename}
          onUpload={onUpload}
          onDelete={onDelete}
          isPending={isPending}
        />
      </div>
    </div>
  );
});

export function KategorieSection({
  kategorie,
  themen,
  onRenameKategorie,
  onDeleteKategorie,
  onAddThema,
  onRenameThema,
  onUploadThema,
  onDeleteThema,
  isPending,
}: Props) {
  const droppableId = kategorie?.id ?? 'ohne';
  const { setNodeRef, isOver } = useDroppable({ id: droppableId });

  const [isOpen, setIsOpen] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(kategorie?.name ?? '');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const isOhne = kategorie === null;
  const sectionName = kategorie?.name ?? 'Ohne Kategorie';

  async function handleRename() {
    if (!editValue.trim() || editValue.trim() === kategorie?.name || !kategorie || !onRenameKategorie) {
      setIsEditing(false);
      setEditValue(kategorie?.name ?? '');
      return;
    }
    await onRenameKategorie(kategorie.id, editValue.trim());
    setIsEditing(false);
  }

  function handleEditKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') { e.preventDefault(); handleRename(); }
    if (e.key === 'Escape') { setIsEditing(false); setEditValue(kategorie?.name ?? ''); }
  }

  async function handleDelete() {
    if (!kategorie || !onDeleteKategorie) return;
    await onDeleteKategorie(kategorie.id);
    setShowDeleteConfirm(false);
  }

  return (
    <div
      className={`rounded-2xl border bg-white dark:bg-zinc-900 overflow-hidden transition-all duration-150 ${
        isOver
          ? 'border-zinc-400 dark:border-zinc-500 shadow-md'
          : 'border-zinc-200 dark:border-zinc-800'
      }`}
    >
      {/* Header */}
      <div
        className="flex items-center gap-3 px-5 py-4 cursor-pointer select-none"
        onClick={() => { if (!isEditing) setIsOpen((o) => !o); }}
      >
        <div className="flex-none w-9 h-9 rounded-lg bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
          <Layers className="w-4 h-4 text-zinc-600 dark:text-zinc-400" />
        </div>

        {isEditing && !isOhne ? (
          <input
            autoFocus
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onKeyDown={handleEditKeyDown}
            onClick={(e) => e.stopPropagation()}
            className="flex-1 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 px-3 py-1.5 text-sm outline-none focus:border-zinc-400 dark:focus:border-zinc-500 transition-colors"
          />
        ) : (
          <div className="flex-1 flex items-center gap-2 min-w-0">
            <span className="font-semibold text-sm text-zinc-900 dark:text-zinc-100 truncate">
              {sectionName}
            </span>
            <span className="text-xs text-zinc-400 dark:text-zinc-500 flex-none">
              {themen.length} {themen.length === 1 ? 'Thema' : 'Themen'}
            </span>
          </div>
        )}

        {!isOhne && (
          <div className="flex items-center gap-1 flex-none" onClick={(e) => e.stopPropagation()}>
            {isEditing ? (
              <>
                <button
                  onClick={handleRename}
                  disabled={isPending}
                  className="w-7 h-7 rounded-lg flex items-center justify-center text-zinc-400 dark:text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors disabled:opacity-40"
                >
                  <Check className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => { setIsEditing(false); setEditValue(kategorie?.name ?? ''); }}
                  className="w-7 h-7 rounded-lg flex items-center justify-center text-zinc-400 dark:text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </>
            ) : showDeleteConfirm ? (
              <>
                <span className="text-xs text-zinc-500 dark:text-zinc-400 mr-1">Löschen?</span>
                <button
                  onClick={handleDelete}
                  disabled={isPending}
                  className="w-7 h-7 rounded-lg flex items-center justify-center text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors disabled:opacity-40"
                >
                  <Check className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="w-7 h-7 rounded-lg flex items-center justify-center text-zinc-400 dark:text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => { setIsEditing(true); setEditValue(kategorie?.name ?? ''); }}
                  className="w-7 h-7 rounded-lg flex items-center justify-center text-zinc-400 dark:text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                >
                  <Pencil className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="w-7 h-7 rounded-lg flex items-center justify-center text-zinc-400 dark:text-zinc-500 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </>
            )}
          </div>
        )}

        {!isEditing && (
          <ChevronDown
            className={`flex-none w-4 h-4 text-zinc-400 dark:text-zinc-500 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
          />
        )}
      </div>

      {/* Body */}
      {isOpen && (
        <div className="border-t border-zinc-200 dark:border-zinc-800">
          <div
            ref={setNodeRef}
            className={`flex flex-col gap-3 px-5 py-4 min-h-[60px] transition-colors duration-150 ${
              isOver ? 'bg-zinc-50 dark:bg-zinc-800/40' : ''
            }`}
          >
            {themen.length === 0 ? (
              <p className={`text-xs text-center py-4 transition-colors ${isOver ? 'text-zinc-500 dark:text-zinc-400' : 'text-zinc-300 dark:text-zinc-600'}`}>
                {isOver ? 'Hier ablegen' : 'Noch keine Themen – hierhin ziehen oder unten hinzufügen.'}
              </p>
            ) : (
              themen.map((thema) => (
                <DraggableThema
                  key={thema.id}
                  thema={thema}
                  onRename={onRenameThema}
                  onUpload={onUploadThema}
                  onDelete={onDeleteThema}
                  isPending={isPending}
                />
              ))
            )}
          </div>

          <CategoryForm onAdd={onAddThema} isPending={isPending} />
        </div>
      )}
    </div>
  );
}
