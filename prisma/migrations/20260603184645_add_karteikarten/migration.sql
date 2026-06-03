-- CreateTable
CREATE TABLE "karteikarte" (
    "id" INTEGER NOT NULL,
    "question" TEXT NOT NULL,
    "answer" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "karteikarte_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "karteikarte_bewertung" (
    "id" TEXT NOT NULL,
    "karteikarteId" INTEGER NOT NULL,
    "userId" TEXT NOT NULL,
    "score" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "karteikarte_bewertung_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "karteikarte_bewertung_karteikarteId_userId_key" ON "karteikarte_bewertung"("karteikarteId", "userId");

-- AddForeignKey
ALTER TABLE "karteikarte_bewertung" ADD CONSTRAINT "karteikarte_bewertung_karteikarteId_fkey" FOREIGN KEY ("karteikarteId") REFERENCES "karteikarte"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "karteikarte_bewertung" ADD CONSTRAINT "karteikarte_bewertung_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
