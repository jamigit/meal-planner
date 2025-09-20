import { supabase } from '../lib/supabase.js'
import { authService } from '../services/authService.js'

class SupabaseRecipeService {
  constructor() {
    this.tableName = 'recipes'
  }

  async getUserId() {
    const user = await authService.getCurrentUser()
    if (!user) throw new Error('User not authenticated')
    return user.id
  }

  // Get all recipes for current user
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
      console.error('Failed to get recipes:', error)
      return []
    }
  }

  // Get recipe by ID
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
      console.error('Failed to get recipe by ID:', error)
      return null
    }
  }

  // Add new recipe
  async add(recipe) {
    try {
      const userId = await this.getUserId()
      const { data, error } = await supabase
        .from(this.tableName)
        .insert({
          user_id: userId,
          name: recipe.name,
          url: recipe.url || null,
          ingredients: recipe.ingredients || [],
          instructions: recipe.instructions || [],
          prep_time: recipe.prep_time || null,
          cook_time: recipe.cook_time || null,
          servings: recipe.servings || null,
          cuisine_tags: recipe.cuisine_tags || [],
          ingredient_tags: recipe.ingredient_tags || [],
          convenience_tags: recipe.convenience_tags || [],
          tags: recipe.tags || []
        })
        .select()
        .single()

      if (error) throw error
      return data
    } catch (error) {
      console.error('Failed to add recipe:', error)
      throw error
    }
  }

  // Update recipe
  async update(id, updates) {
    try {
      const userId = await this.getUserId()
      const { data, error } = await supabase
        .from(this.tableName)
        .update({
          name: updates.name,
          url: updates.url || null,
          ingredients: updates.ingredients || [],
          instructions: updates.instructions || [],
          prep_time: updates.prep_time || null,
          cook_time: updates.cook_time || null,
          servings: updates.servings || null,
          cuisine_tags: updates.cuisine_tags || [],
          ingredient_tags: updates.ingredient_tags || [],
          convenience_tags: updates.convenience_tags || [],
          tags: updates.tags || [],
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .eq('user_id', userId)
        .select()
        .single()

      if (error) throw error
      return data
    } catch (error) {
      console.error('Failed to update recipe:', error)
      throw error
    }
  }

  // Delete recipe
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
      console.error('Failed to delete recipe:', error)
      throw error
    }
  }

  // Search recipes
  async search(query) {
    try {
      const userId = await this.getUserId()
      const { data, error } = await supabase
        .from(this.tableName)
        .select('*')
        .eq('user_id', userId)
        .or(`name.ilike.%${query}%,tags.cs.{${query}}`)
        .order('created_at', { ascending: false })

      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Failed to search recipes:', error)
      return []
    }
  }

  // Get all unique tags
  async getAllTags() {
    try {
      const userId = await this.getUserId()
      const { data, error } = await supabase
        .from(this.tableName)
        .select('tags')
        .eq('user_id', userId)

      if (error) throw error
      
      const allTags = data.flatMap(recipe => recipe.tags || [])
      return [...new Set(allTags)].sort()
    } catch (error) {
      console.error('Failed to get all tags:', error)
      return []
    }
  }

  // Bulk insert recipes (for CSV import)
  async bulkInsert(recipes) {
    try {
      const userId = await this.getUserId()
      const recipesToInsert = recipes.map(recipe => ({
        user_id: userId,
        name: recipe.name,
        url: recipe.url || null,
        ingredients: recipe.ingredients || [],
        instructions: recipe.instructions || [],
        prep_time: recipe.prep_time || null,
        cook_time: recipe.cook_time || null,
        servings: recipe.servings || null,
        cuisine_tags: recipe.cuisine_tags || [],
        ingredient_tags: recipe.ingredient_tags || [],
        convenience_tags: recipe.convenience_tags || [],
        tags: recipe.tags || []
      }))

      const { data, error } = await supabase
        .from(this.tableName)
        .insert(recipesToInsert)
        .select()

      if (error) throw error
      console.log(`Successfully inserted ${data.length} recipes`)
      return data
    } catch (error) {
      console.error('Failed to bulk insert recipes:', error)
      throw error
    }
  }
}

export const supabaseRecipeService = new SupabaseRecipeService()
