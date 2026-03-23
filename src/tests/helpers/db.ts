import db from '../../db.js'

// Truncate all tables between tests to ensure a clean state.
// CASCADE handles foreign key constraints automatically.
export async function resetDatabase() {
  await db.$executeRaw`
    TRUNCATE TABLE
      "SetListPerformer",
      "SetListEntry",
      "Performance",
      "_PerformanceHeadliners",
      "_ComposerToWork",
      "Performer",
      "Composer",
      "Work",
      "Venue"
    CASCADE
  `
}
