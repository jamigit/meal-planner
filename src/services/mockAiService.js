import { mealHistoryService } from '../database/mealHistoryService.js'
import { recipeService } from '../database/recipeService.js'

class MockAiService {
  constructor() {
    this.isEnabled = true
    this.simulatedDelay = 2000 // 2 second delay to simulate API call
  }

  // Helper to simulate API delay
  async simulateDelay() {
    return new Promise(resolve => setTimeout(resolve, this.simulatedDelay))
  }

  // Helper to filter recipes by dietary restrictions (removed restrictions)
  filterByDietaryRestrictions(recipes) {
    // No restrictions - return all recipes
    return recipes
  }

  // Generate explanation based on user preferences
  generateExplanation(userNotes, selectedMeals, setNumber) {
    const explanations = [
      {
        set: 1,
        base: "A balanced mix of your favorites with some variety.",
        withNotes: {
          'healthy': "Focused on nutritious options with lean proteins and vegetables.",
          'quick': "Selected meals that are quick to prepare for busy weeknights.",
          'chicken': "Featured chicken-based dishes since you mentioned having chicken available.",
          'comfort': "Chose comforting, satisfying meals for the week."
        }
      },
      {
        set: 2,
        base: "Emphasizing variety while respecting your regular preferences.",
        withNotes: {
          'healthy': "Prioritized fresh, wholesome ingredients and lighter options.",
          'quick': "All meals can be prepared in 30 minutes or less.",
          'chicken': "Incorporated chicken dishes to use what you have on hand.",
          'comfort': "Balanced comfort foods with some lighter alternatives."
        }
      },
      {
        set: 3,
        base: "A fresh take with some of your less frequent favorites.",
        withNotes: {
          'healthy': "Maximum nutrition with colorful vegetables and lean proteins.",
          'quick': "Streamlined recipes perfect for weeknight cooking.",
          'chicken': "Creative chicken preparations to keep meals interesting.",
          'comfort': "Classic comfort foods with a healthy twist."
        }
      }
    ]

    const explanation = explanations[setNumber - 1]
    const lowerNotes = userNotes.toLowerCase()

    // Check for key themes in user notes
    const themes = Object.keys(explanation.withNotes)
    const matchedTheme = themes.find(theme => lowerNotes.includes(theme))

    return matchedTheme ? explanation.withNotes[matchedTheme] : explanation.base
  }

  // Generate reason for selecting a specific meal
  generateMealReason(recipe, frequency, isRegular, userNotes, recentMeals) {
    const lowerNotes = userNotes.toLowerCase()

    if (isRegular) {
      if (frequency >= 5) {
        return "One of your absolute favorites - you've had this many times!"
      } else if (frequency >= 3) {
        return "A regular in your rotation that you consistently enjoy"
      }
    }

    // For less regular meals
    if (frequency === 0) {
      return "Time to try this recipe you haven't made yet"
    } else if (frequency <= 2) {
      return "A nice change of pace - you haven't had this recently"
    }

    // Context-based reasons
    if (lowerNotes.includes('healthy') && recipe.tags.includes('healthy')) {
      return "Fits your healthy eating goals this week"
    }

    if (lowerNotes.includes('quick') && recipe.tags.includes('quick')) {
      return "Perfect for when you need something quick and easy"
    }

    if (lowerNotes.includes('chicken') && recipe.tags.includes('chicken')) {
      return "Great way to use the chicken you mentioned having"
    }

    return "A good balance for your weekly variety"
  }

