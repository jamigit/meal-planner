import { mealHistoryService } from '../database/mealHistoryService.js'
import { recipeService } from '../database/recipeService.js'

class ClaudeAiService {
  constructor() {
    this.apiKey = import.meta.env.VITE_CLAUDE_API_KEY
    const apiBase = import.meta.env.VITE_API_BASE || 'http://localhost:3002'
    this.apiUrl = `${apiBase}/api/claude`
    this.model = 'claude-3-5-sonnet-20241022'
    this.maxTokens = 1024
    
    // Log configuration status for debugging
    console.log('🔧 Claude AI Service Configuration:', {
      hasApiKey: !!this.apiKey,
      apiUrl: this.apiUrl,
      isDev: import.meta.env.DEV
    })
  }

  // Check if the service is properly configured
  isConfigured() {
    return !!this.apiKey
  }

  // Helper to filter recipes by dietary restrictions
  filterByDietaryRestrictions(recipes) {
    return recipes.filter(recipe => {
      const tags = recipe.tags?.map(tag => tag.toLowerCase()) || []

      // Must be gluten-free compatible (no explicit gluten tags)
      const hasGluten = tags.some(tag =>
        tag.includes('gluten') && !tag.includes('free')
      )

      // Must not contain red meat or pork
      const hasRedMeatOrPork = tags.some(tag =>
        tag.includes('beef') ||
        tag.includes('pork') ||
        tag.includes('lamb') ||
        tag.includes('steak')
      )

      return !hasGluten && !hasRedMeatOrPork
    })
  }

