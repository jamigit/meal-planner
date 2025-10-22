/**
 * @fileoverview LLM-powered recipe tag suggestion service
 * 
 * Uses Claude API to analyze recipes and suggest appropriate tags from the taxonomy.
 * Provides caching, rate limiting, and fallback mechanisms.
 */

import { TAG_TAXONOMY } from '../constants/recipeTags.js'

class RecipeTagSuggestionService {
  constructor() {
    this.cache = new Map()
    this.cacheTimeout = 15 * 60 * 1000 // 15 minutes
    this.rateLimit = {
      requests: 0,
      windowStart: Date.now(),
      maxRequests: 10,
      windowMs: 60 * 1000 // 1 minute
    }
  }

  /**
   * Suggest tags for a recipe using Claude API
   * @param {Object} recipe - Recipe object
   * @returns {Promise<Object>} Suggested tags by category
   */
  async suggestTagsForRecipe(recipe) {
    try {
      // Check cache first
      const cacheKey = this.getCacheKey(recipe)
      const cached = this.getFromCache(cacheKey)
      if (cached) {
        return {
          success: true,
          data: cached,
          cached: true
        }
      }

      // Check rate limit
      if (!this.checkRateLimit()) {
        return {
          success: false,
          error: 'Rate limit exceeded. Please try again in a minute.',
          fallback: await this.getFallbackSuggestions(recipe)
        }
      }

      // Build prompt and call Claude API
      const prompt = this.buildPrompt(recipe)
      const response = await this.callClaudeAPI(prompt)
      const suggestedTags = this.parseAndValidate(response)

      // Cache the result
      this.setCache(cacheKey, suggestedTags)

      return {
        success: true,
        data: suggestedTags,
        cached: false
      }
    } catch (error) {
      console.error('Error suggesting tags:', error)
      
      // Return fallback suggestions
      const fallback = await this.getFallbackSuggestions(recipe)
      return {
        success: false,
        error: error.message.includes('API unavailable') 
          ? 'AI tagging unavailable - using smart suggestions instead'
          : `Failed to get AI suggestions: ${error.message}`,
        fallback
      }
    }
  }

  /**
   * Build the prompt for Claude API
   * @param {Object} recipe - Recipe object
   * @returns {string} Formatted prompt
   */
  buildPrompt(recipe) {
    const taxonomyText = Object.entries(TAG_TAXONOMY)
      .map(([category, tags]) => `${category.replace('_tags', '')}: ${tags.join(', ')}`)
      .join('\n')

    return `You are a recipe categorization expert. Analyze this recipe and suggest tags.

RULES:
- Select tags ONLY from the provided taxonomy below
- Maximum 3 tags per category, ideally 1-2
- Only select clearly applicable tags
- Return JSON only, no other text

RECIPE:
Name: ${recipe.name || 'Unknown'}
Ingredients: ${(recipe.ingredients || []).join(', ')}
Instructions: ${(recipe.instructions || []).join(' ')}
Prep Time: ${recipe.prep_time || 'Unknown'} min
Cook Time: ${recipe.cook_time || 'Unknown'} min

TAXONOMY:
${taxonomyText}

RESPONSE (JSON only):
{
  "cuisine_tags": [],
  "ingredient_tags": [],
  "convenience_tags": [],
  "dietary_tags": []
}`
  }

