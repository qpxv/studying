import { prisma } from '@/lib/prisma';
import { NotizenList } from './_components/notizen-list';

export default async function NotizenPage() {
  const categories = await prisma.category.findMany({
    orderBy: { createdAt: 'asc' },
  });
  return (
    <div className="flex flex-col gap-4 px-4 py-6 w-full">
      <NotizenList initialCategories={categories} />
    </div>
  );
}
