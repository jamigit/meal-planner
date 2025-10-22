import { supabase } from '../lib/supabase.js'
import { authService } from '../services/authService.js'
import { recipeService } from './recipeService.js'
import { supabaseRecipeService } from './supabaseRecipeService.js'

class SupabaseMealHistoryService {
  constructor() {
    this.tableName = 'meal_history'
  }

  async getUserId() {
    const user = await authService.getCurrentUser()
    if (!user) throw new Error('User not authenticated')
    return user.id
  }

  // Helper function to get Monday of a given date (week start)
  getWeekStartDate(date = new Date()) {
    const d = new Date(date)
    const day = d.getDay()
    const diff = d.getDate() - day + (day === 0 ? -6 : 1) // Adjust when day is Sunday
    d.setDate(diff)
    return d.toISOString().split('T')[0] // Return YYYY-MM-DD format
  }

  // Validate recipe exists in Supabase
  async validateRecipeId(recipeId) {
    try {
      const userId = await this.getUserId()
      const { data, error } = await supabase
        .from('recipes')
        .select('id')
        .eq('id', recipeId)
        .eq('user_id', userId)

      if (error) {
        console.warn(`Recipe with ID ${recipeId} not found in Supabase:`, error.message)
        return false
      }
      
      // Check if we got any results
      return data && data.length > 0
    } catch (error) {
      console.warn(`Error validating recipe ID ${recipeId}:`, error.message)
      return false
    }
  }

  // Add meal to history
  async addMealToHistory(recipeId, eatenDate = null) {
    try {
      const userId = await this.getUserId()
      const actualEatenDate = eatenDate || new Date().toISOString().split('T')[0]
      const weekDate = this.getWeekStartDate(new Date(actualEatenDate))

      // Validate recipe exists
      console.log(`🔍 Validating recipe ID: ${recipeId} (type: ${typeof recipeId})`)
      const recipeExists = await this.validateRecipeId(recipeId)
      console.log(`🔍 Recipe exists in Supabase: ${recipeExists}`)
      
      if (!recipeExists) {
        console.warn(`Recipe with ID ${recipeId} not found in Supabase. Attempting to sync from IndexedDB...`)
        
        // Try to fetch recipe from IndexedDB and sync to Supabase
        try {
          console.log(`🔍 Attempting to fetch recipe ${recipeId} from IndexedDB...`)
          const localRecipe = await recipeService.getById(recipeId)
          console.log(`🔍 Local recipe result:`, localRecipe)
          
          if (localRecipe) {
            console.log(`Found recipe in IndexedDB: ${localRecipe.name}. Syncing to Supabase...`)
            console.log(`🔍 Local recipe data:`, {
              id: localRecipe.id,
              name: localRecipe.name,
              ingredients: localRecipe.ingredients?.length,
              tags: localRecipe.tags?.length
            })
            
            // Create Supabase recipe service instance to sync the recipe
            const syncedRecipe = await supabaseRecipeService.add(localRecipe)
            console.log(`Successfully synced recipe to Supabase:`, syncedRecipe)
            
            // Use the synced recipe ID
            recipeId = syncedRecipe.id
            console.log(`🔍 Updated recipeId to: ${recipeId}`)
          } else {
            console.error(`❌ Recipe with ID ${recipeId} not found in IndexedDB`)
            throw new Error(`Recipe with ID ${recipeId} not found in IndexedDB or Supabase. This recipe may have been deleted.`)
          }
        } catch (syncError) {
          console.error('Failed to sync recipe from IndexedDB:', syncError)
          console.error('Sync error details:', {
            message: syncError.message,
            stack: syncError.stack,
            recipeId: recipeId
          })
          throw new Error(`Recipe with ID ${recipeId} not found and could not be synced. Please re-add this recipe to your collection before marking as eaten.`)
        }
      }

      console.log(`🔍 Final recipeId before insert: ${recipeId}`)
      console.log(`🔍 Inserting meal history with:`, {
        user_id: userId,
        recipe_id: recipeId,
        week_date: weekDate,
        eaten_date: actualEatenDate
      })

      const { data, error } = await supabase
        .from(this.tableName)
        .insert({
          user_id: userId,
          recipe_id: recipeId,
          week_date: weekDate,
          eaten_date: actualEatenDate
        })
        .select()
        .single()

      if (error) {
        console.error('❌ Supabase insert error:', error)
        throw error
      }
      
      console.log('✅ Successfully added meal to history:', data)
      return data
    } catch (error) {
      console.error('Failed to add meal to history:', error)
      throw error
    }
  }

  // Get meal history by date range
  async getHistoryByDateRange(weeksBack = 8) {
    try {
      const userId = await this.getUserId()
      const cutoffDate = new Date()
      cutoffDate.setDate(cutoffDate.getDate() - (weeksBack * 7))
      const cutoffDateStr = cutoffDate.toISOString().split('T')[0]

      const { data, error } = await supabase
        .from(this.tableName)
        .select('*')
        .eq('user_id', userId)
        .gte('eaten_date', cutoffDateStr)
        .order('eaten_date', { ascending: false })

      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Failed to get meal history by date range:', error)
      return []
    }
  }

