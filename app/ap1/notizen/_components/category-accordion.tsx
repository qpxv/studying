'use client';

import { useState, useRef, useEffect } from 'react';
import { Folder, FolderOpen, ChevronDown, Pencil, Trash2, Upload, Check, X, Eye, FileText } from 'lucide-react';
import { marked } from 'marked';

interface Category {
  id: string;
  name: string;
  markdownContent: string | null;
  createdAt: Date;
  updatedAt: Date;
}

interface Props {
  category: Category;
  onRename: (id: string, name: string) => Promise<void>;
  onUpload: (id: string, markdown: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  isPending: boolean;
}

const PROSE =
  'text-sm text-zinc-700 dark:text-zinc-300 leading-relaxed ' +
  '[&_h1]:text-xl [&_h1]:font-bold [&_h1]:mb-3 [&_h1]:text-zinc-900 [&_h1]:dark:text-zinc-100 ' +
  '[&_h2]:text-lg [&_h2]:font-semibold [&_h2]:mb-2 [&_h2]:mt-5 [&_h2]:text-zinc-900 [&_h2]:dark:text-zinc-100 ' +
  '[&_h3]:font-semibold [&_h3]:mb-1 [&_h3]:mt-4 [&_h3]:text-zinc-900 [&_h3]:dark:text-zinc-100 ' +
  '[&_p]:mb-3 [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:mb-3 ' +
  '[&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:mb-3 [&_li]:mb-1 ' +
  '[&_strong]:font-semibold [&_strong]:text-zinc-900 [&_strong]:dark:text-zinc-100 ' +
  '[&_code]:font-mono [&_code]:text-xs [&_code]:bg-zinc-100 [&_code]:dark:bg-zinc-800 [&_code]:px-1 [&_code]:rounded ' +
  '[&_pre]:bg-zinc-100 [&_pre]:dark:bg-zinc-800 [&_pre]:rounded-xl [&_pre]:p-4 [&_pre]:overflow-x-auto [&_pre]:mb-3 [&_pre_code]:bg-transparent [&_pre_code]:px-0 ' +
  '[&_blockquote]:border-l-2 [&_blockquote]:border-zinc-300 [&_blockquote]:dark:border-zinc-700 [&_blockquote]:pl-4 [&_blockquote]:text-zinc-500 [&_blockquote]:mb-3 ' +
  '[&_a]:underline [&_hr]:border-zinc-200 [&_hr]:dark:border-zinc-800 [&_hr]:my-4 ' +
  '[&_table]:w-full [&_table]:mb-4 [&_table]:border-collapse [&_table]:overflow-hidden [&_table]:rounded-xl ' +
  '[&_thead]:bg-zinc-100 [&_thead]:dark:bg-zinc-800 ' +
  '[&_th]:px-4 [&_th]:py-2.5 [&_th]:text-left [&_th]:text-xs [&_th]:font-semibold [&_th]:text-zinc-900 [&_th]:dark:text-zinc-100 [&_th]:uppercase [&_th]:tracking-wider [&_th]:border-b [&_th]:border-zinc-200 [&_th]:dark:border-zinc-700 ' +
  '[&_td]:px-4 [&_td]:py-2.5 [&_td]:text-sm [&_td]:text-zinc-700 [&_td]:dark:text-zinc-300 [&_td]:border-b [&_td]:border-zinc-100 [&_td]:dark:border-zinc-800 ' +
  '[&_tr:last-child_td]:border-0 ' +
  '[&_tbody_tr:hover]:bg-zinc-50 [&_tbody_tr:hover]:dark:bg-zinc-800/50';

export function CategoryAccordion({ category, onRename, onUpload, onDelete, isPending }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(category.name);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const [contentMode, setContentMode] = useState<'view' | 'edit'>('view');
  const [editTab, setEditTab] = useState<'write' | 'preview'>('write');
  const [draft, setDraft] = useState(category.markdownContent ?? '');
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Keep draft in sync when content changes from outside (file upload / server revalidation)
  // but only when not actively editing
  useEffect(() => {
    if (contentMode === 'view') setDraft(category.markdownContent ?? '');
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [category.markdownContent]);

  // Auto-resize textarea
  useEffect(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = 'auto';
    ta.style.height = `${ta.scrollHeight}px`;
  }, [draft, contentMode, editTab]);

  function handleToggleOpen() {
    if (isEditing) return;
    const next = !isOpen;
    setIsOpen(next);
    if (next && !category.markdownContent) {
      setContentMode('edit');
      setEditTab('write');
    }
  }

  async function handleRename() {
    if (!editValue.trim() || editValue.trim() === category.name) {
      setIsEditing(false);
      setEditValue(category.name);
      return;
    }
    await onRename(category.id, editValue.trim());
    setIsEditing(false);
  }

  function handleEditKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') { e.preventDefault(); handleRename(); }
    if (e.key === 'Escape') { setIsEditing(false); setEditValue(category.name); }
  }

