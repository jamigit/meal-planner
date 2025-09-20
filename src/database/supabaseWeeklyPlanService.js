import { supabase } from '../lib/supabase.js'
import { authService } from '../services/authService.js'

class SupabaseWeeklyPlanService {
  constructor() {
    this.tableName = 'weekly_plans'
  }

  async getUserId() {
    const user = await authService.getCurrentUser()
    if (!user) throw new Error('User not authenticated')
    return user.id
  }

  // Get all weekly plans for current user
  async getAll() {
    try {
      const userId = await this.getUserId()
      const { data, error } = await supabase
        .from(this.tableName)
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })

      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Failed to get weekly plans:', error)
      return []
    }
  }

  // Get current weekly plan
  async getCurrent() {
    try {
      const userId = await this.getUserId()
      const { data, error } = await supabase
        .from(this.tableName)
        .select('*')
        .eq('user_id', userId)
        .eq('is_current', true)
        .single()

      if (error && error.code !== 'PGRST116') throw error
      return data || null
    } catch (error) {
      console.error('Failed to get current weekly plan:', error)
      return null
    }
  }

  // Get current weekly plan with full recipe details
  async getCurrentWithRecipes() {
    try {
      const currentPlan = await this.getCurrent()
      if (!currentPlan) {
        return {
          meals: [],
          notes: '',
          id: null,
          created_at: null
        }
      }

      // Get recipe details for each meal
      const mealIds = currentPlan.meals?.map(meal => meal.id).filter(Boolean) || []
      let meals = []

      if (mealIds.length > 0) {
        const { data: recipes, error } = await supabase
          .from('recipes')
          .select('*')
          .in('id', mealIds)
          .eq('user_id', await this.getUserId())

        if (error) throw error

        // Map recipes to meals with scaling
        meals = currentPlan.meals.map(meal => {
          const recipe = recipes.find(r => r.id === meal.id)
          return recipe ? { ...recipe, scaling: meal.scaling || 1 } : meal
        })
      }

      return {
        id: currentPlan.id,
        meals,
        notes: currentPlan.notes || '',
        created_at: currentPlan.created_at
      }
    } catch (error) {
      console.error('Failed to get current weekly plan with recipes:', error)
      return {
        meals: [],
        notes: '',
        id: null,
        created_at: null
      }
    }
  }

  // Save new weekly plan
  async save(weeklyPlan, setAsCurrent = true) {
    try {
      const userId = await this.getUserId()

      // Clear existing current plans if setting as current
      if (setAsCurrent) {
        await supabase
          .from(this.tableName)
          .update({ is_current: false })
          .eq('user_id', userId)
          .eq('is_current', true)
      }

      // Prepare meals data
      const meals = weeklyPlan.meals?.map(meal => ({
        id: meal.id,
        name: meal.name,
        url: meal.url,
        ingredients: meal.ingredients,
        instructions: meal.instructions,
        prep_time: meal.prep_time,
        cook_time: meal.cook_time,
        servings: meal.servings,
        scaling: meal.scaling || 1
      })) || []

      // Insert new plan
      const { data, error } = await supabase
        .from(this.tableName)
        .insert({
          user_id: userId,
          meals: meals,
          notes: weeklyPlan.notes || null,
          is_current: setAsCurrent
        })
        .select()
        .single()

      if (error) throw error
      return data
    } catch (error) {
      console.error('Failed to save weekly plan:', error)
      throw error
    }
  }

  // Get weekly plan by ID
  async getById(id) {
    try {
      const userId = await this.getUserId()
      const { data, error } = await supabase
        .from(this.tableName)
        .select('*')
        .eq('id', id)
        .eq('user_id', userId)
        .single()

      if (error) throw error
      return data
    } catch (error) {
      console.error('Failed to get weekly plan by ID:', error)
      return null
    }
  }

  // Update weekly plan
  async update(id, updates) {
    try {
      const userId = await this.getUserId()
      const { data, error } = await supabase
        .from(this.tableName)
        .update({
          meals: updates.meals,
          notes: updates.notes,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .eq('user_id', userId)
        .select()
        .single()

      if (error) throw error
      return data
    } catch (error) {
      console.error('Failed to update weekly plan:', error)
      throw error
    }
  }

  // Delete weekly plan
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
      console.error('Failed to delete weekly plan:', error)
      throw error
    }
  }

  // Clear all current plans
  async clearCurrentPlans() {
    try {
      const userId = await this.getUserId()
      const { error } = await supabase
        .from(this.tableName)
        .update({ is_current: false })
        .eq('user_id', userId)
        .eq('is_current', true)

      if (error) throw error
      return true
    } catch (error) {
      console.error('Failed to clear current plans:', error)
      throw error
    }
  }

  // Set plan as current
  async setAsCurrent(id) {
    try {
      const userId = await this.getUserId()

      // Clear all current plans
      await this.clearCurrentPlans()

      // Set this plan as current
      const { data, error } = await supabase
        .from(this.tableName)
        .update({ is_current: true })
        .eq('id', id)
        .eq('user_id', userId)
        .select()
        .single()

      if (error) throw error
      return data
    } catch (error) {
      console.error('Failed to set plan as current:', error)
      throw error
    }
  }

  // Get all weekly plans with recipe details
  async getAllWithRecipes() {
    try {
      const plans = await this.getAll()
      const plansWithRecipes = []

      for (const plan of plans) {
        let meals = []

        if (plan.meals && plan.meals.length > 0) {
          const mealIds = plan.meals.map(meal => meal.id).filter(Boolean)
          
          if (mealIds.length > 0) {
            const { data: recipes, error } = await supabase
              .from('recipes')
              .select('*')
              .in('id', mealIds)
              .eq('user_id', await this.getUserId())

            if (error) throw error

            meals = plan.meals.map(meal => {
              const recipe = recipes.find(r => r.id === meal.id)
              return recipe ? { ...recipe, scaling: meal.scaling || 1 } : meal
            })
          }
        }

        plansWithRecipes.push({
          id: plan.id,
          meals,
          notes: plan.notes || '',
          is_current: plan.is_current,
          created_at: plan.created_at
        })
      }

      return plansWithRecipes
    } catch (error) {
      console.error('Failed to get all weekly plans with recipes:', error)
      return []
    }
  }
}

export const supabaseWeeklyPlanService = new SupabaseWeeklyPlanService()
