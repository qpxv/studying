'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

export async function createFeedback(author: string | undefined, content: string) {
  if (!content.trim()) throw new Error('Content required');
  await prisma.feedback.create({
    data: { author: author?.trim() || null, content: content.trim() },
  });
  revalidatePath('/ap1/feedback');
}