  async function handleSaveContent() {
    setIsSaving(true);
    await onUpload(category.id, draft);
    setContentMode('view');
    setIsSaving(false);
  }

  function handleCancelContent() {
    setDraft(category.markdownContent ?? '');
    setContentMode(category.markdownContent ? 'view' : 'edit');
    setEditTab('write');
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    const reader = new FileReader();
    reader.onload = async (ev) => {
      const text = ev.target?.result as string;
      setDraft(text);
      await onUpload(category.id, text);
      setIsUploading(false);
      setContentMode('view');
      if (fileInputRef.current) fileInputRef.current.value = '';
    };
    reader.readAsText(file);
  }

  async function handleDelete() {
    await onDelete(category.id);
    setShowDeleteConfirm(false);
  }

  const viewHtml = category.markdownContent ? (marked.parse(category.markdownContent) as string) : null;
  const previewHtml = draft ? (marked.parse(draft) as string) : null;
  const busy = isSaving || isUploading || isPending;

  return (
    <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden">
      {/* ── Header ── */}
      <div
        className="flex items-center gap-3 px-5 py-4 cursor-pointer select-none"
        onClick={handleToggleOpen}
      >
        <div className="flex-none w-9 h-9 rounded-lg bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
          {isOpen
            ? <FolderOpen className="w-4 h-4 text-zinc-600 dark:text-zinc-400" />
            : <Folder    className="w-4 h-4 text-zinc-600 dark:text-zinc-400" />
          }
        </div>

        {isEditing ? (
          <input
            autoFocus
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onKeyDown={handleEditKeyDown}
            onClick={(e) => e.stopPropagation()}
            className="flex-1 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 px-3 py-1.5 text-sm outline-none focus:border-zinc-400 dark:focus:border-zinc-500 transition-colors"
          />
        ) : (
          <span className="flex-1 font-semibold text-sm text-zinc-900 dark:text-zinc-100 truncate">
            {category.name}
          </span>
        )}

        <div className="flex items-center gap-1 flex-none" onClick={(e) => e.stopPropagation()}>
          {isEditing ? (
            <>
              <button onClick={handleRename} disabled={isPending} className="w-7 h-7 rounded-lg flex items-center justify-center text-zinc-400 dark:text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors disabled:opacity-40">
                <Check className="w-3.5 h-3.5" />
              </button>
              <button onClick={() => { setIsEditing(false); setEditValue(category.name); }} className="w-7 h-7 rounded-lg flex items-center justify-center text-zinc-400 dark:text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors">
                <X className="w-3.5 h-3.5" />
              </button>
            </>
          ) : showDeleteConfirm ? (
            <>
              <span className="text-xs text-zinc-500 dark:text-zinc-400 mr-1">Löschen?</span>
              <button onClick={handleDelete} disabled={isPending} className="w-7 h-7 rounded-lg flex items-center justify-center text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors disabled:opacity-40">
                <Check className="w-3.5 h-3.5" />
              </button>
              <button onClick={() => setShowDeleteConfirm(false)} className="w-7 h-7 rounded-lg flex items-center justify-center text-zinc-400 dark:text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors">
                <X className="w-3.5 h-3.5" />
              </button>
            </>
          ) : (
            <>
              <button onClick={() => { setIsEditing(true); setEditValue(category.name); }} className="w-7 h-7 rounded-lg flex items-center justify-center text-zinc-400 dark:text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors">
                <Pencil className="w-3.5 h-3.5" />
              </button>
              <button onClick={() => setShowDeleteConfirm(true)} className="w-7 h-7 rounded-lg flex items-center justify-center text-zinc-400 dark:text-zinc-500 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </>
          )}
        </div>

        {!isEditing && (
          <ChevronDown className={`flex-none w-4 h-4 text-zinc-400 dark:text-zinc-500 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
        )}
      </div>

      {/* ── Body ── */}
      {isOpen && (
        <div className="border-t border-zinc-200 dark:border-zinc-800">

          {contentMode === 'edit' ? (
            /* ── Edit mode ── */
            <div className="px-5 py-4 flex flex-col gap-3">
              {/* Tab bar + actions */}
              <div className="flex items-center justify-between gap-2">
                {/* Tabs */}
                <div className="flex items-center gap-1 bg-zinc-100 dark:bg-zinc-800 rounded-xl p-1">
                  <button
                    onClick={() => setEditTab('write')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                      editTab === 'write'
                        ? 'bg-white dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100 shadow-sm'
                        : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300'
                    }`}
                  >
                    <FileText className="w-3 h-3" />
                    Schreiben
                  </button>
                  <button
                    onClick={() => setEditTab('preview')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                      editTab === 'preview'
                        ? 'bg-white dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100 shadow-sm'
                        : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300'
                    }`}
                  >
                    <Eye className="w-3 h-3" />
                    Vorschau
                  </button>
                </div>

                {/* Save / cancel / upload */}
                <div className="flex items-center gap-2">
                  <label className={`inline-flex items-center gap-1.5 text-xs transition-colors cursor-pointer ${busy ? 'opacity-50 pointer-events-none' : 'text-zinc-400 dark:text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'}`}>
                    <Upload className="w-3 h-3" />
                    .md
                    <input ref={fileInputRef} type="file" accept=".md,text/markdown" className="sr-only" onChange={handleFileChange} disabled={busy} />
                  </label>
                  <button
                    onClick={handleCancelContent}
                    disabled={busy}
                    className="text-xs text-zinc-400 dark:text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 transition-colors disabled:opacity-40"
                  >
                    Abbrechen
                  </button>
                  <button
                    onClick={handleSaveContent}
                    disabled={busy}
                    className="px-3 py-1.5 rounded-lg bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 text-xs font-medium hover:opacity-80 active:scale-95 transition-all disabled:opacity-40"
                  >
                    {isSaving ? 'Speichern…' : 'Speichern'}
                  </button>
                </div>
              </div>

              {/* Write tab */}
              {editTab === 'write' && (
                <textarea
                  ref={textareaRef}
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  placeholder="Markdown hier eingeben…&#10;&#10;# Überschrift&#10;**fett**, *kursiv*, `code`&#10;&#10;| Spalte 1 | Spalte 2 |&#10;|---|---|&#10;| Wert | Wert |"
                  className="w-full resize-none rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 placeholder-zinc-300 dark:placeholder-zinc-600 px-4 py-3 text-sm font-mono leading-relaxed outline-none focus:border-zinc-400 dark:focus:border-zinc-500 transition-colors min-h-[200px]"
                  style={{ overflow: 'hidden' }}
                />
              )}

              {/* Preview tab */}
              {editTab === 'preview' && (
                previewHtml
                  ? <div className={PROSE} dangerouslySetInnerHTML={{ __html: previewHtml }} />
                  : <p className="text-sm text-zinc-400 dark:text-zinc-500 italic">Noch nichts zum Anzeigen.</p>
              )}
            </div>
          ) : (
            /* ── View mode ── */
            <div className="px-5 py-4">
              {/* Toolbar */}
              <div className="flex items-center justify-between mb-4">
                <p className="text-xs font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">
                  Inhalt
                </p>
                <div className="flex items-center gap-3">
                  <label className={`inline-flex items-center gap-1.5 text-xs transition-colors cursor-pointer ${busy ? 'opacity-50 pointer-events-none' : 'text-zinc-400 dark:text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'}`}>
                    <Upload className="w-3 h-3" />
                    .md hochladen
                    <input ref={fileInputRef} type="file" accept=".md,text/markdown" className="sr-only" onChange={handleFileChange} disabled={busy} />
                  </label>
                  <button
                    onClick={() => { setContentMode('edit'); setEditTab('write'); }}
                    className="inline-flex items-center gap-1.5 text-xs text-zinc-400 dark:text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 transition-colors"
                  >
                    <Pencil className="w-3 h-3" />
                    Bearbeiten
                  </button>
                </div>
              </div>

              {viewHtml
                ? <div className={PROSE} dangerouslySetInnerHTML={{ __html: viewHtml }} />
                : <p className="text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed">Noch kein Inhalt.</p>
              }
            </div>
          )}
        </div>
      )}
    </div>
  );
}
