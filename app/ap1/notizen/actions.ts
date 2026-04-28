'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

export async function createCategory(name: string) {
  if (!name.trim()) throw new Error('Name darf nicht leer sein.');
  const category = await prisma.category.create({ data: { name: name.trim() } });
  revalidatePath('/ap1/notizen');
  return category;
}

export async function updateCategoryName(id: string, name: string): Promise<void> {
  if (!name.trim()) throw new Error('Name darf nicht leer sein.');
  await prisma.category.update({ where: { id }, data: { name: name.trim() } });
  revalidatePath('/ap1/notizen');
}

export async function updateCategoryMarkdown(id: string, markdownContent: string): Promise<void> {
  await prisma.category.update({ where: { id }, data: { markdownContent } });
  revalidatePath('/ap1/notizen');
}

export async function deleteCategory(id: string): Promise<void> {
  await prisma.category.delete({ where: { id } });
  revalidatePath('/ap1/notizen');
}
