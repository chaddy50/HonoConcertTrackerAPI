/*
  Warnings:

  - Made the column `osmType` on table `Venue` required. This step will fail if there are existing NULL values in that column.
  - Made the column `osmId` on table `Venue` required. This step will fail if there are existing NULL values in that column.

*/
-- Remove venues that predate the OSM requirement and would block the NOT NULL constraint.
-- Must cascade through dependents in order: SetListPerformer → SetListEntry → Performance → Venue.
DELETE FROM "SetListPerformer" WHERE "setListEntryId" IN (
  SELECT id FROM "SetListEntry" WHERE "performanceId" IN (
    SELECT id FROM "Performance" WHERE "venueId" IN (
      SELECT id FROM "Venue" WHERE "osmType" IS NULL OR "osmId" IS NULL
    )
  )
);
DELETE FROM "SetListEntry" WHERE "performanceId" IN (
  SELECT id FROM "Performance" WHERE "venueId" IN (
    SELECT id FROM "Venue" WHERE "osmType" IS NULL OR "osmId" IS NULL
  )
);
DELETE FROM "Performance" WHERE "venueId" IN (
  SELECT id FROM "Venue" WHERE "osmType" IS NULL OR "osmId" IS NULL
);
DELETE FROM "Venue" WHERE "osmType" IS NULL OR "osmId" IS NULL;

-- AlterTable
ALTER TABLE "Venue" ALTER COLUMN "name" DROP NOT NULL,
ALTER COLUMN "city" DROP NOT NULL,
ALTER COLUMN "country" DROP NOT NULL,
ALTER COLUMN "osmType" SET NOT NULL,
ALTER COLUMN "osmId" SET NOT NULL;
