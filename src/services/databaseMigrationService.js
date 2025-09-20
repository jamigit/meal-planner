import { recipeService } from '../database/recipeService.js'
import { weeklyPlanService } from '../database/weeklyPlanService.js'
import { mealHistoryService } from '../database/mealHistoryService.js'
import { supabaseRecipeService } from '../database/supabaseRecipeService.js'
import { supabaseWeeklyPlanService } from '../database/supabaseWeeklyPlanService.js'
import { supabaseMealHistoryService } from '../database/supabaseMealHistoryService.js'

class DatabaseMigrationService {
  constructor() {
    this.isMigrating = false
  }

  async migrateAllData() {
    if (this.isMigrating) {
      throw new Error('Migration already in progress')
    }

    this.isMigrating = true
    console.log('🔄 Starting data migration to Supabase...')

    try {
      // Migrate recipes
      console.log('📝 Migrating recipes...')
      const recipes = await recipeService.getAll()
      if (recipes.length > 0) {
        await supabaseRecipeService.bulkInsert(recipes)
        console.log(`✅ Migrated ${recipes.length} recipes`)
      }

      // Migrate weekly plans
      console.log('📅 Migrating weekly plans...')
      const plans = await weeklyPlanService.getAll()
      for (const plan of plans) {
        await supabaseWeeklyPlanService.save(plan, plan.is_current)
      }
      console.log(`✅ Migrated ${plans.length} weekly plans`)

      // Migrate meal history
      console.log('🍽️ Migrating meal history...')
      const history = await mealHistoryService.getAll()
      for (const entry of history) {
        await supabaseMealHistoryService.addMealToHistory(
          entry.recipe_id,
          entry.eaten_date
        )
      }
      console.log(`✅ Migrated ${history.length} meal history entries`)

      console.log('🎉 Data migration completed successfully!')
      return { success: true, message: 'All data migrated successfully' }
    } catch (error) {
      console.error('❌ Migration failed:', error)
      return { success: false, error: error.message }
    } finally {
      this.isMigrating = false
    }
  }

  async checkMigrationStatus() {
    try {
      const localRecipes = await recipeService.getAll()
      const localPlans = await weeklyPlanService.getAll()
      const localHistory = await mealHistoryService.getAll()

      const cloudRecipes = await supabaseRecipeService.getAll()
      const cloudPlans = await supabaseWeeklyPlanService.getAll()
      const cloudHistory = await supabaseMealHistoryService.getHistoryByDateRange(52) // 1 year

      return {
        local: {
          recipes: localRecipes.length,
          plans: localPlans.length,
          history: localHistory.length
        },
        cloud: {
          recipes: cloudRecipes.length,
          plans: cloudPlans.length,
          history: cloudHistory.length
        },
        needsMigration: localRecipes.length > 0 && cloudRecipes.length === 0
      }
    } catch (error) {
      console.error('Failed to check migration status:', error)
      return {
        local: { recipes: 0, plans: 0, history: 0 },
        cloud: { recipes: 0, plans: 0, history: 0 },
        needsMigration: false
      }
    }
  }

  async clearLocalData() {
    try {
      console.log('🧹 Clearing local data...')
      
      // Clear IndexedDB data
      const db = await import('../database/db.js').then(m => m.getDatabase())
      await db.recipes.clear()
      await db.weeklyPlans.clear()
      await db.mealHistory.clear()
      
      console.log('✅ Local data cleared')
      return { success: true }
    } catch (error) {
      console.error('Failed to clear local data:', error)
      return { success: false, error: error.message }
    }
  }
}

export const databaseMigrationService = new DatabaseMigrationService()
