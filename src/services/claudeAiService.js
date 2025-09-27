import { mealHistoryService } from '../database/mealHistoryService.js'
import { recipeService } from '../database/recipeService.js'

class ClaudeAiService {
  constructor() {
    this.apiKey = import.meta.env.VITE_CLAUDE_API_KEY
    const apiBase = import.meta.env.VITE_API_BASE || 'http://localhost:3001'
    this.apiUrl = `${apiBase}/api/claude`
    this.model = 'claude-3-5-sonnet-20241022'
    this.maxTokens = 1024
    this.cache = new Map() // Simple in-memory cache
    this.cacheTimeout = 5 * 60 * 1000 // 5 minutes
    this.requestTimeout = 10000 // Reduced to 10 second timeout for faster failures
    this.concurrentRequestLimit = 3 // Limit concurrent requests to avoid rate limiting
    
    // Log configuration status for debugging
    console.log('🔧 Claude AI Service Configuration:', {
      hasApiKey: !!this.apiKey,
      apiUrl: this.apiUrl,
      isDev: import.meta.env.DEV,
      cacheTimeout: this.cacheTimeout,
      requestTimeout: this.requestTimeout,
      concurrentRequestLimit: this.concurrentRequestLimit
    })
  }

  // Check if the service is properly configured
  isConfigured() {
    return !!this.apiKey
  }

  // Generate cache key for request
  generateCacheKey(userNotes, toggles, validRecipes) {
    const recipeIds = validRecipes.slice(0, 10).map(r => r.id).sort().join(',')
    const togglesStr = JSON.stringify(toggles)
    return `${userNotes}-${togglesStr}-${recipeIds}`
  }

