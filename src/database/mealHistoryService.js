import { getDatabase } from './db.js'
import { recipeService } from './recipeService.js'

class MealHistoryService {
  constructor() {
    this.db = getDatabase()
  }

  // Helper function to get Monday of a given date (week start)
  getWeekStartDate(date = new Date()) {
    const d = new Date(date)
    const day = d.getDay()
    const diff = d.getDate() - day + (day === 0 ? -6 : 1) // Adjust when day is Sunday
    d.setDate(diff)
    return d.toISOString().split('T')[0] // Return YYYY-MM-DD format
  }

  // Validate recipe exists
  async validateRecipeId(recipeId) {
    const recipe = await recipeService.getById(recipeId)
    return recipe !== null
  }

  // Add meal to history
  async addMealToHistory(recipeId, eatenDate = null) {
    try {
      // Validate recipe exists
      const recipeExists = await this.validateRecipeId(recipeId)
      if (!recipeExists) {
        throw new Error(`Recipe with ID ${recipeId} does not exist`)
      }

      const now = new Date().toISOString()
      const actualEatenDate = eatenDate || new Date().toISOString().split('T')[0]
      const weekDate = this.getWeekStartDate(new Date(actualEatenDate))

      const historyEntry = {
        recipe_id: recipeId,
        week_date: weekDate,
        eaten_date: actualEatenDate,
        created_at: now
      }

      const id = await this.db.mealHistory.add(historyEntry)
      return this.getById(id)
    } catch (error) {
      console.error('Failed to add meal to history:', error)
      throw error
    }
  }

  // Get meal history entry by ID
  async getById(id) {
    try {
      const entry = await this.db.mealHistory.get(id)
      return entry || null
    } catch (error) {
      console.error('Failed to get meal history by ID:', error)
      return null
    }
  }

  // Get all meal history (most recent first)
  async getAll() {
    try {
      return await this.db.mealHistory
        .orderBy('created_at')
        .reverse()
        .toArray()
    } catch (error) {
      console.error('Failed to get meal history:', error)
      return []
    }
  }

  // Get meal history for specific time period
  async getHistoryByDateRange(weeksBack = 8) {
    try {
      const cutoffDate = new Date()
      cutoffDate.setDate(cutoffDate.getDate() - (weeksBack * 7))
      const cutoffString = cutoffDate.toISOString().split('T')[0]

      return await this.db.mealHistory
        .where('week_date')
        .aboveOrEqual(cutoffString)
        .toArray()
    } catch (error) {
      console.error('Failed to get history by date range:', error)
      return []
    }
  }

  // Get meal history with full recipe details
  async getHistoryWithRecipes(weeksBack = 8) {
    try {
      const history = await this.getHistoryByDateRange(weeksBack)
      const historyWithRecipes = []

      for (const entry of history) {
        const recipe = await recipeService.getById(entry.recipe_id)
        if (recipe) {
          historyWithRecipes.push({
            ...entry,
            recipe
          })
        }
      }

      return historyWithRecipes.sort((a, b) =>
        new Date(b.created_at) - new Date(a.created_at)
      )
    } catch (error) {
      console.error('Failed to get history with recipes:', error)
      return []
    }
  }

  // Calculate recipe frequency for AI analysis
  async getRecipeFrequency(weeksBack = 8) {
    try {
      const history = await this.getHistoryByDateRange(weeksBack)
      const frequency = {}

      history.forEach(entry => {
        frequency[entry.recipe_id] = (frequency[entry.recipe_id] || 0) + 1
      })

      return frequency
    } catch (error) {
      console.error('Failed to get recipe frequency:', error)
      return {}
    }
  }

