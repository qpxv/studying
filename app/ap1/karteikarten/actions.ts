'use server';

import { headers } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { Prisma } from '@/app/generated/prisma/client';

// ── Karteikarten ───────────────────────────────────────────────────────────

export async function createKarteikarte(
  id: number,
  question: string,
  answer: string,
): Promise<{ success: true } | { error: string }> {
  if (!Number.isInteger(id) || id < 1) return { error: 'Ungültige Karten-ID' };
  if (!question.trim()) return { error: 'Frage darf nicht leer sein' };
  if (!answer.trim()) return { error: 'Antwort darf nicht leer sein' };

  try {
    await prisma.karteikarte.create({ data: { id, question: question.trim(), answer: answer.trim() } });
    revalidatePath('/ap1/karteikarten');
    return { success: true };
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
      return { error: `Karte mit ID ${id} existiert bereits` };
    }
    throw err;
  }
}

export async function importKarteikarten(
  cards: { id: number; question: string; answer: string }[],
): Promise<{ imported: number; errors: string[] }> {
  let imported = 0;
  const errors: string[] = [];

  for (const card of cards) {
    if (!Number.isInteger(card.id) || card.id < 1) {
      errors.push(`id=${card.id}: Ungültige ID`);
      continue;
    }
    if (!card.question?.trim()) {
      errors.push(`id=${card.id}: Frage fehlt`);
      continue;
    }
    if (!card.answer?.trim()) {
      errors.push(`id=${card.id}: Antwort fehlt`);
      continue;
    }
    try {
      await prisma.karteikarte.upsert({
        where: { id: card.id },
        update: { question: card.question.trim(), answer: card.answer.trim() },
        create: { id: card.id, question: card.question.trim(), answer: card.answer.trim() },
      });
      imported++;
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      errors.push(`id=${card.id}: ${msg}`);
    }
  }

  revalidatePath('/ap1/karteikarten');
  return { imported, errors };
}

export async function deleteKarteikarte(id: number): Promise<{ success: true } | { error: string }> {
  try {
    await prisma.karteikarteBewertung.deleteMany({ where: { karteikarteId: id } });
    await prisma.karteikarte.delete({ where: { id } });
    revalidatePath('/ap1/karteikarten');
    return { success: true };
  } catch {
    return { error: 'Karte konnte nicht gelöscht werden' };
  }
}

export async function updateKarteikarte(
  id: number,
  question: string,
  answer: string,
): Promise<{ success: true } | { error: string }> {
  if (!question.trim()) return { error: 'Frage darf nicht leer sein' };
  if (!answer.trim()) return { error: 'Antwort darf nicht leer sein' };

  try {
    await prisma.karteikarte.update({
      where: { id },
      data: { question: question.trim(), answer: answer.trim() },
    });
    revalidatePath('/ap1/karteikarten');
    return { success: true };
  } catch {
    return { error: 'Karte konnte nicht gespeichert werden' };
  }
}

// ── Bewertungen ────────────────────────────────────────────────────────────

export async function saveScore(karteikarteId: number, score: string): Promise<void> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) throw new Error('Nicht angemeldet');
  const userId = session.user.id;

  await prisma.karteikarteBewertung.upsert({
    where: { karteikarteId_userId: { karteikarteId, userId } },
    update: { score },
    create: { karteikarteId, userId, score },
  });

  revalidatePath('/ap1/karteikarten/stats');
  revalidatePath('/ap1/karteikarten/fragen');
}