  // Create the prompt for Claude API (now requests categorized tags)
  createMealSuggestionPrompt(recipes, regularMeals, lessRegularMeals, recentMealIds, userNotes, toggles = {}) {
    const recentMealNames = recipes
      .filter(r => recentMealIds.includes(r.id))
      .map(r => r.name)

    // Build toggle-specific instructions
    const toggleInstructions = []
    const numSuggestions = toggles.more ? 5 : 3
    
    if (toggles.healthy) {
      toggleInstructions.push("- HEALTHY MODE: Prioritize recipes with 'Gluten-Free', 'Low-Carb', 'Vegetarian' tags, and avoid heavy/rich meals")
    }
    if (toggles.easy) {
      toggleInstructions.push("- EASY MODE: Only select recipes tagged as 'Quick', 'Beginner', 'Short-Prep', 'One-Pot', or 'No-Cook'")
    }
    if (toggles.spiceItUp) {
      toggleInstructions.push("- SPICE IT UP MODE: Focus on less regular meals and try to include more diverse cuisines and unique recipes")
    }

    return `You are a meal planning assistant. Generate ${numSuggestions} different weekly meal suggestion sets based on the user's meal history and preferences.

**User's Recipe Collection:**
${recipes.map(r => `- ${r.name} (tags: ${r.tags?.join(', ') || 'none'})`).join('\n')}

**Meal Frequency Analysis (last 8 weeks):**
- Regular meals (eaten 3+ times): ${regularMeals.map(r => `${r.name} (${r.frequency}x)`).join(', ') || 'none'}
- Less regular meals (eaten 0-2 times): ${lessRegularMeals.map(r => `${r.name} (${r.frequency || 0}x)`).join(', ') || 'none'}
- Recently eaten (last 2 weeks - AVOID): ${recentMealNames.join(', ') || 'none'}

**Dietary Restrictions:**
- Must be gluten-free compatible
- No red meat or pork (chicken, fish, turkey, vegetarian OK)

**User Preferences for This Week:**
"${userNotes || 'No specific preferences'}"

**Customization Options:**
${toggleInstructions.length > 0 ? toggleInstructions.join('\n') : '- No specific customization options selected'}

**Requirements:**
1. Generate exactly ${numSuggestions} different suggestion sets
2. Each set should have exactly 4 meals
3. Each set should have 2 regular meals + 2 less regular meals (adjust if not enough available)
4. Avoid meals eaten in the last 2 weeks
5. Consider user preferences when selecting meals
6. Follow customization options if specified
7. Provide reasoning for each meal selection

**Allowed Tag Vocabularies:**
- cuisine_tags: Italian, Thai, Mexican, Indian, Japanese, Chinese, Greek, Mediterranean, French, Middle Eastern, Korean, Vietnamese, American
- ingredient_tags: Chicken, Fish, Beef, Pork, Turkey, Vegetables, Tofu, Legumes, Pasta, Rice, Eggs
- convenience_tags: Quick, Beginner, One-Pot, No-Cook, Make-Ahead, Air-Fryer, Sheet-Pan, Slow-Cooker, Gluten-Free

Only use tags from these lists; if none fit, return an empty array.

**Response Format (JSON):**
{
  "suggestions": [
    {
      "set_number": 1,
      "explanation": "Overall explanation for this set's theme/approach",
      "meals": [
        {
          "recipe_name": "exact recipe name from collection",
          "reason": "why this meal was selected",
          "cuisine_tags": ["Italian"],
          "ingredient_tags": ["Chicken"],
          "convenience_tags": ["Quick"]
        }
      ]
    }
  ]
}

Generate diverse, personalized meal suggestions that balance the user's favorites with variety!`
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
          // Find matching recipe by name (case-insensitive)
          const recipe = allRecipes.find(r =>
            r.name.toLowerCase() === meal.recipe_name.toLowerCase()
          )

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
          }
        }

        if (meals.length > 0) {
          suggestions.push({
            set_number: suggestion.set_number,
            meals,
            explanation: suggestion.explanation
          })
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
      const { regular, lessRegular } = await mealHistoryService.categorizeRecipesByFrequency()
      const recentMealIds = await mealHistoryService.getRecentMeals(2) // Last 2 weeks
      const allRecipes = await recipeService.getAll()

      // Filter by dietary restrictions
      const validRecipes = this.filterByDietaryRestrictions(allRecipes)
      const validRegular = this.filterByDietaryRestrictions(regular)
        .filter(recipe => !recentMealIds.includes(recipe.id))
      const validLessRegular = this.filterByDietaryRestrictions(lessRegular)
        .filter(recipe => !recentMealIds.includes(recipe.id))

      if (validRecipes.length === 0) {
        throw new Error('No recipes available that meet dietary restrictions')
      }

      // Create prompt for Claude
      const prompt = this.createMealSuggestionPrompt(
        validRecipes,
        validRegular,
        validLessRegular,
        recentMealIds,
        userNotes,
        toggles
      )

      // Call Claude API via Netlify function
      const response = await fetch(this.apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          prompt: prompt,
          userNotes: userNotes,
          max_tokens: 2000 // Limit response size to prevent truncation
        })
      })

      if (!response.ok) {
        const errorData = await response.text()
        throw new Error(`Claude API error: ${response.status} - ${errorData}`)
      }

      const data = await response.json()
      const content = data.content?.[0]?.text

      if (!content) {
        throw new Error('No content received from Claude API')
      }

      // Parse the response and match with recipes
      let suggestions
      try {
        suggestions = await this.parseMealSuggestions(content, validRecipes)
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
          const simplePrompt = `Please suggest 3 different meal plan options from this recipe list. Each plan should have 3-4 meals. Respond with ONLY valid JSON in this exact format:
{
  "suggestions": [
    {
      "set_number": 1,
      "explanation": "Balanced mix of proteins and vegetables",
      "meals": [
        {"recipe_name": "Recipe Name 1"},
        {"recipe_name": "Recipe Name 2"},
        {"recipe_name": "Recipe Name 3"}
      ]
    },
    {
      "set_number": 2,
      "explanation": "Quick and easy meals",
      "meals": [
        {"recipe_name": "Recipe Name 4"},
        {"recipe_name": "Recipe Name 5"},
        {"recipe_name": "Recipe Name 6"}
      ]
    },
    {
      "set_number": 3,
      "explanation": "International flavors",
      "meals": [
        {"recipe_name": "Recipe Name 7"},
        {"recipe_name": "Recipe Name 8"},
        {"recipe_name": "Recipe Name 9"}
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
      
      const validRecipes = this.filterByDietaryRestrictions(allRecipes)
      console.log(`✅ Found ${validRecipes.length} valid recipes after dietary filtering`)

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