  // Get meal history with recipe details
  async getHistoryWithRecipes(weeksBack = 8) {
    try {
      const history = await this.getHistoryByDateRange(weeksBack)
      const historyWithRecipes = []

      for (const entry of history) {
        const { data: recipe, error } = await supabase
          .from('recipes')
          .select('*')
          .eq('id', entry.recipe_id)
          .eq('user_id', await this.getUserId())
          .single()

        if (error) {
          console.error('Failed to get recipe for history entry:', error)
          continue
        }

        historyWithRecipes.push({
          ...entry,
          recipe: recipe
        })
      }

      return historyWithRecipes
    } catch (error) {
      console.error('Failed to get meal history with recipes:', error)
      return []
    }
  }

  // Get recipe frequency count
  async getRecipeFrequency(weeksBack = 8) {
    try {
      const userId = await this.getUserId()
      const cutoffDate = new Date()
      cutoffDate.setDate(cutoffDate.getDate() - (weeksBack * 7))
      const cutoffDateStr = cutoffDate.toISOString().split('T')[0]

      const { data, error } = await supabase
        .from(this.tableName)
        .select('recipe_id')
        .eq('user_id', userId)
        .gte('eaten_date', cutoffDateStr)

      if (error) throw error

      const frequency = {}
      data.forEach(entry => {
        frequency[entry.recipe_id] = (frequency[entry.recipe_id] || 0) + 1
      })

      return frequency
    } catch (error) {
      console.error('Failed to get recipe frequency:', error)
      return {}
    }
  }

  // Categorize recipes by frequency
  async categorizeRecipesByFrequency() {
    try {
      const { data: recipes, error: recipesError } = await supabase
        .from('recipes')
        .select('*')
        .eq('user_id', await this.getUserId())

      if (recipesError) throw recipesError

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

  // Get recent meals (to avoid in suggestions)
  async getRecentMeals(weeksBack = 2) {
    try {
      const userId = await this.getUserId()
      const cutoffDate = new Date()
      cutoffDate.setDate(cutoffDate.getDate() - (weeksBack * 7))
      const cutoffString = cutoffDate.toISOString().split('T')[0]

      const { data, error } = await supabase
        .from(this.tableName)
        .select('recipe_id')
        .eq('user_id', userId)
        .gte('eaten_date', cutoffString)

      if (error) throw error

      // Return unique recipe IDs
      return [...new Set(data.map(entry => entry.recipe_id))]
    } catch (error) {
      console.error('Failed to get recent meals:', error)
      return []
    }
  }

  // Get recent meal history with full recipe details
  async getRecentHistoryWithDetails(daysBack = 30) {
    try {
      const userId = await this.getUserId()
      const cutoffDate = new Date()
      cutoffDate.setDate(cutoffDate.getDate() - daysBack)
      const cutoffDateStr = cutoffDate.toISOString().split('T')[0]

      const { data: historyEntries, error } = await supabase
        .from(this.tableName)
        .select(`
          *,
          recipes (
            id,
            name,
            url,
            ingredients,
            instructions,
            prep_time,
            cook_time,
            servings,
            cuisine_tags,
            ingredient_tags,
            convenience_tags,
            tags
          )
        `)
        .eq('user_id', userId)
        .gte('eaten_date', cutoffDateStr)
        .order('eaten_date', { ascending: false })

      if (error) throw error

      return historyEntries.map(entry => ({
        ...entry,
        recipe: entry.recipes
      }))
    } catch (error) {
      console.error('Failed to get recent history with details:', error)
      return []
    }
  }

  // Get recipe eaten count
  async getRecipeEatenCount(recipeId, weeksBack = 8) {
    try {
      const userId = await this.getUserId()
      const cutoffDate = new Date()
      cutoffDate.setDate(cutoffDate.getDate() - (weeksBack * 7))
      const cutoffDateStr = cutoffDate.toISOString().split('T')[0]

      const { count, error } = await supabase
        .from(this.tableName)
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('recipe_id', recipeId)
        .gte('eaten_date', cutoffDateStr)

      if (error) throw error
      return count || 0
    } catch (error) {
      console.error('Failed to get recipe eaten count:', error)
      return 0
    }
  }

  // Get recipe eaten counts for multiple recipes
  async getRecipeEatenCounts(recipeIds, weeksBack = 8) {
    try {
      const counts = {}
      for (const recipeId of recipeIds) {
        counts[recipeId] = await this.getRecipeEatenCount(recipeId, weeksBack)
      }
      return counts
    } catch (error) {
      console.error('Failed to get recipe eaten counts:', error)
      return {}
    }
  }

  // Delete meal history entry
  async delete(id) {
    try {
      const userId = await this.getUserId()
      const { error } = await supabase
        .from(this.tableName)
        .delete()
        .eq('id', id)
        .eq('user_id', userId)

      if (error) throw error
      return true
    } catch (error) {
      console.error('Failed to delete meal history entry:', error)
      throw error
    }
  }

  // Get statistics
  async getStatistics() {
    try {
      const userId = await this.getUserId()
      const { data, error } = await supabase
        .from(this.tableName)
        .select('eaten_date')
        .eq('user_id', userId)
        .order('eaten_date', { ascending: false })

      if (error) throw error

      const totalMeals = data.length
      const uniqueRecipes = new Set(data.map(entry => entry.recipe_id)).size
      const lastEaten = data.length > 0 ? data[0].eaten_date : null

      return {
        totalMeals,
        uniqueRecipes,
        lastEaten
      }
    } catch (error) {
      console.error('Failed to get meal history statistics:', error)
      return {
        totalMeals: 0,
        uniqueRecipes: 0,
        lastEaten: null
      }
    }
  }
}

export const supabaseMealHistoryService = new SupabaseMealHistoryService()
