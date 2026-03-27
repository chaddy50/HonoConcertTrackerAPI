import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/index.js";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
  // ── Composers ────────────────────────────────────────────────────────────
  const beethoven = await prisma.composer.create({
    data: { name: "Ludwig van Beethoven", sortName: "Beethoven, Ludwig van" },
  });
  const brahms = await prisma.composer.create({
    data: { name: "Johannes Brahms", sortName: "Brahms, Johannes" },
  });
  const mozart = await prisma.composer.create({
    data: { name: "Wolfgang Amadeus Mozart", sortName: "Mozart, Wolfgang Amadeus" },
  });
  const ravel = await prisma.composer.create({
    data: { name: "Maurice Ravel", sortName: "Ravel, Maurice" },
  });

  // ── Works ─────────────────────────────────────────────────────────────────
  const beethoven5 = await prisma.work.create({
    data: {
      title: "Symphony No. 5 in C minor",
      type: "Symphony",
      key: "C minor",
      catalogNumber: "Op. 67",
      composers: { connect: { id: beethoven.id } },
    },
  });
  const brahmsPC2 = await prisma.work.create({
    data: {
      title: "Piano Concerto No. 2 in B-flat major",
      type: "Concerto",
      key: "B-flat major",
      catalogNumber: "Op. 83",
      composers: { connect: { id: brahms.id } },
    },
  });
  const mozart41 = await prisma.work.create({
    data: {
      title: "Symphony No. 41 in C major \"Jupiter\"",
      type: "Symphony",
      key: "C major",
      catalogNumber: "K. 551",
      composers: { connect: { id: mozart.id } },
    },
  });
  const bolero = await prisma.work.create({
    data: {
      title: "Boléro",
      type: "Ballet",
      composers: { connect: { id: ravel.id } },
    },
  });

  // ── Performers ────────────────────────────────────────────────────────────
  const karajan = await prisma.performer.create({
    data: { name: "Herbert von Karajan", sortName: "Karajan, Herbert von", type: "CONDUCTOR" },
  });
  const berlinPhil = await prisma.performer.create({
    data: { name: "Berliner Philharmoniker", sortName: "Berliner Philharmoniker", type: "ORCHESTRA" },
  });
  const argerich = await prisma.performer.create({
    data: { name: "Martha Argerich", sortName: "Argerich, Martha", type: "SOLO", specialty: "piano" },
  });
  const rattle = await prisma.performer.create({
    data: { name: "Simon Rattle", sortName: "Rattle, Simon", type: "CONDUCTOR" },
  });
  const lso = await prisma.performer.create({
    data: { name: "London Symphony Orchestra", sortName: "London Symphony Orchestra", type: "ORCHESTRA" },
  });

  // ── Venues ────────────────────────────────────────────────────────────────
  const carnegieHall = await prisma.venue.create({
    data: {
      name: "Carnegie Hall",
      city: "New York",
      country: "US",
      formattedAddress: "881 7th Ave, New York, NY 10019",
      websiteUri: "https://www.carnegiehall.org",
      osmType: "way",
      osmId: BigInt(112418500),
    },
  });
  const royalAlbertHall = await prisma.venue.create({
    data: {
      name: "Royal Albert Hall",
      city: "London",
      country: "GB",
      formattedAddress: "Kensington Gore, London SW7 2AP",
      websiteUri: "https://www.royalalberthall.com",
      osmType: "way",
      osmId: BigInt(22483027),
    },
  });

  // ── Performance 1: Beethoven 5 + Brahms PC2 at Carnegie Hall ─────────────
  const p1 = await prisma.performance.create({
    data: {
      date: new Date("2025-11-15T20:00:00-05:00"),
      status: "ATTENDED",
      venueId: carnegieHall.id,
      conductorId: karajan.id,
      performers: { connect: [{ id: berlinPhil.id }, { id: argerich.id }] },
    },
  });

  const sle1 = await prisma.setListEntry.create({
    data: {
      order: 1,
      notes: "Argerich's tempo in the first movement was astonishing — effortless at that speed.",
      performanceId: p1.id,
      workId: brahmsPC2.id,
      conductorId: karajan.id,
    },
  });
  await prisma.setListPerformer.create({
    data: { setListEntryId: sle1.id, performerId: argerich.id, role: "piano" },
  });

  await prisma.setListEntry.create({
    data: {
      order: 2,
      notes: "Karajan drew an unusually dark reading — the finale felt inevitable rather than triumphant.",
      performanceId: p1.id,
      workId: beethoven5.id,
      conductorId: karajan.id,
    },
  });

  // ── Performance 2: Mozart 41 + Boléro at Royal Albert Hall ───────────────
  const p2 = await prisma.performance.create({
    data: {
      date: new Date("2026-04-10T19:30:00+01:00"),
      status: "UPCOMING",
      venueId: royalAlbertHall.id,
      conductorId: rattle.id,
      performers: { connect: [{ id: lso.id }] },
    },
  });

  await prisma.setListEntry.create({
    data: {
      order: 1,
      performanceId: p2.id,
      workId: mozart41.id,
      conductorId: rattle.id,
    },
  });
  await prisma.setListEntry.create({
    data: {
      order: 2,
      performanceId: p2.id,
      workId: bolero.id,
      conductorId: rattle.id,
    },
  });

  console.log(`Seeded 2 performances (${p1.id}, ${p2.id})`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
