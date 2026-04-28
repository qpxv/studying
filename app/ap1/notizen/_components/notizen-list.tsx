'use client';

import { useState, useTransition } from 'react';
import { CategoryForm } from './category-form';
import { CategoryAccordion } from './category-accordion';
import { createCategory, updateCategoryName, updateCategoryMarkdown, deleteCategory } from '../actions';

interface Category {
  id: string;
  name: string;
  markdownContent: string | null;
  createdAt: Date;
  updatedAt: Date;
}

interface Props {
  initialCategories: Category[];
}

export function NotizenList({ initialCategories }: Props) {
  const [categories, setCategories] = useState<Category[]>(initialCategories);
  const [isPending, startTransition] = useTransition();

  async function handleAdd(name: string) {
    const tempId = crypto.randomUUID();
    const optimistic: Category = {
      id: tempId,
      name,
      markdownContent: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    setCategories((prev) => [...prev, optimistic]);
    startTransition(async () => {
      const real = await createCategory(name);
      setCategories((prev) => prev.map((c) => c.id === tempId ? real : c));
    });
  }

  async function handleRename(id: string, name: string) {
    setCategories((prev) => prev.map((c) => c.id === id ? { ...c, name } : c));
    startTransition(async () => {
      await updateCategoryName(id, name);
    });
  }

  async function handleUpload(id: string, markdown: string) {
    setCategories((prev) => prev.map((c) => c.id === id ? { ...c, markdownContent: markdown } : c));
    startTransition(async () => {
      await updateCategoryMarkdown(id, markdown);
    });
  }

  async function handleDelete(id: string) {
    setCategories((prev) => prev.filter((c) => c.id !== id));
    startTransition(async () => {
      await deleteCategory(id);
    });
  }

  return (
    <div className="flex flex-col gap-4">
      <p className="text-xs font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">
        Lernmaterial
      </p>

      <CategoryForm onAdd={handleAdd} isPending={isPending} />

      {categories.length === 0 ? (
        <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-8 flex items-center justify-center">
          <p className="text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed text-center">
            Noch keine Kategorien – erstelle deine erste oben.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {categories.map((category) => (
            <CategoryAccordion
              key={category.id}
              category={category}
              onRename={handleRename}
              onUpload={handleUpload}
              onDelete={handleDelete}
              isPending={isPending}
            />
          ))}
        </div>
      )}
    </div>
  );
}
