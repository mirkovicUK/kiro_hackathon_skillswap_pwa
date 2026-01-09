import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import { initDatabase } from './db.js'
import authRoutes from './routes/auth.js'
import userRoutes from './routes/users.js'
import matchRoutes from './routes/matches.js'
import meetingRoutes from './routes/meetings.js'

const app = express()
const PORT = process.env.PORT || 3001

// Middleware
app.use(cors())
app.use(express.json())

// Initialize database
initDatabase()

// Routes
app.use('/api/auth', authRoutes)
app.use('/api/users', userRoutes)
app.use('/api/matches', matchRoutes)
app.use('/api/meetings', meetingRoutes)

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack)
  res.status(500).json({ error: 'server_error', message: 'Something went wrong' })
})

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`)
})
