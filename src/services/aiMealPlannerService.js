import { mealHistoryService } from '../database/mealHistoryService.js'
import { recipeService } from '../database/recipeService.js'
import { XSSPrevention } from '../utils/security.js'

class AiMealPlannerService {
  constructor() {
    // Reuse existing Claude configuration
    this.apiKey = import.meta.env.VITE_CLAUDE_API_KEY
    
    // Auto-detect production environment and set appropriate API URL
    const isProduction = import.meta.env.PROD && !window.location.hostname.includes('localhost')
    const customApiBase = import.meta.env.VITE_API_BASE
    
    if (customApiBase) {
      this.apiUrl = `${customApiBase}/api/claude`
    } else if (isProduction) {
      // Default to Netlify Functions in production
      const netlifyUrl = window.location.origin + '/.netlify/functions/claude'
      this.apiUrl = netlifyUrl
    } else {
      // Development fallback
      this.apiUrl = 'http://localhost:3002/api/claude'
    }
    
    this.model = 'claude-3-5-sonnet-20241022'
    this.maxTokens = 1200
    this.requestTimeout = 10000
    this.concurrentRequestLimit = 3
    
    // Log configuration status for debugging
    console.log('🔧 AI Meal Planner Service Configuration:', {
      hasApiKey: !!this.apiKey,
      apiUrl: this.apiUrl,
      isDev: import.meta.env.DEV,
      isProd: import.meta.env.PROD,
      isProduction: isProduction,
      hostname: window.location.hostname,
      customApiBase,
      requestTimeout: this.requestTimeout,
      concurrentRequestLimit: this.concurrentRequestLimit
    })
  }

  // Check if the service is properly configured
  isConfigured() {
    return !!this.apiKey
  }

  // Create timeout promise for fetch requests
  createTimeoutPromise(timeoutMs) {
    return new Promise((_, reject) => {
      setTimeout(() => reject(new Error(`Request timeout after ${timeoutMs}ms`)), timeoutMs)
    })
  }

  /**
   * Generates 8 meal suggestions with frequency-based selection
   * @param {string} userPrompt - Optional user preferences/ingredients
   * @param {Object} quickPreferences - Selected quick filters
   * @param {AbortSignal} signal - Abort signal for request cancellation
   * @returns {Promise<{success: boolean, data: {overview: string, meals: Recipe[]}, error: string|null, fallback: Recipe[]}>}
   */
  async generateEightMealSuggestions(userPrompt = '', quickPreferences = {}, signal = null) {
    try {
      // Sanitize input
      const sanitizedPrompt = XSSPrevention.sanitizeInput(userPrompt, false)
      
      // Limit prompt length to prevent token overflow
      const maxPromptLength = 500
      const truncatedPrompt = sanitizedPrompt.length > maxPromptLength 
        ? sanitizedPrompt.substring(0, maxPromptLength) + '...'
        : sanitizedPrompt
      
      // Get meal frequencies
      const frequencies = await this.getMealFrequencies()
      
      // Get all recipes with frequency data
      const allRecipes = await recipeService.getAll()
      const recipesWithFreq = allRecipes.map(r => ({
        ...r,
        frequency: frequencies[r.id] || 0
      }))
      
      // Build prompt
      const prompt = this.buildPrompt(truncatedPrompt, quickPreferences, recipesWithFreq)
      
      // Call API with timeout and abort signal
      const response = await Promise.race([
        fetch(this.apiUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ prompt, userNotes: truncatedPrompt, max_tokens: this.maxTokens }),
          signal
        }),
        this.createTimeoutPromise(this.requestTimeout)
      ])

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`)
      }

      const data = await response.json()
      const parsed = this.parseAiResponse(data, recipesWithFreq)
      
      return {
        success: true,
        data: parsed,
        error: null,
        fallback: []
      }
    } catch (error) {
      console.error('AI Meal Planner Error:', error)
      
      // Generate fallback suggestions
      const fallback = await this.getFallbackSuggestions(quickPreferences)
      
      return {
        success: false,
        data: null,
        error: error.message,
        fallback
      }
    }
  }

  buildPrompt(userPrompt, preferences, recipes) {
    // System prompt with clear instructions
    const systemPrompt = `You are a meal planning assistant. Select exactly 8 meals from the recipe list.

Selection criteria:
- 2 meals from most frequently eaten (favorites, high frequency count)
- 2 meals from least frequently eaten (variety, low frequency count)  
- 4 meals for variety and balance

Ensure variety across cuisines, cooking methods, and main ingredients.

