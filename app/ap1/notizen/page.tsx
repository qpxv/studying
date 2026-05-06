import { prisma } from '@/lib/prisma';
import { NotizenList } from './_components/notizen-list';

export default async function NotizenPage() {
  const kategorien = await prisma.kategorie.findMany({
    orderBy: { order: 'asc' },
    include: { themen: { orderBy: { order: 'asc' } } },
  });
  const ohneKategorie = await prisma.category.findMany({
    where: { kategorieId: null },
    orderBy: { order: 'asc' },
  });
  return (
    <div className="flex flex-col gap-4 px-4 py-6 w-full">
      <NotizenList initialKategorien={kategorien} initialOhneKategorie={ohneKategorie} />
    </div>
  );
}
