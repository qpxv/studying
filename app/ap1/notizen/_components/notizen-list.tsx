'use client';

import { useState, useTransition, useCallback } from 'react';
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { GripVertical } from 'lucide-react';
import { KategorieForm } from './kategorie-form';
import { KategorieSection } from './kategorie-section';
import {
  createCategory,
  updateCategoryName,
  updateCategoryMarkdown,
  deleteCategory,
  moveThema,
  createKategorie,
  updateKategorieName,
  deleteKategorie,
} from '../actions';

interface Thema {
  id: string;
  name: string;
  markdownContent: string | null;
  kategorieId: string | null;
  order: number;
  createdAt: Date;
  updatedAt: Date;
}

interface Kategorie {
  id: string;
  name: string;
  order: number;
  createdAt: Date;
  updatedAt: Date;
  themen: Thema[];
}

interface Props {
  initialKategorien: Kategorie[];
  initialOhneKategorie: Thema[];
}

export function NotizenList({ initialKategorien, initialOhneKategorie }: Props) {
  const [kategorien, setKategorien] = useState<Kategorie[]>(initialKategorien);
  const [ohneKategorie, setOhneKategorie] = useState<Thema[]>(initialOhneKategorie);
  const [activeThemaId, setActiveThemaId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor),
  );

  // ── Drag & Drop ──────────────────────────────────────────────────────────

  function handleDragStart(event: DragStartEvent) {
    setActiveThemaId(event.active.id as string);
  }

  function handleDragEnd(event: DragEndEvent) {
    setActiveThemaId(null);
    const { active, over } = event;
    if (!over) return;

    const themaId = active.id as string;
    const targetContainerId = over.id as string;
    const targetKategorieId = targetContainerId === 'ohne' ? null : targetContainerId;

    // Find current thema and its container
    let foundThema: Thema | undefined;
    for (const k of kategorien) {
      foundThema = k.themen.find((t) => t.id === themaId);
      if (foundThema) break;
    }
    if (!foundThema) foundThema = ohneKategorie.find((t) => t.id === themaId);
    if (!foundThema) return;

    if (foundThema.kategorieId === targetKategorieId) return;

    const updatedThema = { ...foundThema, kategorieId: targetKategorieId };

    setKategorien((prev) =>
      prev.map((k) => ({ ...k, themen: k.themen.filter((t) => t.id !== themaId) }))
    );
    setOhneKategorie((prev) => prev.filter((t) => t.id !== themaId));

    if (targetKategorieId === null) {
      setOhneKategorie((prev) => [...prev, updatedThema]);
    } else {
      setKategorien((prev) =>
        prev.map((k) =>
          k.id === targetKategorieId ? { ...k, themen: [...k.themen, updatedThema] } : k
        )
      );
    }

    startTransition(async () => {
      await moveThema(themaId, targetKategorieId);
    });
  }

  // ── Kategorien ────────────────────────────────────────────────────────────

  async function handleAddKategorie(name: string) {
    const tempId = crypto.randomUUID();
    const optimistic: Kategorie = {
      id: tempId,
      name,
      order: 0,
      themen: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    setKategorien((prev) => [...prev, optimistic]);
    startTransition(async () => {
      const real = await createKategorie(name);
      setKategorien((prev) =>
        prev.map((k) => (k.id === tempId ? { ...optimistic, ...real } : k))
      );
    });
  }

  async function handleRenameKategorie(id: string, name: string) {
    setKategorien((prev) => prev.map((k) => (k.id === id ? { ...k, name } : k)));
    startTransition(async () => { await updateKategorieName(id, name); });
  }

  async function handleDeleteKategorie(id: string) {
    const kat = kategorien.find((k) => k.id === id);
    if (kat) {
      const displaced = kat.themen.map((t) => ({ ...t, kategorieId: null }));
      setOhneKategorie((prev) => [...prev, ...displaced]);
    }
    setKategorien((prev) => prev.filter((k) => k.id !== id));
    startTransition(async () => { await deleteKategorie(id); });
  }

  // ── Themen ────────────────────────────────────────────────────────────────

  function makeAddThema(kategorieId: string | null) {
    return async (name: string) => {
      const tempId = crypto.randomUUID();
      const optimistic: Thema = {
        id: tempId,
        name,
        markdownContent: null,
        kategorieId,
        order: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      if (kategorieId === null) {
        setOhneKategorie((prev) => [...prev, optimistic]);
      } else {
        setKategorien((prev) =>
          prev.map((k) =>
            k.id === kategorieId ? { ...k, themen: [...k.themen, optimistic] } : k
          )
        );
      }
      startTransition(async () => {
        const real = await createCategory(name, kategorieId);
        if (kategorieId === null) {
          setOhneKategorie((prev) => prev.map((t) => (t.id === tempId ? { ...real, kategorieId: null } : t)));
        } else {
          setKategorien((prev) =>
            prev.map((k) =>
              k.id === kategorieId
                ? { ...k, themen: k.themen.map((t) => (t.id === tempId ? { ...real, kategorieId } : t)) }
                : k
            )
          );
        }
      });
    };
  }

  const handleRenameThema = useCallback(async (id: string, name: string) => {
    setKategorien((prev) =>
      prev.map((k) => ({ ...k, themen: k.themen.map((t) => (t.id === id ? { ...t, name } : t)) }))
    );
    setOhneKategorie((prev) => prev.map((t) => (t.id === id ? { ...t, name } : t)));
    startTransition(async () => { await updateCategoryName(id, name); });
  }, []);

  const handleUploadThema = useCallback(async (id: string, markdownContent: string) => {
    setKategorien((prev) =>
      prev.map((k) => ({
        ...k,
        themen: k.themen.map((t) => (t.id === id ? { ...t, markdownContent } : t)),
      }))
    );
    setOhneKategorie((prev) => prev.map((t) => (t.id === id ? { ...t, markdownContent } : t)));
    startTransition(async () => { await updateCategoryMarkdown(id, markdownContent); });
  }, []);

  const handleDeleteThema = useCallback(async (id: string) => {
    setKategorien((prev) =>
      prev.map((k) => ({ ...k, themen: k.themen.filter((t) => t.id !== id) }))
    );
    setOhneKategorie((prev) => prev.filter((t) => t.id !== id));
    startTransition(async () => { await deleteCategory(id); });
  }, []);

  // ── Active thema for overlay ───────────────────────────────────────────────

  const activeThema = activeThemaId
    ? kategorien.flatMap((k) => k.themen).find((t) => t.id === activeThemaId) ??
      ohneKategorie.find((t) => t.id === activeThemaId) ??
      null
    : null;

  const totalThemen = kategorien.reduce((s, k) => s + k.themen.length, 0) + ohneKategorie.length;

  return (
    <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className="flex flex-col gap-4">
        <p className="text-xs font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">
          Lernmaterial
        </p>

        <KategorieForm onAdd={handleAddKategorie} isPending={isPending} />

        {kategorien.length === 0 && totalThemen === 0 ? (
          <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-8 flex items-center justify-center">
            <p className="text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed text-center">
              Noch keine Kategorien – erstelle deine erste oben.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {kategorien.map((kat) => (
              <KategorieSection
                key={kat.id}
                kategorie={kat}
                themen={kat.themen}
                onRenameKategorie={handleRenameKategorie}
                onDeleteKategorie={handleDeleteKategorie}
                onAddThema={makeAddThema(kat.id)}
                onRenameThema={handleRenameThema}
                onUploadThema={handleUploadThema}
                onDeleteThema={handleDeleteThema}
                isPending={isPending}
              />
            ))}

            <KategorieSection
              key="ohne"
              kategorie={null}
              themen={ohneKategorie}
              onAddThema={makeAddThema(null)}
              onRenameThema={handleRenameThema}
              onUploadThema={handleUploadThema}
              onDeleteThema={handleDeleteThema}
              isPending={isPending}
            />
          </div>
        )}
      </div>

      <DragOverlay>
        {activeThema ? (
          <div className="rounded-2xl border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-900 shadow-lg px-5 py-4 flex items-center gap-3 opacity-90">
            <GripVertical className="w-4 h-4 text-zinc-400 dark:text-zinc-500 flex-none" />
            <span className="font-semibold text-sm text-zinc-900 dark:text-zinc-100 truncate">
              {activeThema.name}
            </span>
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
