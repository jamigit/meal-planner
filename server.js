import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'

// Load environment variables
dotenv.config()

const app = express()
const port = 3001

// Middleware
app.use(cors())
app.use(express.json())

// Claude API proxy endpoint
app.post('/api/claude', async (req, res) => {
  try {
    const { prompt, userNotes } = req.body

    const apiKey = process.env.VITE_CLAUDE_API_KEY || process.env.CLAUDE_API_KEY

    console.log('🔑 API Key status:', apiKey ? `Present (${apiKey.substring(0, 20)}...)` : 'Missing')

    if (!apiKey) {
      return res.status(500).json({
        error: 'Claude API key not configured on server'
      })
    }

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 1024,
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ]
      })
    })

    if (!response.ok) {
      const errorData = await response.text()
      return res.status(response.status).json({
        error: `Claude API error: ${response.status} - ${errorData}`
      })
    }

    const data = await response.json()
    res.json(data)

  } catch (error) {
    console.error('Server error:', error)
    res.status(500).json({
      error: 'Internal server error: ' + error.message
    })
  }
})

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

app.listen(port, () => {
  console.log(`🚀 Claude API proxy server running on http://localhost:${port}`)
  console.log(`📍 API endpoint: http://localhost:${port}/api/claude`)
})