  // Get cached result if available and not expired
  getCachedResult(cacheKey) {
    const cached = this.cache.get(cacheKey)
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      console.log('⚡ Using cached AI suggestions')
      return cached.data
    }
    return null
  }

  // Store result in cache
  setCachedResult(cacheKey, data) {
    this.cache.set(cacheKey, {
      data,
      timestamp: Date.now()
    })
    // Clean old entries if cache gets too large
    if (this.cache.size > 50) {
      const oldest = Array.from(this.cache.entries())
        .sort((a, b) => a[1].timestamp - b[1].timestamp)[0]
      this.cache.delete(oldest[0])
    }
  }

  // Create timeout promise for fetch requests
  createTimeoutPromise(timeoutMs) {
    return new Promise((_, reject) => {
      setTimeout(() => reject(new Error(`Request timeout after ${timeoutMs}ms`)), timeoutMs)
    })
  }

  // Smart recipe selection for better variety (removed dietary restrictions)
  selectRecipesForAI(allRecipes, regularMeals, lessRegularMeals, recentMealIds, maxRecipes = 15) {
    console.log(`🎯 Smart recipe selection from ${allRecipes.length} total recipes`)
    
    // Filter out recently eaten meals from regular and less regular
    const availableRegular = regularMeals.filter(recipe => !recentMealIds.includes(recipe.id))
    const availableLessRegular = lessRegularMeals.filter(recipe => !recentMealIds.includes(recipe.id))
    const availableOthers = allRecipes.filter(recipe => 
      !regularMeals.find(r => r.id === recipe.id) && 
      !lessRegularMeals.find(r => r.id === recipe.id) &&
      !recentMealIds.includes(recipe.id)
    )
    
    // Smart mix: regular favorites + less regular + random others
    const targetRegular = Math.min(5, availableRegular.length) // Up to 5 regular favorites
    const targetLessRegular = Math.min(5, availableLessRegular.length) // Up to 5 less regular
    const targetOthers = Math.max(0, maxRecipes - targetRegular - targetLessRegular) // Fill remainder
    
    // Randomize each category for variety
    const selectedRegular = availableRegular
      .sort(() => 0.5 - Math.random())
      .slice(0, targetRegular)
    
    const selectedLessRegular = availableLessRegular
      .sort(() => 0.5 - Math.random())
      .slice(0, targetLessRegular)
    
    const selectedOthers = availableOthers
      .sort(() => 0.5 - Math.random())
      .slice(0, targetOthers)
    
    const finalSelection = [...selectedRegular, ...selectedLessRegular, ...selectedOthers]
    
    console.log(`✅ Selected ${finalSelection.length} recipes:`, {
      regular: selectedRegular.length,
      lessRegular: selectedLessRegular.length,
      others: selectedOthers.length,
      recipeNames: finalSelection.map(r => r.name)
    })
    
    return finalSelection
  }

  // Create optimized prompt for Claude API (with smart recipe selection)
  createMealSuggestionPrompt(recipes, regularMeals, lessRegularMeals, recentMealIds, userNotes, toggles = {}) {
    // Smart recipe selection: increased variety with balanced performance
    const maxRecipes = 15 // Increased from 8 for better variety
    const selectedRecipes = this.selectRecipesForAI(recipes, regularMeals, lessRegularMeals, recentMealIds, maxRecipes)
    const recipeNames = selectedRecipes.map(r => r.name)
    
    const recentNames = recipes
      .filter(r => recentMealIds.includes(r.id))
      .map(r => r.name)
      .slice(0, 3) // Limit to 3 recent meals max

    // Simplified preferences (reduce token count)
    const prefs = []
    if (toggles.healthy) prefs.push('healthy')
    if (toggles.easy) prefs.push('quick')
    if (toggles.spiceItUp) prefs.push('bold')
    
    const prefText = prefs.length ? ` Prefer: ${prefs.join(', ')}.` : ''
    const notesText = userNotes ? ` User notes: ${userNotes.slice(0, 150)}.` : '' // Increased limit for combined notes
    const randomSeed = Math.floor(Math.random() * 1000) // Add randomness for fresh suggestions

    // Optimized prompt with clear meal count requirements and randomness
    return `Create 3 diverse meal plans from: ${recipeNames.join(', ')}.
Avoid: ${recentNames.join(', ') || 'none'}.${prefText}${notesText}
Random seed: ${randomSeed}. Generate creative, varied combinations each time.

IMPORTANT: Each meal plan must have exactly 4 meals.

JSON format:
{
  "suggestions": [
    {
      "set_number": 1,
      "explanation": "brief theme",
      "meals": [
        {"recipe_name": "exact name", "reason": "brief"},
        {"recipe_name": "exact name", "reason": "brief"},
        {"recipe_name": "exact name", "reason": "brief"},
        {"recipe_name": "exact name", "reason": "brief"}
      ]
    }
  ]
}

Return 3 plans with 4 meals each.`
  }

  // Parse Claude's response and match with actual recipes
  async parseMealSuggestions(response, allRecipes) {
    try {
      let jsonData

      // Try to extract JSON from response
      if (typeof response === 'string') {
        console.log('🔍 Raw Claude response length:', response.length)
        console.log('🔍 Raw Claude response (first 500 chars):', response.substring(0, 500))
        console.log('🔍 Raw Claude response (last 200 chars):', response.substring(Math.max(0, response.length - 200)))
        
        // Find the complete JSON by matching braces properly
        let jsonString = ''
        let startIndex = response.indexOf('{')
        
        if (startIndex !== -1) {
          let braceCount = 0
          let inString = false
          let escapeNext = false
          
          for (let i = startIndex; i < response.length; i++) {
            const char = response[i]
            jsonString += char
            
            if (escapeNext) {
              escapeNext = false
              continue
            }
            
            if (char === '\\') {
              escapeNext = true
              continue
            }
            
            if (char === '"') {
              inString = !inString
              continue
            }
            
            if (!inString) {
              if (char === '{') {
                braceCount++
              } else if (char === '}') {
                braceCount--
                if (braceCount === 0) {
                  break // Found complete JSON
                }
              }
            }
          }
          
          console.log('🔍 Extracted complete JSON length:', jsonString.length)
          console.log('🔍 Extracted JSON (first 500 chars):', jsonString.substring(0, 500))
          console.log('🔍 Extracted JSON (last 200 chars):', jsonString.substring(Math.max(0, jsonString.length - 200)))
          
          try {
            jsonData = JSON.parse(jsonString)
            console.log('✅ Successfully parsed complete JSON')
          } catch (parseError) {
            console.error('❌ JSON Parse Error:', parseError)
            
            // Try to fix common JSON issues
            let fixedJson = jsonString
              .replace(/,\s*}/g, '}')  // Remove trailing commas in objects
              .replace(/,\s*]/g, ']')  // Remove trailing commas in arrays
              .replace(/\n/g, ' ')     // Remove newlines that might break JSON
              .replace(/\r/g, '')      // Remove carriage returns
            
            try {
              jsonData = JSON.parse(fixedJson)
              console.log('✅ Fixed JSON successfully')
            } catch (fixError) {
              console.error('❌ Even fixed JSON failed:', fixError)
              console.log('🔍 Final JSON attempt (last 500 chars):', fixedJson.substring(Math.max(0, fixedJson.length - 500)))
              
              // If we have an unterminated string, try to repair it
              if (fixError.message.includes('Unterminated string')) {
                console.log('🔧 Attempting to repair unterminated string...')
                let repairedJson = fixedJson
                
                // More aggressive repair: find where the JSON structure breaks
                const errorPos = parseInt(fixError.message.match(/position (\d+)/)?.[1] || '0')
                console.log('🔍 Error position:', errorPos)
                
                // Truncate at the error position and try to close structures
                if (errorPos > 0 && errorPos < repairedJson.length) {
                  // Find the last complete key-value pair before the error
                  let truncatePoint = errorPos
                  
                  // Look backwards for the last complete field
                  for (let i = errorPos - 1; i >= 0; i--) {
                    if (repairedJson[i] === ',' || repairedJson[i] === '{' || repairedJson[i] === '[') {
                      truncatePoint = i
                      if (repairedJson[i] === ',') {
                        truncatePoint = i // Include the comma
                      }
                      break
                    }
                  }
                  
                  repairedJson = repairedJson.substring(0, truncatePoint)
                  console.log('🔧 Truncated JSON at position:', truncatePoint)
                  
                  // Remove trailing comma if present
                  repairedJson = repairedJson.replace(/,\s*$/, '')
                  
                  // Close any open objects/arrays
                  let openBraces = (repairedJson.match(/\{/g) || []).length - (repairedJson.match(/\}/g) || []).length
                  let openBrackets = (repairedJson.match(/\[/g) || []).length - (repairedJson.match(/\]/g) || []).length
                  
                  console.log('🔧 Need to close:', { openBrackets, openBraces })
                  
                  // Close any unclosed structures
                  for (let i = 0; i < openBrackets; i++) {
                    repairedJson += ']'
                  }
                  for (let i = 0; i < openBraces; i++) {
                    repairedJson += '}'
                  }
                  
                  console.log('🔧 Repaired JSON (last 200 chars):', repairedJson.substring(Math.max(0, repairedJson.length - 200)))
                  
                  try {
                    jsonData = JSON.parse(repairedJson)
                    console.log('✅ Successfully repaired truncated JSON!')
                  } catch (repairError) {
                    console.error('❌ Repair attempt failed:', repairError)
                    throw new Error(`Failed to parse JSON even after repair attempts: ${fixError.message}`)
                  }
                } else {
                  throw new Error(`Failed to parse JSON even after fixes: ${fixError.message}`)
                }
              } else {
                throw new Error(`Failed to parse JSON even after fixes: ${fixError.message}`)
              }
            }
          }
        } else {
          throw new Error('No JSON found in response')
        }
      } else {
        jsonData = response
      }

      const suggestions = []

      for (const suggestion of jsonData.suggestions || []) {
        const meals = []

        for (const meal of suggestion.meals || []) {
          console.log(`🔍 Looking for recipe: "${meal.recipe_name}"`)
          
          // Find matching recipe by name (case-insensitive, exact match first)
          let recipe = allRecipes.find(r =>
            r.name.toLowerCase() === meal.recipe_name.toLowerCase()
          )

          // If no exact match, try fuzzy matching (contains)
          if (!recipe) {
            recipe = allRecipes.find(r =>
              r.name.toLowerCase().includes(meal.recipe_name.toLowerCase()) ||
              meal.recipe_name.toLowerCase().includes(r.name.toLowerCase())
            )
            if (recipe) {
              console.log(`🎯 Fuzzy match found: "${meal.recipe_name}" → "${recipe.name}"`)
            }
          }

          if (recipe) {
            meals.push({
              recipe: {
                ...recipe,
                cuisine_tags: Array.isArray(meal.cuisine_tags) ? meal.cuisine_tags : (recipe.cuisine_tags || []),
                ingredient_tags: Array.isArray(meal.ingredient_tags) ? meal.ingredient_tags : (recipe.ingredient_tags || []),
                convenience_tags: Array.isArray(meal.convenience_tags) ? meal.convenience_tags : (recipe.convenience_tags || [])
              },
              reason: meal.reason
            })
            console.log(`✅ Added meal: "${recipe.name}"`)
          } else {
            console.warn(`❌ No recipe found for: "${meal.recipe_name}"`)
            console.log('Available recipes:', allRecipes.map(r => r.name))
          }
        }

        console.log(`📊 Plan ${suggestion.set_number}: Found ${meals.length}/${suggestion.meals?.length || 0} meals`)
        
        if (meals.length > 0) {
          suggestions.push({
            set_number: suggestion.set_number,
            meals,
            explanation: suggestion.explanation
          })
        } else {
          console.warn(`⚠️ Skipping plan ${suggestion.set_number} - no matching meals found`)
        }
      }

      return suggestions
    } catch (error) {
      console.error('Failed to parse Claude response:', error)
      throw new Error('Invalid response format from Claude API')
    }
  }

  // Main function to generate meal suggestions using Claude API
  async generateMealSuggestions(userNotes = '', toggles = {}) {
    const startTime = performance.now()
    console.log('🚀 Starting generateMealSuggestions with:', { userNotes, toggles })
    
    try {
      if (!this.isConfigured()) {
        console.error('❌ Claude API not configured:', {
          hasApiKey: !!this.apiKey,
          envVar: import.meta.env.VITE_CLAUDE_API_KEY ? 'Set' : 'Not set',
          isDev: import.meta.env.DEV
        })
        throw new Error('Claude API key not configured. Please set VITE_CLAUDE_API_KEY environment variable.')
      }

      // Get data needed for suggestions
      const dataStartTime = performance.now()
      const { regular, lessRegular } = await mealHistoryService.categorizeRecipesByFrequency()
      const recentMealIds = await mealHistoryService.getRecentMeals(2) // Last 2 weeks
      const allRecipes = await recipeService.getAll()
      const dataEndTime = performance.now()
      console.log(`⏱️ Data loading took: ${(dataEndTime - dataStartTime).toFixed(2)}ms`)

      // No dietary filtering - user only adds recipes they care about
      const filterStartTime = performance.now()
      const validRecipes = allRecipes // Use all recipes (no dietary restrictions)
      const validRegular = regular // Use all regular meals
      const validLessRegular = lessRegular // Use all less regular meals
      const filterEndTime = performance.now()
      console.log(`⏱️ Recipe processing took: ${(filterEndTime - filterStartTime).toFixed(2)}ms (no filtering needed)`)

      if (validRecipes.length === 0) {
        throw new Error('No recipes available in database')
      }

      // Check cache first
      const cacheKey = this.generateCacheKey(userNotes, toggles, validRecipes)
      const cachedResult = this.getCachedResult(cacheKey)
      if (cachedResult) {
        const totalTime = performance.now() - startTime
        console.log(`⏱️ Total AI suggestion process took: ${totalTime.toFixed(2)}ms (cached)`)
        
        // SigNoz-style performance metrics for cache hit
        console.log('📊 Performance Metrics:', {
          totalTime: `${totalTime.toFixed(2)}ms`,
          cacheHit: true,
          speedImprovement: '99.9%'
        })
        return {
          success: true,
          data: cachedResult,
          metadata: {
            provider: 'Claude API (Cached)',
            totalRecipes: validRecipes.length,
            regularRecipes: validRegular.length,
            lessRegularRecipes: validLessRegular.length,
            performanceMs: totalTime,
            cached: true
          }
        }
      }

      // Clear cache for fresh suggestions each time
      this.cache.clear()
      
      // Create prompt for Claude
      const promptStartTime = performance.now()
      const prompt = this.createMealSuggestionPrompt(
        validRecipes,
        validRegular,
        validLessRegular,
        recentMealIds,
        userNotes,
        toggles
      )
      const promptEndTime = performance.now()
      console.log(`⏱️ Prompt creation took: ${(promptEndTime - promptStartTime).toFixed(2)}ms`)

      // Call Claude API with timeout
      const apiStartTime = performance.now()
      const fetchPromise = fetch(this.apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          prompt: prompt,
          userNotes: userNotes,
          max_tokens: 1200, // Further reduced for speed
          stream: false // Keep false for now, but we can enable streaming later
        })
      })

      const response = await Promise.race([
        fetchPromise,
        this.createTimeoutPromise(this.requestTimeout)
      ])

      if (!response.ok) {
        const errorData = await response.text()
        throw new Error(`Claude API error: ${response.status} - ${errorData}`)
      }

      const data = await response.json()
      const apiEndTime = performance.now()
      console.log(`⏱️ Claude API call took: ${(apiEndTime - apiStartTime).toFixed(2)}ms`)

      const content = data.content?.[0]?.text

      if (!content) {
        throw new Error('No content received from Claude API')
      }

      // Parse the response and match with recipes
      const parseStartTime = performance.now()
      let suggestions
      try {
        suggestions = await this.parseMealSuggestions(content, validRecipes)
        const parseEndTime = performance.now()
        console.log(`⏱️ Response parsing took: ${(parseEndTime - parseStartTime).toFixed(2)}ms`)
        
        // Cache successful result
        this.setCachedResult(cacheKey, suggestions)
        
        const totalTime = performance.now() - startTime
        console.log(`⏱️ Total AI suggestion process took: ${totalTime.toFixed(2)}ms`)
        
        // SigNoz-style performance metrics
        console.log('📊 Performance Metrics:', {
          totalTime: `${totalTime.toFixed(2)}ms`,
          cacheHit: false,
          tokensSaved: `~${(30 - 8) * 50}` // Estimated tokens saved by optimization
        })
        
        console.log('✅ AI suggestions generated:', suggestions)
        return {
          success: true,
          data: suggestions,
          metadata: {
            provider: 'Claude API',
            totalRecipes: validRecipes.length,
            regularRecipes: validRegular.length,
            lessRegularRecipes: validLessRegular.length,
            performanceMs: totalTime
          }
        }
      } catch (parseError) {
        console.error('❌ Failed to parse Claude response, trying fallback...', parseError)
        
        // If JSON parsing fails with toggles, try without them
        if (Object.keys(toggles).length > 0) {
          console.log('🔄 Retrying without toggles due to parse error...')
          return await this.generateMealSuggestions(userNotes, {})
        }
        
        // If we're still failing, try a much simpler request
        console.log('🔄 Trying simplified request due to persistent parse errors...')
        try {
          const simplePrompt = `Create 3 meal plans from this recipe list. Each plan must have exactly 4 meals. Respond with ONLY valid JSON in this exact format:
{
  "suggestions": [
    {
      "set_number": 1,
      "explanation": "Balanced mix of proteins and vegetables",
      "meals": [
        {"recipe_name": "Recipe Name 1"},
        {"recipe_name": "Recipe Name 2"},
        {"recipe_name": "Recipe Name 3"},
        {"recipe_name": "Recipe Name 4"}
      ]
    },
    {
      "set_number": 2,
      "explanation": "Quick and easy meals",
      "meals": [
        {"recipe_name": "Recipe Name 5"},
        {"recipe_name": "Recipe Name 6"},
        {"recipe_name": "Recipe Name 7"},
        {"recipe_name": "Recipe Name 8"}
      ]
    },
    {
      "set_number": 3,
      "explanation": "International flavors",
      "meals": [
        {"recipe_name": "Recipe Name 9"},
        {"recipe_name": "Recipe Name 10"},
        {"recipe_name": "Recipe Name 11"},
        {"recipe_name": "Recipe Name 12"}
      ]
    }
  ]
}

Available recipes: ${validRecipes.slice(0, 50).map(r => r.name).join(', ')}`

          const simpleResponse = await fetch(this.apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              prompt: simplePrompt,
              userNotes: ''
            })
          })

          const simpleData = await simpleResponse.json()
          if (simpleData.error) {
            throw new Error(simpleData.error)
          }

          const simpleContent = simpleData.content?.[0]?.text
          if (!simpleContent) {
            throw new Error('No content received from simplified Claude API request')
          }

          console.log('📋 Simplified response content (first 300 chars):', simpleContent.substring(0, 300))
          const simpleSuggestions = await this.parseMealSuggestions(simpleContent, validRecipes)
          console.log('✅ Simplified request succeeded, suggestions:', simpleSuggestions)
          return {
            success: true,
            data: simpleSuggestions,
            metadata: {
              provider: 'Claude API (Simplified)',
              totalRecipes: validRecipes.length
            }
          }
        } catch (simpleError) {
          console.error('❌ Even simplified request failed:', simpleError)
          throw parseError
        }
      }

      if (suggestions.length === 0) {
        throw new Error('Claude did not generate any valid suggestions')
      }

      return {
        success: true,
        data: suggestions,
        metadata: {
          totalRegular: validRegular.length,
          totalLessRegular: validLessRegular.length,
          recentMealsAvoided: recentMealIds.length,
          userNotes: userNotes || 'No specific preferences',
          provider: 'Claude API'
        }
      }

    } catch (error) {
      console.error('Claude AI service error:', error)
      console.log('🔄 Generating fallback suggestions...')
      const fallbackSuggestions = await this.getFallbackSuggestions()
      console.log('🎲 Fallback suggestions generated:', fallbackSuggestions.length, 'sets')
      
      return {
        success: false,
        error: error.message,
        fallback: fallbackSuggestions
      }
    }
  }

  // Fallback suggestions when Claude API fails
  async getFallbackSuggestions() {
    try {
      console.log('🎲 Generating fallback suggestions...')
      const allRecipes = await recipeService.getAll()
      console.log(`📋 Found ${allRecipes.length} total recipes`)
      
      const validRecipes = allRecipes // Use all recipes (no dietary restrictions)
      console.log(`✅ Found ${validRecipes.length} valid recipes`)

      if (validRecipes.length === 0) {
        console.log('❌ No valid recipes available for fallback')
        return []
      }

      // Simple fallback: pick 4 random valid recipes
      const shuffled = validRecipes.sort(() => 0.5 - Math.random())
      const selected = shuffled.slice(0, Math.min(4, shuffled.length))
      console.log(`🎯 Selected ${selected.length} recipes for fallback:`, selected.map(r => r.name))

      const fallbackSuggestions = [{
        set_number: 1,
        meals: selected.map(recipe => ({
          recipe,
          reason: "A good option that meets your dietary requirements (fallback)"
        })),
        explanation: "Simple selection of recipes that fit your dietary preferences. (Generated as fallback when AI is unavailable)"
      }]
      
      console.log('✅ Fallback suggestions created successfully:', fallbackSuggestions)
      return fallbackSuggestions
    } catch (error) {
      console.error('❌ Fallback suggestions failed:', error)
      return []
    }
  }

  // Test the service
  async testService() {
    console.log('🧪 Testing Claude AI Service...')

    if (!this.isConfigured()) {
      console.log('❌ Claude API key not configured')
      return null
    }

    try {
      const result = await this.generateMealSuggestions('test preferences')
      if (result.success) {
        console.log(`✅ Claude API working - generated ${result.data.length} suggestion sets`)
        return result
      } else {
        console.log(`❌ Claude API failed: ${result.error}`)
        return result
      }
    } catch (error) {
      console.error('❌ Test failed:', error)
      return null
    }
  }
}

// Export singleton instance
export const claudeAiService = new ClaudeAiService()