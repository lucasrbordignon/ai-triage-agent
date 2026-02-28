import db from './connection'
import { runMigrations } from './migrate'

export async function initDatabase() {
  await runMigrations()
}

export default db
