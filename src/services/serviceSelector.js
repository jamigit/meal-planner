// Service selector that automatically chooses between IndexedDB and Supabase
// based on authentication status and environment variables

import { recipeService } from '../database/recipeService.js'
import { weeklyPlanService } from '../database/weeklyPlanService.js'
import { mealHistoryService } from '../database/mealHistoryService.js'
import { supabaseRecipeService } from '../database/supabaseRecipeService.js'
import { supabaseWeeklyPlanService } from '../database/supabaseWeeklyPlanService.js'
import { supabaseMealHistoryService } from '../database/supabaseMealHistoryService.js'
import { authService } from './authService.js'
import { isSupabaseConfigured } from '../lib/supabase.js'

class ServiceSelector {
  constructor() {
    this.useSupabase = false
    this.checkSupabaseAvailability()
  }

  checkSupabaseAvailability() {
    // Check if Supabase is configured and user is authenticated
    this.useSupabase = isSupabaseConfigured() && authService.isAuthenticated()
    
    console.log('🔧 Service selector:', this.useSupabase ? 'Using Supabase' : 'Using IndexedDB')
  }

  async getRecipeService() {
    if (this.useSupabase && authService.isAuthenticated()) {
      return supabaseRecipeService
    }
    return recipeService
  }

  async getWeeklyPlanService() {
    if (this.useSupabase && authService.isAuthenticated()) {
      return supabaseWeeklyPlanService
    }
    return weeklyPlanService
  }

  async getMealHistoryService() {
    if (this.useSupabase && authService.isAuthenticated()) {
      return supabaseMealHistoryService
    }
    return mealHistoryService
  }

  // Helper method to get all services at once
  async getAllServices() {
    return {
      recipeService: await this.getRecipeService(),
      weeklyPlanService: await this.getWeeklyPlanService(),
      mealHistoryService: await this.getMealHistoryService()
    }
  }
}

export const serviceSelector = new ServiceSelector()
