import { mealHistoryService } from '../database/mealHistoryService.js'
import { recipeService } from '../database/recipeService.js'

class ClaudeAiService {
  constructor() {
    this.apiKey = import.meta.env.VITE_CLAUDE_API_KEY
    this.apiUrl = import.meta.env.DEV ? 'http://localhost:3001/api/claude' : '/api/claude'
    this.model = 'claude-3-5-sonnet-20241022'
    this.maxTokens = 1024
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

  // Create the prompt for Claude API
  createMealSuggestionPrompt(recipes, regularMeals, lessRegularMeals, recentMealIds, userNotes) {
    const recentMealNames = recipes
      .filter(r => recentMealIds.includes(r.id))
      .map(r => r.name)

    return `You are a meal planning assistant. Generate 3 different weekly meal suggestion sets based on the user's meal history and preferences.

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

**Requirements:**
1. Generate exactly 3 different suggestion sets
2. Each set should have exactly 4 meals
3. Each set should have 2 regular meals + 2 less regular meals (adjust if not enough available)
4. Avoid meals eaten in the last 2 weeks
5. Consider user preferences when selecting meals
6. Provide reasoning for each meal selection

**Response Format (JSON):**
{
  "suggestions": [
    {
      "set_number": 1,
      "explanation": "Overall explanation for this set's theme/approach",
      "meals": [
        {
          "recipe_name": "exact recipe name from collection",
          "reason": "why this meal was selected"
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
        const jsonMatch = response.match(/\{[\s\S]*\}/)
        if (jsonMatch) {
          jsonData = JSON.parse(jsonMatch[0])
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
              recipe,
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
  async generateMealSuggestions(userNotes = '') {
    try {
      if (!this.isConfigured()) {
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
        userNotes
      )

      // Call Claude API via backend proxy
      const response = await fetch(this.apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          prompt: prompt,
          userNotes: userNotes
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
      const suggestions = await this.parseMealSuggestions(content, validRecipes)

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
      return {
        success: false,
        error: error.message,
        fallback: await this.getFallbackSuggestions()
      }
    }
  }

  // Fallback suggestions when Claude API fails
  async getFallbackSuggestions() {
    try {
      const allRecipes = await recipeService.getAll()
      const validRecipes = this.filterByDietaryRestrictions(allRecipes)

      if (validRecipes.length === 0) {
        return []
      }

      // Simple fallback: pick 4 random valid recipes
      const shuffled = validRecipes.sort(() => 0.5 - Math.random())
      const selected = shuffled.slice(0, Math.min(4, shuffled.length))

      return [{
        set_number: 1,
        meals: selected.map(recipe => ({
          recipe,
          reason: "A good option that meets your dietary requirements (fallback)"
        })),
        explanation: "Simple selection of recipes that fit your dietary preferences. (Generated as fallback when AI is unavailable)"
      }]
    } catch (error) {
      console.error('Fallback suggestions failed:', error)
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