  /**
   * Call Claude API with the prompt
   * @param {string} prompt - The prompt to send
   * @returns {Promise<string>} API response
   */
  async callClaudeAPI(prompt) {
    const apiBase = (import.meta && import.meta.env && import.meta.env.VITE_API_BASE) || 'http://localhost:3001'
    
    try {
      const response = await fetch(`${apiBase}/api/suggest-tags`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt })
      })

      if (!response.ok) {
        throw new Error(`API request failed: ${response.status} ${response.statusText}`)
      }

      const data = await response.json()
      return data.response || data.content || ''
    } catch (error) {
      console.warn('Claude API unavailable, using fallback:', error.message)
      // Return a mock response that will trigger fallback logic
      throw new Error('API unavailable - using fallback suggestions')
    }
  }

  /**
   * Parse and validate the LLM response
   * @param {string} response - Raw API response
   * @returns {Object} Parsed and validated tags
   */
  parseAndValidate(response) {
    try {
      // Extract JSON from response (handle cases where LLM adds extra text)
      const jsonMatch = response.match(/\{[\s\S]*\}/)
      if (!jsonMatch) {
        throw new Error('No JSON found in response')
      }

      const parsed = JSON.parse(jsonMatch[0])
      
      // Validate structure
      const validated = {
        cuisine_tags: this.validateTags(parsed.cuisine_tags || [], 'cuisine_tags'),
        ingredient_tags: this.validateTags(parsed.ingredient_tags || [], 'ingredient_tags'),
        convenience_tags: this.validateTags(parsed.convenience_tags || [], 'convenience_tags'),
        dietary_tags: this.validateTags(parsed.dietary_tags || [], 'dietary_tags')
      }

      return validated
    } catch (error) {
      console.error('Error parsing LLM response:', error)
      throw new Error(`Failed to parse response: ${error.message}`)
    }
  }

  /**
   * Validate tags against taxonomy
   * @param {Array} tags - Tags to validate
   * @param {string} category - Tag category
   * @returns {Array} Validated tags
   */
  validateTags(tags, category) {
    if (!Array.isArray(tags)) return []
    
    const validTags = TAG_TAXONOMY[category] || []
    return tags
      .filter(tag => typeof tag === 'string' && validTags.includes(tag))
      .slice(0, 3) // Limit to 3 tags per category
  }

  /**
   * Get fallback suggestions when AI fails
   * @param {Object} recipe - Recipe object
   * @returns {Promise<Object>} Fallback suggestions
   */
  async getFallbackSuggestions(recipe) {
    const suggestions = {
      cuisine_tags: [],
      ingredient_tags: [],
      convenience_tags: [],
      dietary_tags: []
    }

    // Simple keyword-based fallback
    const name = (recipe.name || '').toLowerCase()
    const ingredients = (recipe.ingredients || []).join(' ').toLowerCase()
    const instructions = (recipe.instructions || []).join(' ').toLowerCase()
    const text = `${name} ${ingredients} ${instructions}`

    // Cuisine detection
    if (text.includes('italian') || text.includes('pasta') || text.includes('pizza') || text.includes('parmesan') || text.includes('basil')) {
      suggestions.cuisine_tags.push('Italian')
    } else if (text.includes('asian') || text.includes('soy') || text.includes('ginger') || text.includes('sesame') || text.includes('rice')) {
      suggestions.cuisine_tags.push('Asian')
    } else if (text.includes('mexican') || text.includes('taco') || text.includes('salsa') || text.includes('cilantro') || text.includes('lime')) {
      suggestions.cuisine_tags.push('Mexican')
    } else if (text.includes('mediterranean') || text.includes('olive') || text.includes('feta') || text.includes('hummus')) {
      suggestions.cuisine_tags.push('Mediterranean')
    } else if (text.includes('indian') || text.includes('curry') || text.includes('cumin') || text.includes('turmeric')) {
      suggestions.cuisine_tags.push('Indian')
    }

    // Ingredient detection
    if (text.includes('chicken')) {
      suggestions.ingredient_tags.push('Chicken')
    } else if (text.includes('beef') || text.includes('steak') || text.includes('ground beef')) {
      suggestions.ingredient_tags.push('Beef')
    } else if (text.includes('pork') || text.includes('bacon') || text.includes('ham')) {
      suggestions.ingredient_tags.push('Pork')
    } else if (text.includes('fish') || text.includes('salmon') || text.includes('tuna') || text.includes('shrimp') || text.includes('crab')) {
      suggestions.ingredient_tags.push('Seafood')
    } else if (text.includes('vegetable') || text.includes('carrot') || text.includes('broccoli') || text.includes('spinach') || text.includes('tomato')) {
      suggestions.ingredient_tags.push('Vegetable')
    } else if (text.includes('pasta') || text.includes('noodle') || text.includes('spaghetti')) {
      suggestions.ingredient_tags.push('Pasta')
    } else if (text.includes('rice') || text.includes('quinoa') || text.includes('barley')) {
      suggestions.ingredient_tags.push('Rice')
    } else if (text.includes('soup') || text.includes('broth') || text.includes('stock')) {
      suggestions.ingredient_tags.push('Soup')
    } else if (text.includes('salad') || text.includes('lettuce') || text.includes('greens')) {
      suggestions.ingredient_tags.push('Salad')
    } else if (text.includes('egg') || text.includes('eggs')) {
      suggestions.ingredient_tags.push('Egg')
    } else if (text.includes('bean') || text.includes('lentil') || text.includes('chickpea')) {
      suggestions.ingredient_tags.push('Beans')
    }

    // Convenience detection
    const totalTime = (recipe.prep_time || 0) + (recipe.cook_time || 0)
    if (totalTime <= 30) {
      suggestions.convenience_tags.push('Quick')
    }
    if (totalTime <= 15) {
      suggestions.convenience_tags.push('Easy')
    }
    if (text.includes('one pot') || text.includes('one-pot') || text.includes('single pot')) {
      suggestions.convenience_tags.push('One-Pot')
    }
    if (text.includes('slow cooker') || text.includes('crock pot') || text.includes('slow-cooker')) {
      suggestions.convenience_tags.push('Slow-Cooker')
    }
    if (text.includes('instant pot') || text.includes('pressure cooker')) {
      suggestions.convenience_tags.push('Instant-Pot')
    }
    if (text.includes('no cook') || text.includes('no-cook') || text.includes('raw')) {
      suggestions.convenience_tags.push('No-Cook')
    }
    if (text.includes('make ahead') || text.includes('prep') || text.includes('meal prep')) {
      suggestions.convenience_tags.push('Make-Ahead')
    }
    if (text.includes('freezer') || text.includes('frozen')) {
      suggestions.convenience_tags.push('Freezer-Friendly')
    }
    if (text.includes('budget') || text.includes('cheap') || text.includes('affordable')) {
      suggestions.convenience_tags.push('Budget-Friendly')
    }

    // Dietary detection
    if (text.includes('vegetarian') || text.includes('veggie') || text.includes('vegan') || text.includes('plant-based')) {
      suggestions.dietary_tags.push('Vegetarian')
    }
    if (text.includes('vegan') || text.includes('plant-based') || text.includes('dairy-free')) {
      suggestions.dietary_tags.push('Vegan')
    }
    if (text.includes('gluten free') || text.includes('gluten-free') || text.includes('gluten free')) {
      suggestions.dietary_tags.push('Gluten-Free')
    }
    if (text.includes('dairy free') || text.includes('dairy-free') || text.includes('lactose free')) {
      suggestions.dietary_tags.push('Dairy-Free')
    }
    if (text.includes('low carb') || text.includes('keto') || text.includes('carb-free')) {
      suggestions.dietary_tags.push('Low-Carb')
    }
    if (text.includes('high protein') || text.includes('protein-rich')) {
      suggestions.dietary_tags.push('High-Protein')
    }
    if (text.includes('healthy') || text.includes('light') || text.includes('low calorie')) {
      suggestions.dietary_tags.push('Healthy')
    }
    if (text.includes('spicy') || text.includes('hot') || text.includes('chili') || text.includes('pepper')) {
      suggestions.dietary_tags.push('Spicy')
    }
    if (text.includes('kid') || text.includes('child') || text.includes('family-friendly')) {
      suggestions.dietary_tags.push('Kid-Friendly')
    }

    return suggestions
  }

  /**
   * Check rate limiting
   * @returns {boolean} True if request is allowed
   */
  checkRateLimit() {
    const now = Date.now()
    
    // Reset window if needed
    if (now - this.rateLimit.windowStart > this.rateLimit.windowMs) {
      this.rateLimit.requests = 0
      this.rateLimit.windowStart = now
    }

    // Check if limit exceeded
    if (this.rateLimit.requests >= this.rateLimit.maxRequests) {
      return false
    }

    // Increment counter
    this.rateLimit.requests++
    return true
  }

  /**
   * Generate cache key for recipe
   * @param {Object} recipe - Recipe object
   * @returns {string} Cache key
   */
  getCacheKey(recipe) {
    const key = `${recipe.name}-${recipe.ingredients?.length || 0}-${recipe.prep_time || 0}-${recipe.cook_time || 0}`
    return btoa(key).replace(/[^a-zA-Z0-9]/g, '')
  }

  /**
   * Get cached result
   * @param {string} key - Cache key
   * @returns {Object|null} Cached data or null
   */
  getFromCache(key) {
    const cached = this.cache.get(key)
    if (!cached) return null

    // Check if expired
    if (Date.now() - cached.timestamp > this.cacheTimeout) {
      this.cache.delete(key)
      return null
    }

    return cached.data
  }

  /**
   * Set cache entry
   * @param {string} key - Cache key
   * @param {Object} data - Data to cache
   */
  setCache(key, data) {
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    })

    // Clean up old entries
    if (this.cache.size > 100) {
      const entries = Array.from(this.cache.entries())
      entries.sort((a, b) => a[1].timestamp - b[1].timestamp)
      
      // Remove oldest 20 entries
      for (let i = 0; i < 20; i++) {
        this.cache.delete(entries[i][0])
      }
    }
  }

  /**
   * Clear cache
   */
  clearCache() {
    this.cache.clear()
  }

  /**
   * Get cache statistics
   * @returns {Object} Cache stats
   */
  getCacheStats() {
    return {
      size: this.cache.size,
      maxSize: 100,
      timeout: this.cacheTimeout
    }
  }

  /**
   * Get rate limit status
   * @returns {Object} Rate limit status
   */
  getRateLimitStatus() {
    const now = Date.now()
    const timeRemaining = Math.max(0, this.rateLimit.windowMs - (now - this.rateLimit.windowStart))
    
    return {
      requests: this.rateLimit.requests,
      maxRequests: this.rateLimit.maxRequests,
      timeRemaining,
      canMakeRequest: this.checkRateLimit()
    }
  }
}

export const recipeTagSuggestionService = new RecipeTagSuggestionService()
