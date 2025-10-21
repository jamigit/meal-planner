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
        meal_ids: plan.meal_ids || [], // Keep for backwards compatibility
        meals: plan.meals || [], // New format
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
      console.log('Getting current plan...')
      
      // Use a safer approach - get all plans and filter
      const allPlans = await this.db.weeklyPlans.toArray()
      console.log('All plans for getCurrent:', allPlans.map(p => ({ id: p.id, is_current: p.is_current, type: typeof p.is_current })))
      
      const currentPlan = allPlans.find(plan => 
        plan.is_current === true || plan.is_current === 1
      )
      
      if (!currentPlan) {
        console.log('No current plan found')
        return null
      }

      console.log('Found current plan:', currentPlan.id)
      return {
        ...currentPlan,
        meal_ids: currentPlan.meal_ids || [], // Keep for backwards compatibility
        meals: currentPlan.meals || [], // New format
        is_current: Boolean(currentPlan.is_current)
      }
    } catch (error) {
      console.error('Failed to get current weekly plan:', error)
      return null
    }
  }

  // Clear all current plans (set all to not current)
  async clearCurrentPlans() {
    try {
      console.log('Clearing current plans...')
      
      // Use a safer approach - get all plans and filter, then update
      const allPlans = await this.db.weeklyPlans.toArray()
      console.log('All plans:', allPlans.map(p => ({ id: p.id, is_current: p.is_current, type: typeof p.is_current })))
      
      const currentPlans = allPlans.filter(plan => 
        plan.is_current === true || plan.is_current === 1
      )
      
      console.log('Found current plans:', currentPlans.length)
      
      let totalCleared = 0
      for (const plan of currentPlans) {
        const result = await this.db.weeklyPlans.update(plan.id, { is_current: false })
        totalCleared += result
      }
      
      console.log(`Total cleared ${totalCleared} current plans`)
      return totalCleared
    } catch (error) {
      console.error('Failed to clear current plans:', error)
      return 0
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

      let meals = []

      // Handle new format (meals array with scaling)
      if (currentPlan.meals && currentPlan.meals.length > 0) {
        meals = currentPlan.meals
      }
      // Handle old format (meal_ids array) for backwards compatibility
      else if (currentPlan.meal_ids && currentPlan.meal_ids.length > 0) {
        for (const id of currentPlan.meal_ids) {
          const recipe = await recipeService.getById(id)
          if (recipe) {
            meals.push({
              ...recipe,
              scaling: 1 // Default scaling for old format
            })
          }
        }
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
      // First, set all existing plans to not current (only if setting as current)
      if (setAsCurrent) {
        console.log('Clearing current plans before saving...')
        // Use safer approach to clear current plans
        const allPlans = await this.db.weeklyPlans.toArray()
        const currentPlans = allPlans.filter(plan => 
          plan.is_current === true || plan.is_current === 1
        )
        
        console.log('Found current plans to clear:', currentPlans.length)
        
        for (const plan of currentPlans) {
          await this.db.weeklyPlans.update(plan.id, { is_current: false })
        }
      }

      // Store meal objects with scaling information
      const meals = weeklyPlan.meals ? weeklyPlan.meals.map(meal => ({
        id: meal.id,
        name: meal.name,
        url: meal.url,
        tags: meal.tags,
        ingredients: meal.ingredients,
        instructions: meal.instructions,
        prep_time: meal.prep_time,
        cook_time: meal.cook_time,
        servings: meal.servings,
        scaling: meal.scaling || 1
      })) : []

      // Insert new plan
      const id = await this.db.weeklyPlans.add({
        meals: meals,
        notes: weeklyPlan.notes || null,
        name: weeklyPlan.name || null,
        is_current: setAsCurrent,
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
        meal_ids: plan.meal_ids || [], // Keep for backwards compatibility
        meals: plan.meals || [], // New format
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

      let meals = []

      // Handle new format (meals array with scaling)
      if (plan.meals && plan.meals.length > 0) {
        meals = plan.meals
      }
      // Handle old format (meal_ids array) for backwards compatibility
      else if (plan.meal_ids && plan.meal_ids.length > 0) {
        for (const mealId of plan.meal_ids) {
          const recipe = await recipeService.getById(mealId)
          if (recipe) {
            meals.push({
              ...recipe,
              scaling: 1 // Default scaling for old format
            })
          }
        }
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
      // Use safer approach to clear current plans
      const allPlans = await this.db.weeklyPlans.toArray()
      const currentPlans = allPlans.filter(plan => 
        plan.is_current === true || plan.is_current === 1
      )
      
      console.log('Found current plans to clear:', currentPlans.length)
      
      for (const plan of currentPlans) {
        await this.db.weeklyPlans.update(plan.id, { is_current: false })
      }

      // Set specified plan as current
      const result = await this.db.weeklyPlans.update(id, { is_current: true })

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
        let meals = []

        // Handle new format (meals array with scaling)
        if (plan.meals && plan.meals.length > 0) {
          meals = plan.meals
        }
        // Handle old format (meal_ids array) for backwards compatibility
        else if (plan.meal_ids && plan.meal_ids.length > 0) {
          for (const mealId of plan.meal_ids) {
            const recipe = await recipeService.getById(mealId)
            if (recipe) {
              meals.push({
                ...recipe,
                scaling: 1 // Default scaling for old format
              })
            }
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

// Export singleton instance
export const weeklyPlanService = new WeeklyPlanService()