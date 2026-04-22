import { headers } from 'next/headers';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { FeedbackForm } from './_components/feedback-form';

export default async function FeedbackPage() {
  const [session, entries] = await Promise.all([
    auth.api.getSession({ headers: await headers() }),
    prisma.feedback.findMany({ orderBy: { createdAt: 'desc' } }),
  ]);

  return (
    <div className="flex flex-col gap-4 px-4 py-6 max-w-sm mx-auto w-full">
      <FeedbackForm initialEntries={entries} userName={session?.user.name ?? null} />
    </div>
  );
}
