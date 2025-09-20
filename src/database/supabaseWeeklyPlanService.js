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
      console.log('📋 Fetching all weekly plans for user:', userId)
      
      const { data, error } = await supabase
        .from(this.tableName)
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('❌ Error fetching weekly plans:', error)
        throw error
      }
      
      console.log('📋 Retrieved weekly plans:', data?.length || 0, 'plans')
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
      console.log('🔍 Looking for current plan for user:', userId)
      
      // First, let's try to get all plans to see what we have
      const { data: allPlans, error: allError } = await supabase
        .from(this.tableName)
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })

      if (allError) {
        console.error('❌ Error fetching all plans:', allError)
        throw allError
      }

      console.log('📋 All plans for user:', allPlans?.length || 0, 'plans')
      if (allPlans && allPlans.length > 0) {
        console.log('📋 Sample plan structure:', allPlans[0])
      }

      // Now try to get current plan - handle the case where is_current column might not exist
      let currentPlan = null
      try {
        const { data, error } = await supabase
          .from(this.tableName)
          .select('*')
          .eq('user_id', userId)
          .eq('is_current', true)
          .single()

        if (error && error.code !== 'PGRST116') {
          console.warn('⚠️ Error fetching current plan (is_current column issue):', error)
          // Fallback: get the most recent plan
          if (allPlans && allPlans.length > 0) {
            currentPlan = allPlans[0] // Most recent plan
            console.log('🔄 Using most recent plan as current:', currentPlan)
          }
        } else {
          currentPlan = data
        }
      } catch (err) {
        console.warn('⚠️ Exception fetching current plan:', err)
        // Fallback: get the most recent plan
        if (allPlans && allPlans.length > 0) {
          currentPlan = allPlans[0] // Most recent plan
          console.log('🔄 Using most recent plan as current:', currentPlan)
        }
      }
      
      console.log('✅ Current plan result:', currentPlan)
      return currentPlan || null
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

      // Use the stored meal data directly since it's already complete
      const meals = currentPlan.meals || []

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
      console.log('💾 Saving weekly plan to Supabase:', {
        userId,
        setAsCurrent,
        mealsCount: weeklyPlan.meals?.length || 0,
        notes: weeklyPlan.notes
      })

      // Clear existing current plans if setting as current
      if (setAsCurrent) {
        console.log('🔄 Clearing existing current plans...')
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

      console.log('🍽️ Prepared meals for saving:', meals)

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

      if (error) {
        console.error('❌ Supabase insert error:', error)
        throw error
      }
      
      console.log('✅ Successfully saved weekly plan:', data)
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
        // Use the stored meal data directly since it's already complete
        const meals = plan.meals || []

        plansWithRecipes.push({
          id: plan.id,
          meals,
          notes: plan.notes || '',
          is_current: plan.is_current,
          created_at: plan.created_at
        })
      }

      console.log('📋 Retrieved plans with recipes:', plansWithRecipes.length, 'plans')
      return plansWithRecipes
    } catch (error) {
      console.error('Failed to get all weekly plans with recipes:', error)
      return []
    }
  }
}

export const supabaseWeeklyPlanService = new SupabaseWeeklyPlanService()
