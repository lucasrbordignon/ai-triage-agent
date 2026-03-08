import { createClient } from '@libsql/client'
import path from 'path'

const dbPath = process.env.DB_PATH 
  ?? path.resolve(process.cwd(), 'data', 'app.db')

const db = createClient({
  url: `file:${dbPath}`
})

export default db