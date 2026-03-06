import './infra/database'
import "dotenv/config";
import app from './app'
import { initDatabase } from './infra/database'

const PORT = process.env.PORT || 3000

initDatabase()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`)
    })
  })
  .catch((err) => {
    console.error('Failed to initialize database:', err)
    process.exit(1)
  })
