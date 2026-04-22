import { prisma } from '@/lib/prisma';
import { FeedbackForm } from './_components/feedback-form';

export default async function FeedbackPage() {
  const entries = await prisma.feedback.findMany({
    orderBy: { createdAt: 'desc' },
  });

  return (
    <div className="flex flex-col gap-4 px-4 py-6 max-w-sm mx-auto w-full">
      <FeedbackForm initialEntries={entries} />
    </div>
  );
}
