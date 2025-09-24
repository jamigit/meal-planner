import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import { URL } from 'url'

// Load environment variables
dotenv.config()

const app = express()
const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 3001

// Middleware
app.use(cors())
app.use(express.json())

// ===== Simple in-memory rate limit and cache =====
const RATE_LIMIT_WINDOW_MS = 60_000
const RATE_LIMIT_MAX = 10 // per IP per minute
const rateState = new Map() // ip -> { count, windowStart }

function rateLimit(req, res, next) {
  const ip = req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress || 'unknown'
  const now = Date.now()
  const state = rateState.get(ip) || { count: 0, windowStart: now }
  if (now - state.windowStart > RATE_LIMIT_WINDOW_MS) {
    state.count = 0
    state.windowStart = now
  }
  state.count += 1
  rateState.set(ip, state)
  if (state.count > RATE_LIMIT_MAX) {
    return res.status(429).json({ code: 'RATE_LIMITED', error: 'Too many requests. Please try again shortly.' })
  }
  next()
}

const CACHE_TTL_MS = 15 * 60_000
const scrapeCache = new Map() // url -> { data, ts }

// Claude API proxy endpoint
app.post('/api/claude', rateLimit, async (req, res) => {
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

// Helper: parse ISO8601 durations like PT30M -> minutes
function parseISODurationToMinutes(iso) {
  if (!iso || typeof iso !== 'string') return null
  // Basic matcher: PnDTnHnM
  const match = iso.match(/P(?:\d+Y)?(?:\d+M)?(?:\d+W)?(?:\d+D)?(?:T(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?)?/i)
  if (!match) return null
  const hours = parseInt(match[1] || '0', 10)
  const minutes = parseInt(match[2] || '0', 10)
  const seconds = parseInt(match[3] || '0', 10)
  const totalMinutes = hours * 60 + minutes + Math.round(seconds / 60)
  return totalMinutes || null
}

// Helper: extract Recipe object from JSON-LD blocks
function pickRecipeFromJsonLd(json) {
  try {
    if (!json) return null
    const isRecipe = (node) => {
      if (!node) return false
      const type = node['@type']
      if (!type) return false
      if (Array.isArray(type)) return type.map(String.toLowerCase).includes('recipe')
      return String(type).toLowerCase() === 'recipe'
    }

    if (Array.isArray(json)) {
      for (const item of json) {
        const found = pickRecipeFromJsonLd(item)
        if (found) return found
      }
    } else if (typeof json === 'object') {
      if (isRecipe(json)) return json
      // @graph
      if (Array.isArray(json['@graph'])) {
        for (const node of json['@graph']) {
          if (isRecipe(node)) return node
        }
      }
      // Sometimes nested in mainEntity
      if (json.mainEntity && isRecipe(json.mainEntity)) return json.mainEntity
    }
  } catch (_) {}
  return null
}

// Helper: normalize Recipe fields to our schema
function normalizeRecipe(recipe) {
  if (!recipe) return null
  const name = (recipe.name || '').toString().trim() || null
  // Ingredients may be array of strings or objects
  let ingredients = []
  if (Array.isArray(recipe.recipeIngredient)) {
    ingredients = recipe.recipeIngredient.map((x) => (x ?? '').toString().trim()).filter(Boolean)
  }
  // Instructions can be string, array of strings, or HowToStep objects
  let instructions = []
  const inst = recipe.recipeInstructions
  if (typeof inst === 'string') {
    instructions = inst.split(/\n+|\r+/).map(s => s.trim()).filter(Boolean)
  } else if (Array.isArray(inst)) {
    instructions = inst.map((step) => {
      if (typeof step === 'string') return step.trim()
      if (step && typeof step === 'object') {
        // HowToStep or HowToSection
        if (Array.isArray(step.itemListElement)) {
          return step.itemListElement.map(el => (el.text || el.name || '').toString().trim()).filter(Boolean).join(' ')
        }
        return (step.text || step.name || '').toString().trim()
      }
      return ''
    }).filter(Boolean)
  }

  const prep_time = parseISODurationToMinutes(recipe.prepTime)
  const cook_time = parseISODurationToMinutes(recipe.cookTime)
  let servings = null
  if (recipe.recipeYield) {
    const yieldStr = Array.isArray(recipe.recipeYield) ? recipe.recipeYield.join(' ') : String(recipe.recipeYield)
    const m = yieldStr.match(/(\d+)/)
    servings = m ? parseInt(m[1], 10) : null
  }
  let image_url = null
  if (recipe.image) {
    if (typeof recipe.image === 'string') image_url = recipe.image
    else if (Array.isArray(recipe.image) && recipe.image.length) image_url = recipe.image[0]
    else if (recipe.image.url) image_url = recipe.image.url
  }

  return {
    name,
    ingredients,
    instructions,
    prep_time,
    cook_time,
    servings,
    image_url
  }
}

// Basic URL validator: http/https only, no data/file/javascript
function isHttpUrlSafe(raw) {
  try {
    const u = new URL(raw)
    return (u.protocol === 'http:' || u.protocol === 'https:')
  } catch {
    return false
  }
}

// Recipe scrape endpoint (JSON-LD first)
app.post('/api/scrape-recipe', rateLimit, async (req, res) => {
  try {
    const { url } = req.body || {}
    if (!url || !isHttpUrlSafe(url)) {
      return res.status(400).json({ code: 'INVALID_URL', error: 'Invalid or unsupported URL' })
    }

    // Serve from cache if fresh
    const cached = scrapeCache.get(url)
    if (cached && (Date.now() - cached.ts) < CACHE_TTL_MS) {
      return res.json({ source_url: url, ...cached.data })
    }

    // Fetch page with timeout and headers
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 10000)
    let response
    try {
      response = await fetch(url, {
        method: 'GET',
        redirect: 'follow',
        signal: controller.signal,
        headers: {
          'User-Agent': 'MealPlannerScraper/1.0 (+https://example.local)'
        }
      })
    } catch (err) {
      clearTimeout(timeout)
      if (err.name === 'AbortError') {
        return res.status(504).json({ code: 'TIMEOUT', error: 'Fetch timed out' })
      }
      return res.status(502).json({ code: 'FETCH_ERROR', error: 'Failed to fetch URL' })
    }
    clearTimeout(timeout)

    if (!response.ok) {
      return res.status(response.status).json({ code: 'FETCH_ERROR', error: `Upstream responded ${response.status}` })
    }

    const html = await response.text()

    // Extract JSON-LD <script type="application/ld+json">
    const scriptRegex = /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi
    let match
    let foundRecipe = null
    while ((match = scriptRegex.exec(html)) !== null) {
      const raw = match[1]
      try {
        const json = JSON.parse(raw.trim())
        const recipe = pickRecipeFromJsonLd(json)
        if (recipe) {
          foundRecipe = recipe
          break
        }
      } catch (_) {
        // Some sites embed multiple JSONs or invalid snippets; skip
        continue
      }
    }

    // If JSON-LD not found, try microdata and heuristics
    let normalized = null
    if (foundRecipe) {
      normalized = normalizeRecipe(foundRecipe)
    }

    if (!normalized || !normalized.name) {
      // Microdata fallback: itemprop attributes
      const micro = extractMicrodataRecipe(html)
      if (micro && micro.name) {
        normalized = micro
      }
    }

    if (!normalized || !normalized.name) {
      // Heuristic fallback: look for common selectors/labels
      const heur = extractHeuristicRecipe(html)
      if (heur && heur.name) {
        normalized = heur
      }
    }

    if (!normalized || !normalized.name) {
      // Optional Spoonacular fallback
      const spoonEnabled = String(process.env.ENABLE_SPOONACULAR || '').toLowerCase() === 'true'
      const spoonKey = process.env.SPOONACULAR_API_KEY || process.env.VITE_SPOONACULAR_API_KEY
      if (spoonEnabled && spoonKey) {
        try {
          const extUrl = `https://api.spoonacular.com/recipes/extract?apiKey=${encodeURIComponent(spoonKey)}&url=${encodeURIComponent(url)}`
          const sRes = await fetch(extUrl)
          if (sRes.ok) {
            const sData = await sRes.json()
            const sNorm = normalizeSpoonacular(sData)
            if (sNorm && sNorm.name) {
              scrapeCache.set(url, { data: sNorm, ts: Date.now() })
              return res.json({ source_url: url, provider: 'spoonacular', ...sNorm })
            }
          }
        } catch (_) { /* ignore and fall through */ }
      }
      return res.status(422).json({ code: 'NO_RECIPE_FOUND', error: 'Could not extract recipe from page' })
    }

    // Cache and return
    scrapeCache.set(url, { data: normalized, ts: Date.now() })
    return res.json({ source_url: url, ...normalized })

  } catch (error) {
    console.error('Scrape error:', error)
    return res.status(500).json({ code: 'SERVER_ERROR', error: 'Internal server error' })
  }
})

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

// ==== Fallback extractors (simple, dependency-free) ====
function extractTextListFromMatches(matches) {
  const out = []
  for (const m of matches) {
    // Strip tags inside captured content
    const raw = m.replace(/<[^>]*>/g, ' ').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim()
    if (raw) out.push(raw)
  }
  return out
}

function extractBetween(html, startIndex, maxChars = 6000) {
  // Return a small slice around index for local parsing
  const from = Math.max(0, startIndex - 1000)
  return html.slice(from, Math.min(html.length, startIndex + maxChars))
}

function extractMicrodataRecipe(html) {
  try {
    // Name
    let name = null
    const nameMatch = html.match(/itemprop=["']name["'][^>]*>([\s\S]*?)<\/[^>]+>/i)
    if (nameMatch) {
      name = nameMatch[1].replace(/<[^>]*>/g, ' ').trim()
    }

    // Ingredients
    const ingMatches = [...html.matchAll(/itemprop=["']recipeIngredient["'][^>]*>([\s\S]*?)<\/[^>]+>/gi)].map(m => m[1])
    const ingredients = extractTextListFromMatches(ingMatches)

    // Instructions may appear as multiple HowToStep or a block
    const stepMatches = [...html.matchAll(/itemprop=["']recipeInstructions["'][^>]*>([\s\S]*?)<\/[^>]+>/gi)].map(m => m[1])
    let instructions = extractTextListFromMatches(stepMatches)
    if (instructions.length === 0) {
      // Look for HowToStep
      const howTo = [...html.matchAll(/itemprop=["']step["'][^>]*>([\s\S]*?)<\/[^>]+>/gi)].map(m => m[1])
      instructions = extractTextListFromMatches(howTo)
    }

    // Times (ISO 8601 or human readable)
    const prepIso = (html.match(/itemprop=["']prepTime["'][^>]*content=["']([^"']+)["']/i) || [])[1]
    const cookIso = (html.match(/itemprop=["']cookTime["'][^>]*content=["']([^"']+)["']/i) || [])[1]
    const prep_time = parseISODurationToMinutes(prepIso)
    const cook_time = parseISODurationToMinutes(cookIso)
    let servings = null
    const yieldMatch = html.match(/itemprop=["']recipeYield["'][^>]*>([\s\S]*?)<\/[^>]+>/i)
    if (yieldMatch) {
      const m = yieldMatch[1].replace(/<[^>]*>/g, ' ').match(/(\d+)/)
      if (m) servings = parseInt(m[1], 10)
    }

    if (!name && ingredients.length === 0 && instructions.length === 0) return null

    return {
      name: name || null,
      ingredients,
      instructions,
      prep_time: prep_time ?? null,
      cook_time: cook_time ?? null,
      servings: servings ?? null,
      image_url: null
    }
  } catch (_) {
    return null
  }
}

function extractHeuristicRecipe(html) {
  try {
    // Try to find title
    let name = null
    const h1 = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i)
    if (h1) name = h1[1].replace(/<[^>]*>/g, ' ').trim()

    // Ingredients: find a heading with "ingredient" then capture nearest list
    let ingredients = []
    const ingHeading = html.search(/>\s*ingredients?\s*</i)
    if (ingHeading !== -1) {
      const slice = extractBetween(html, ingHeading)
      const ul = slice.match(/<ul[^>]*>([\s\S]*?)<\/ul>/i)
      if (ul) {
        const li = [...ul[1].matchAll(/<li[^>]*>([\s\S]*?)<\/li>/gi)].map(m => m[1])
        ingredients = extractTextListFromMatches(li)
      }
    }

    // Instructions: find heading with "instruction" or "method" then list or paragraphs
    let instructions = []
    const instHeading = html.search(/>\s*(instructions?|method)\s*</i)
    if (instHeading !== -1) {
      const slice = extractBetween(html, instHeading)
      const ol = slice.match(/<ol[^>]*>([\s\S]*?)<\/ol>/i)
      if (ol) {
        const li = [...ol[1].matchAll(/<li[^>]*>([\s\S]*?)<\/li>/gi)].map(m => m[1])
        instructions = extractTextListFromMatches(li)
      } else {
        const paras = [...slice.matchAll(/<p[^>]*>([\s\S]*?)<\/p>/gi)].map(m => m[1])
        const cleaned = extractTextListFromMatches(paras)
        instructions = cleaned.slice(0, 20)
      }
    }

    if (!name && ingredients.length === 0 && instructions.length === 0) return null
    return {
      name: name || null,
      ingredients,
      instructions,
      prep_time: null,
      cook_time: null,
      servings: null,
      image_url: null
    }
  } catch (_) {
    return null
  }
}

// Spoonacular normalizer
function normalizeSpoonacular(data) {
  if (!data) return null
  const name = (data.title || '').toString().trim()
  const ingredients = Array.isArray(data.extendedIngredients)
    ? data.extendedIngredients.map(i => (i.original || i.originalName || i.name || '').toString().trim()).filter(Boolean)
    : (Array.isArray(data.ingredients) ? data.ingredients.map(x => (x || '').toString().trim()).filter(Boolean) : [])
  let instructions = []
  if (Array.isArray(data.analyzedInstructions) && data.analyzedInstructions.length > 0) {
    const steps = data.analyzedInstructions[0].steps || []
    instructions = steps.map(s => (s.step || '').toString().trim()).filter(Boolean)
  } else if (typeof data.instructions === 'string') {
    instructions = data.instructions.split(/\n+|\r+/).map(s => s.trim()).filter(Boolean)
  }
  const prep_time = Number.isFinite(data.preparationMinutes) ? data.preparationMinutes : null
  const cook_time = Number.isFinite(data.cookingMinutes) ? data.cookingMinutes : null
  const servings = Number.isFinite(data.servings) ? data.servings : null
  const image_url = data.image || null
  return { name, ingredients, instructions, prep_time, cook_time, servings, image_url }
}

app.listen(port, () => {
  console.log(`🚀 Claude API proxy server running on http://localhost:${port}`)
  console.log(`📍 API endpoint: http://localhost:${port}/api/claude`)
})