Response format (valid JSON only):
{
  "overview": "One-sentence explanation of selection strategy",
  "meals": ["Recipe Name 1", "Recipe Name 2", ..., "Recipe Name 8"]
}`

    // User context
    let userContext = ''
    if (userPrompt) {
      userContext = `\nUser preferences: ${userPrompt}
- If specific ingredients mentioned, include at least 4 meals with those ingredients
- If cooking time mentioned, prioritize matching meals
- Respect dietary restrictions absolutely`
    }

    // Quick preferences
    let quickPrefsContext = ''
    if (preferences.cuisines?.length || preferences.tags?.length || preferences.dietary?.length) {
      quickPrefsContext = `\nQuick filters (additive - include meals matching ANY of these):
- Cuisines: ${preferences.cuisines.join(', ') || 'Any'}
- Tags: ${preferences.tags.join(', ') || 'Any'}  
- Dietary: ${preferences.dietary.join(', ') || 'None'}

Note: These are additive filters - select meals that match ANY of the specified cuisines, tags, or dietary requirements. This expands the selection pool rather than narrowing it.`
    }

    // Recipe list with frequencies
    const recipeList = recipes.map(r => ({
      name: r.name,
      frequency: r.frequency,
      cuisine: r.cuisine_tags || [],
      tags: [...(r.ingredient_tags || []), ...(r.convenience_tags || [])],
      ingredients: (r.ingredients || []).slice(0, 5) // First 5 for brevity
    }))

    return `${systemPrompt}${userContext}${quickPrefsContext}\n\nRecipe list:\n${JSON.stringify(recipeList, null, 2)}`
  }

  async getMealFrequencies() {
    const history = await mealHistoryService.getAll()
    const frequencies = {}
    history.forEach(entry => {
      frequencies[entry.recipe_id] = (frequencies[entry.recipe_id] || 0) + 1
    })
    return frequencies
  }

  async getFallbackSuggestions(preferences) {
    // Simple random selection if AI fails
    const allRecipes = await recipeService.getAll()
    let filtered = allRecipes
    
    // Apply additive preference filters (OR logic)
    if (preferences.cuisines?.length || preferences.tags?.length || preferences.dietary?.length) {
      filtered = filtered.filter(r => {
        // Check if recipe matches ANY of the selected preferences
        const matchesCuisine = preferences.cuisines?.length ? 
          r.cuisine_tags?.some(c => preferences.cuisines.includes(c)) : false
        
        const matchesTags = preferences.tags?.length ? 
          [...(r.ingredient_tags || []), ...(r.convenience_tags || [])].some(t => preferences.tags.includes(t)) : false
        
        const matchesDietary = preferences.dietary?.length ? 
          [...(r.ingredient_tags || []), ...(r.convenience_tags || [])].some(t => preferences.dietary.includes(t)) : false
        
        // Return true if it matches ANY category
        return matchesCuisine || matchesTags || matchesDietary
      })
    }
    
    // If no matches found with preferences, fall back to all recipes
    if (filtered.length === 0) {
      filtered = allRecipes
    }
    
    // Shuffle and take 8
    const shuffled = filtered.sort(() => Math.random() - 0.5)
    return {
      overview: `Selected ${Math.min(8, filtered.length)} meals based on your preferences (additive filtering)`,
      meals: shuffled.slice(0, 8)
    }
  }

  parseAiResponse(data, recipes) {
    const content = data.content?.[0]?.text
    const jsonMatch = content.match(/\{[\s\S]*\}/)
    
    if (!jsonMatch) {
      throw new Error('No JSON found in AI response')
    }
    
    const parsed = JSON.parse(jsonMatch[0])
    
    // Map recipe names to full recipe objects
    const meals = parsed.meals.map(name => {
      const recipe = recipes.find(r => r.name === name)
      return recipe || null
    }).filter(Boolean)
    
    return {
      overview: parsed.overview,
      meals: meals.slice(0, 8) // Ensure max 8
    }
  }

  // Test the service
  async testService() {
    console.log('🧪 Testing AI Meal Planner Service...')

    if (!this.isConfigured()) {
      console.log('❌ Claude API key not configured')
      return null
    }

    try {
      const result = await this.generateEightMealSuggestions('test preferences')
      if (result.success) {
        console.log(`✅ AI Meal Planner working - generated ${result.data.meals.length} suggestions`)
        return result
      } else {
        console.log(`❌ AI Meal Planner failed: ${result.error}`)
        return result
      }
    } catch (error) {
      console.error('❌ Test failed:', error)
      return null
    }
  }
}

// Export singleton instance
export const aiMealPlannerService = new AiMealPlannerService()
