// @ai-context: Service selector automatically chooses between IndexedDB and Supabase
// based on authentication status and environment variables
// This is the core abstraction layer for dual storage architecture

import { recipeService } from '../database/recipeService.js'
import { weeklyPlanService } from '../database/weeklyPlanService.js'
import { mealHistoryService } from '../database/mealHistoryService.js'
import { shoppingListService } from '../database/shoppingListService.js'
import { supabaseRecipeService } from '../database/supabaseRecipeService.js'
import { supabaseWeeklyPlanService } from '../database/supabaseWeeklyPlanService.js'
import { supabaseMealHistoryService } from '../database/supabaseMealHistoryService.js'
import { supabaseShoppingListService } from '../database/supabaseShoppingListService.js'
import { authService } from './authService.js'
import { isSupabaseConfigured } from '../lib/supabase.js'

class ServiceSelector {
  constructor() {
    this.useSupabase = false
    this.checkSupabaseAvailability()
  }

  checkSupabaseAvailability() {
    // @ai-context: Check if Supabase is configured and user is authenticated
    // This determines which storage backend to use
    this.useSupabase = isSupabaseConfigured() && authService.isAuthenticated()
    
    console.log('🔧 Service selector:', this.useSupabase ? 'Using Supabase' : 'Using IndexedDB')
  }

  // Method to update service selection when auth state changes
  updateServiceSelection() {
    this.checkSupabaseAvailability()
  }

  async getRecipeService() {
    // @ai-context: Always check current auth status for service selection
    // This ensures we use the correct storage backend based on current state
    const shouldUseSupabase = isSupabaseConfigured() && authService.isAuthenticated()
    console.log('🔧 Recipe service:', shouldUseSupabase ? 'Using Supabase' : 'Using IndexedDB')
    
    if (shouldUseSupabase) {
      return supabaseRecipeService
    }
    return recipeService
  }

  async getWeeklyPlanService() {
    // Always check current auth status
    const shouldUseSupabase = isSupabaseConfigured() && authService.isAuthenticated()
    console.log('🔧 Weekly plan service:', shouldUseSupabase ? 'Using Supabase' : 'Using IndexedDB')
    
    if (shouldUseSupabase) {
      return supabaseWeeklyPlanService
    }
    return weeklyPlanService
  }

  async getMealHistoryService() {
    // Always check current auth status
    const shouldUseSupabase = isSupabaseConfigured() && authService.isAuthenticated()
    console.log('🔧 Meal history service:', shouldUseSupabase ? 'Using Supabase' : 'Using IndexedDB')
    
    if (shouldUseSupabase) {
      return supabaseMealHistoryService
    }
    return mealHistoryService
  }

  async getShoppingListService() {
    // Always check current auth status
    const shouldUseSupabase = isSupabaseConfigured() && authService.isAuthenticated()
    console.log('🔧 Shopping list service:', shouldUseSupabase ? 'Using Supabase' : 'Using IndexedDB')
    
    if (shouldUseSupabase) {
      return supabaseShoppingListService
    }
    return shoppingListService
  }

  // Helper method to get all services at once
  async getAllServices() {
    return {
      recipeService: await this.getRecipeService(),
      weeklyPlanService: await this.getWeeklyPlanService(),
      mealHistoryService: await this.getMealHistoryService(),
      shoppingListService: await this.getShoppingListService()
    }
  }
}

export const serviceSelector = new ServiceSelector()
