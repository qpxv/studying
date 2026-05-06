-- AlterTable
ALTER TABLE "category" ADD COLUMN     "kategorieId" TEXT,
ADD COLUMN     "order" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "kategorie" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "kategorie_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "category" ADD CONSTRAINT "category_kategorieId_fkey" FOREIGN KEY ("kategorieId") REFERENCES "kategorie"("id") ON DELETE SET NULL ON UPDATE CASCADE;
