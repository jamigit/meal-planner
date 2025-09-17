import { getDatabase } from './db.js'
import { recipeService } from './recipeService.js'

class WeeklyPlanService {
  constructor() {
    this.db = getDatabase()
  }

  // Get all weekly plans
  async getAll() {
    try {
      const plans = await this.db.weeklyPlans.orderBy('created_at').reverse().toArray()
      return plans.map(plan => ({
        ...plan,
        meal_ids: plan.meal_ids || [],
        is_current: Boolean(plan.is_current)
      }))
    } catch (error) {
      console.error('Failed to get weekly plans:', error)
      return []
    }
  }

  // Get current weekly plan
  async getCurrent() {
    try {
      const plan = await this.db.weeklyPlans.where('is_current').equals(1).first()
      if (!plan) return null

      return {
        ...plan,
        meal_ids: plan.meal_ids || [],
        is_current: Boolean(plan.is_current)
      }
    } catch (error) {
      console.error('Failed to get current weekly plan:', error)
      return null
    }
  }

  // Get current weekly plan with full recipe details
  async getCurrentWithRecipes() {
    try {
      const currentPlan = await this.getCurrent()
      if (!currentPlan || !currentPlan.meal_ids.length) {
        return {
          meals: [],
          notes: '',
          id: null,
          created_at: null
        }
      }

      // Get full recipe details for each meal ID
      const meals = []
      for (const id of currentPlan.meal_ids) {
        const recipe = await recipeService.getById(id)
        if (recipe) meals.push(recipe)
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
  async save(weeklyPlan) {
    try {
      // First, set all existing plans to not current
      await this.db.weeklyPlans.where('is_current').equals(1).modify({ is_current: 0 })

      // Extract meal IDs from meal objects
      const mealIds = weeklyPlan.meals ? weeklyPlan.meals.map(meal => meal.id) : []

      // Insert new plan as current
      const id = await this.db.weeklyPlans.add({
        meal_ids: mealIds,
        notes: weeklyPlan.notes || null,
        is_current: 1,
        created_at: new Date().toISOString()
      })

      return this.getById(id)
    } catch (error) {
      console.error('Failed to save weekly plan:', error)
      throw error
    }
  }

  // Get weekly plan by ID
  async getById(id) {
    try {
      const plan = await this.db.weeklyPlans.get(id)
      if (!plan) return null

      return {
        ...plan,
        meal_ids: plan.meal_ids || [],
        is_current: Boolean(plan.is_current)
      }
    } catch (error) {
      console.error('Failed to get weekly plan by ID:', error)
      return null
    }
  }

  // Get weekly plan by ID with full recipe details
  async getByIdWithRecipes(id) {
    try {
      const plan = await this.getById(id)
      if (!plan) return null

      // Get full recipe details for each meal ID
      const meals = []
      for (const mealId of plan.meal_ids) {
        const recipe = await recipeService.getById(mealId)
        if (recipe) meals.push(recipe)
      }

      return {
        id: plan.id,
        meals,
        notes: plan.notes || '',
        is_current: plan.is_current,
        created_at: plan.created_at
      }
    } catch (error) {
      console.error('Failed to get weekly plan by ID with recipes:', error)
      return null
    }
  }

  // Set a plan as current
  async setAsCurrent(id) {
    try {
      // Set all plans to not current
      await this.db.weeklyPlans.where('is_current').equals(1).modify({ is_current: 0 })

      // Set specified plan as current
      const result = await this.db.weeklyPlans.update(id, { is_current: 1 })

      if (result === 0) {
        throw new Error('Weekly plan not found')
      }

      return this.getById(id)
    } catch (error) {
      console.error('Failed to set weekly plan as current:', error)
      throw error
    }
  }

  // Delete weekly plan
  async delete(id) {
    try {
      const result = await this.db.weeklyPlans.delete(id)
      return result > 0
    } catch (error) {
      console.error('Failed to delete weekly plan:', error)
      throw error
    }
  }

  // Get all weekly plans with recipe details (for saved plans view)
  async getAllWithRecipes() {
    try {
      const plans = await this.getAll()

      const plansWithRecipes = []
      for (const plan of plans) {
        const meals = []
        for (const mealId of plan.meal_ids) {
          const recipe = await recipeService.getById(mealId)
          if (recipe) meals.push(recipe)
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

// Export singleton instance
export const weeklyPlanService = new WeeklyPlanService()