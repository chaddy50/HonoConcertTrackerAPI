/*
  Warnings:

  - You are about to drop the column `musicbrainzId` on the `Composer` table. All the data in the column will be lost.
  - You are about to drop the column `musicbrainzId` on the `Work` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[openOpusId]` on the table `Composer` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[openOpusId]` on the table `Work` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "Composer_musicbrainzId_key";

-- DropIndex
DROP INDEX "Work_musicbrainzId_key";

-- AlterTable
ALTER TABLE "Composer" DROP COLUMN "musicbrainzId",
ADD COLUMN     "openOpusId" TEXT;

-- AlterTable
ALTER TABLE "Work" DROP COLUMN "musicbrainzId",
ADD COLUMN     "openOpusId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Composer_openOpusId_key" ON "Composer"("openOpusId");

-- CreateIndex
CREATE UNIQUE INDEX "Work_openOpusId_key" ON "Work"("openOpusId");
