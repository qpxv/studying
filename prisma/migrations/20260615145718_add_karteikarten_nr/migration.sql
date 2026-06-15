-- AlterTable
ALTER TABLE "karteikarte" ADD COLUMN     "karteikartenNr" INTEGER NOT NULL DEFAULT 0;

-- Backfill: set karteikartenNr = id for all existing rows
UPDATE "karteikarte" SET "karteikartenNr" = "id";