  // Categorize recipes by frequency for AI suggestions
  async categorizeRecipesByFrequency() {
    try {
      const recipes = await recipeService.getAll()
      const frequency = await this.getRecipeFrequency(8)

      const regular = []
      const lessRegular = []

      recipes.forEach(recipe => {
        const count = frequency[recipe.id] || 0
        const recipeWithFrequency = { ...recipe, frequency: count }

        if (count >= 3) {
          regular.push(recipeWithFrequency)
        } else {
          lessRegular.push(recipeWithFrequency)
        }
      })

      // Sort by frequency (highest first)
      regular.sort((a, b) => b.frequency - a.frequency)
      lessRegular.sort((a, b) => b.frequency - a.frequency)

      return { regular, lessRegular }
    } catch (error) {
      console.error('Failed to categorize recipes by frequency:', error)
      return { regular: [], lessRegular: [] }
    }
  }

  // Get recently eaten meals (to avoid in suggestions)
  async getRecentMeals(weeksBack = 2) {
    try {
      const cutoffDate = new Date()
      cutoffDate.setDate(cutoffDate.getDate() - (weeksBack * 7))
      const cutoffString = cutoffDate.toISOString().split('T')[0]

      const recentHistory = await this.db.mealHistory
        .where('eaten_date')
        .aboveOrEqual(cutoffString)
        .toArray()

      // Return unique recipe IDs
      return [...new Set(recentHistory.map(entry => entry.recipe_id))]
    } catch (error) {
      console.error('Failed to get recent meals:', error)
      return []
    }
  }

  // Delete meal history entry
  async delete(id) {
    try {
      const result = await this.db.mealHistory.delete(id)
      return result > 0
    } catch (error) {
      console.error('Failed to delete meal history:', error)
      throw error
    }
  }

  // Bulk add meal history (useful for testing/migration)
  async bulkAdd(historyEntries) {
    try {
      const now = new Date().toISOString()
      const validatedEntries = []

      for (const entry of historyEntries) {
        // Validate each recipe exists
        const recipeExists = await this.validateRecipeId(entry.recipe_id)
        if (!recipeExists) {
          console.warn(`Skipping entry with invalid recipe_id: ${entry.recipe_id}`)
          continue
        }

        validatedEntries.push({
          recipe_id: entry.recipe_id,
          week_date: entry.week_date || this.getWeekStartDate(new Date(entry.eaten_date)),
          eaten_date: entry.eaten_date,
          created_at: entry.created_at || now
        })
      }

      const results = await this.db.mealHistory.bulkAdd(validatedEntries, { allKeys: true })
      console.log(`Successfully added ${results.length} meal history entries`)
      return results
    } catch (error) {
      console.error('Failed to bulk add meal history:', error)
      throw error
    }
  }

  // Get eaten count for a specific recipe
  async getRecipeEatenCount(recipeId, weeksBack = 8) {
    try {
      const frequency = await this.getRecipeFrequency(weeksBack)
      return frequency[recipeId] || 0
    } catch (error) {
      console.error('Failed to get recipe eaten count:', error)
      return 0
    }
  }

  // Get eaten counts for multiple recipes
  async getRecipeEatenCounts(recipeIds, weeksBack = 8) {
    try {
      const frequency = await this.getRecipeFrequency(weeksBack)
      const counts = {}

      recipeIds.forEach(recipeId => {
        counts[recipeId] = frequency[recipeId] || 0
      })

      return counts
    } catch (error) {
      console.error('Failed to get recipe eaten counts:', error)
      return {}
    }
  }

  // Get statistics for debugging/analysis
  async getStatistics() {
    try {
      const allHistory = await this.getAll()
      const frequency = await this.getRecipeFrequency(8)
      const { regular, lessRegular } = await this.categorizeRecipesByFrequency()

      return {
        totalEntries: allHistory.length,
        uniqueRecipes: Object.keys(frequency).length,
        regularRecipes: regular.length,
        lessRegularRecipes: lessRegular.length,
        averageFrequency: Object.values(frequency).length > 0
          ? Object.values(frequency).reduce((a, b) => a + b, 0) / Object.values(frequency).length
          : 0
      }
    } catch (error) {
      console.error('Failed to get statistics:', error)
      return null
    }
  }
}

// Export singleton instance
export const mealHistoryService = new MealHistoryService()