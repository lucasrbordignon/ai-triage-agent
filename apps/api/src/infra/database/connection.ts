import { createClient } from '@libsql/client'
import path from 'path'

const db = createClient({
  url: `file:${path.resolve(process.cwd(), 'data', 'app.db')}`
})

export default db
