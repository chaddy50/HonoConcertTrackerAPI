-- CreateEnum
CREATE TYPE "PerformerType" AS ENUM ('ORCHESTRA', 'ENSEMBLE', 'SOLO', 'CHORUS', 'CONDUCTOR', 'OTHER');

-- CreateEnum
CREATE TYPE "PerformanceStatus" AS ENUM ('UPCOMING', 'ATTENDED', 'CANCELLED', 'MISSED', 'SKIPPED');

-- CreateTable
CREATE TABLE "Performer" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "sortName" TEXT,
    "type" "PerformerType" NOT NULL,
    "specialty" TEXT,
    "musicbrainzId" TEXT,

    CONSTRAINT "Performer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Composer" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "sortName" TEXT,
    "musicbrainzId" TEXT,

    CONSTRAINT "Composer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Work" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "type" TEXT,
    "key" TEXT,
    "catalogNumber" TEXT,
    "musicbrainzId" TEXT,

    CONSTRAINT "Work_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Venue" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "country" TEXT NOT NULL,
    "formattedAddress" TEXT,
    "websiteUri" TEXT,
    "osmType" TEXT,
    "osmId" BIGINT,

    CONSTRAINT "Venue_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Performance" (
    "id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "status" "PerformanceStatus" NOT NULL DEFAULT 'UPCOMING',
    "notes" TEXT,
    "venueId" TEXT NOT NULL,
    "conductorId" TEXT,

    CONSTRAINT "Performance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SetListEntry" (
    "id" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "performanceId" TEXT NOT NULL,
    "workId" TEXT NOT NULL,
    "conductorId" TEXT,

    CONSTRAINT "SetListEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SetListPerformer" (
    "role" TEXT NOT NULL,
    "setListEntryId" TEXT NOT NULL,
    "performerId" TEXT NOT NULL,

    CONSTRAINT "SetListPerformer_pkey" PRIMARY KEY ("setListEntryId","performerId","role")
);

-- CreateTable
CREATE TABLE "_ComposerToWork" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_ComposerToWork_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "_PerformanceHeadliners" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_PerformanceHeadliners_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE UNIQUE INDEX "Performer_musicbrainzId_key" ON "Performer"("musicbrainzId");

-- CreateIndex
CREATE UNIQUE INDEX "Composer_musicbrainzId_key" ON "Composer"("musicbrainzId");

-- CreateIndex
CREATE UNIQUE INDEX "Work_musicbrainzId_key" ON "Work"("musicbrainzId");

-- CreateIndex
CREATE INDEX "_ComposerToWork_B_index" ON "_ComposerToWork"("B");

-- CreateIndex
CREATE INDEX "_PerformanceHeadliners_B_index" ON "_PerformanceHeadliners"("B");

-- AddForeignKey
ALTER TABLE "Performance" ADD CONSTRAINT "Performance_venueId_fkey" FOREIGN KEY ("venueId") REFERENCES "Venue"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Performance" ADD CONSTRAINT "Performance_conductorId_fkey" FOREIGN KEY ("conductorId") REFERENCES "Performer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SetListEntry" ADD CONSTRAINT "SetListEntry_performanceId_fkey" FOREIGN KEY ("performanceId") REFERENCES "Performance"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SetListEntry" ADD CONSTRAINT "SetListEntry_workId_fkey" FOREIGN KEY ("workId") REFERENCES "Work"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SetListEntry" ADD CONSTRAINT "SetListEntry_conductorId_fkey" FOREIGN KEY ("conductorId") REFERENCES "Performer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SetListPerformer" ADD CONSTRAINT "SetListPerformer_setListEntryId_fkey" FOREIGN KEY ("setListEntryId") REFERENCES "SetListEntry"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SetListPerformer" ADD CONSTRAINT "SetListPerformer_performerId_fkey" FOREIGN KEY ("performerId") REFERENCES "Performer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ComposerToWork" ADD CONSTRAINT "_ComposerToWork_A_fkey" FOREIGN KEY ("A") REFERENCES "Composer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ComposerToWork" ADD CONSTRAINT "_ComposerToWork_B_fkey" FOREIGN KEY ("B") REFERENCES "Work"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_PerformanceHeadliners" ADD CONSTRAINT "_PerformanceHeadliners_A_fkey" FOREIGN KEY ("A") REFERENCES "Performance"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_PerformanceHeadliners" ADD CONSTRAINT "_PerformanceHeadliners_B_fkey" FOREIGN KEY ("B") REFERENCES "Performer"("id") ON DELETE CASCADE ON UPDATE CASCADE;