  // Main function to generate meal suggestions
  async generateMealSuggestions(userNotes = '') {
    try {
      // Simulate API delay
      await this.simulateDelay()

      // Get data needed for suggestions
      const { regular, lessRegular } = await mealHistoryService.categorizeRecipesByFrequency()
      const recentMealIds = await mealHistoryService.getRecentMeals(2) // Last 2 weeks

      // Filter by dietary restrictions
      const validRegular = this.filterByDietaryRestrictions(regular)
        .filter(recipe => !recentMealIds.includes(recipe.id))

      const validLessRegular = this.filterByDietaryRestrictions(lessRegular)
        .filter(recipe => !recentMealIds.includes(recipe.id))

      if (validRegular.length === 0 && validLessRegular.length === 0) {
        throw new Error('No suitable recipes found that meet dietary restrictions')
      }

      // Generate 3 different suggestion sets
      const suggestions = []

      for (let setNumber = 1; setNumber <= 3; setNumber++) {
        const selectedMeals = []

        // Strategy for each set
        let regularToSelect = Math.min(2, validRegular.length)
        let lessRegularToSelect = Math.min(2, validLessRegular.length)

        // Adjust if we don't have enough in one category
        const totalNeeded = 4
        if (regularToSelect + lessRegularToSelect < totalNeeded) {
          if (validRegular.length > validLessRegular.length) {
            regularToSelect = Math.min(totalNeeded, validRegular.length)
            lessRegularToSelect = Math.max(0, totalNeeded - regularToSelect)
          } else {
            lessRegularToSelect = Math.min(totalNeeded, validLessRegular.length)
            regularToSelect = Math.max(0, totalNeeded - lessRegularToSelect)
          }
        }

        // Select regular meals (vary selection for different sets)
        const availableRegular = [...validRegular]
        for (let i = 0; i < regularToSelect; i++) {
          if (availableRegular.length === 0) break

          // Different selection strategy for each set
          let selectedIndex
          if (setNumber === 1) {
            selectedIndex = 0 // Highest frequency first
          } else if (setNumber === 2) {
            selectedIndex = Math.min(1, availableRegular.length - 1) // Second highest
          } else {
            selectedIndex = Math.floor(Math.random() * Math.min(3, availableRegular.length))
          }

          const selected = availableRegular.splice(selectedIndex, 1)[0]
          selectedMeals.push({
            recipe: selected,
            reason: this.generateMealReason(selected, selected.frequency, true, userNotes, recentMealIds)
          })
        }

        // Select less regular meals
        const availableLessRegular = [...validLessRegular]
        for (let i = 0; i < lessRegularToSelect; i++) {
          if (availableLessRegular.length === 0) break

          // Different selection strategy for each set
          let selectedIndex
          if (setNumber === 1) {
            selectedIndex = Math.floor(Math.random() * Math.min(2, availableLessRegular.length))
          } else if (setNumber === 2) {
            selectedIndex = Math.floor(availableLessRegular.length * 0.3) // Middle range
          } else {
            selectedIndex = Math.floor(Math.random() * availableLessRegular.length) // More random
          }

          const selected = availableLessRegular.splice(selectedIndex, 1)[0]
          selectedMeals.push({
            recipe: selected,
            reason: this.generateMealReason(selected, selected.frequency, false, userNotes, recentMealIds)
          })
        }

        // Create suggestion set
        suggestions.push({
          set_number: setNumber,
          meals: selectedMeals,
          explanation: this.generateExplanation(userNotes, selectedMeals, setNumber)
        })
      }

      return {
        success: true,
        data: suggestions,
        metadata: {
          totalRegular: validRegular.length,
          totalLessRegular: validLessRegular.length,
          recentMealsAvoided: recentMealIds.length,
          userNotes: userNotes || 'No specific preferences'
        }
      }

    } catch (error) {
      console.error('Mock AI service error:', error)
      return {
        success: false,
        error: error.message,
        fallback: await this.getFallbackSuggestions()
      }
    }
  }

  // Fallback suggestions when main algorithm fails
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
          reason: "A good option that meets your dietary requirements"
        })),
        explanation: "A simple selection of recipes that fit your dietary preferences."
      }]
    } catch (error) {
      console.error('Fallback suggestions failed:', error)
      return []
    }
  }

  // Method to test the service with sample data
  async testService() {
    console.log('🧪 Testing Mock AI Service...')

    try {
      const testResults = []

      // Test with different user notes
      const testCases = [
        '',
        'feeling like healthy meals this week',
        'need something quick and easy',
        'have chicken in the fridge',
        'comfort food kind of week'
      ]

      for (const userNotes of testCases) {
        console.log(`Testing with notes: "${userNotes || 'no notes'}"`)
        const result = await this.generateMealSuggestions(userNotes)
        testResults.push({ userNotes, result })

        if (result.success) {
          console.log(`✅ Generated ${result.data.length} suggestion sets`)
        } else {
          console.log(`❌ Failed: ${result.error}`)
        }
      }

      return testResults
    } catch (error) {
      console.error('Test failed:', error)
      return null
    }
  }
}

// Export singleton instance
export const mockAiService = new MockAiService()