import { getDatabase } from './db.js'

class RecipeService {
  constructor() {
    this.db = getDatabase()
  }

  // Get all recipes
  async getAll() {
    try {
      const recipes = await this.db.recipes.orderBy('created_at').reverse().toArray()
      return recipes.map(recipe => ({
        ...recipe,
        tags: recipe.tags || [],
        ingredients: recipe.ingredients || [],
        instructions: recipe.instructions || [],
        prep_time: recipe.prep_time || null,
        cook_time: recipe.cook_time || null,
        servings: recipe.servings || null
      }))
    } catch (error) {
      console.error('Failed to get recipes:', error)
      return []
    }
  }

  // Get recipe by ID
  async getById(id) {
    try {
      const recipe = await this.db.recipes.get(id)
      if (!recipe) return null

      return {
        ...recipe,
        tags: recipe.tags || [],
        ingredients: recipe.ingredients || [],
        instructions: recipe.instructions || [],
        prep_time: recipe.prep_time || null,
        cook_time: recipe.cook_time || null,
        servings: recipe.servings || null
      }
    } catch (error) {
      console.error('Failed to get recipe by ID:', error)
      return null
    }
  }

  // Add new recipe
  async add(recipe) {
    try {
      const now = new Date().toISOString()
      const id = await this.db.recipes.add({
        name: recipe.name,
        url: recipe.url || null,
        tags: recipe.tags || [],
        cuisine_tags: recipe.cuisine_tags || [],
        ingredient_tags: recipe.ingredient_tags || [],
        convenience_tags: recipe.convenience_tags || [],
        ingredients: recipe.ingredients || [],
        instructions: recipe.instructions || [],
        prep_time: recipe.prep_time || null,
        cook_time: recipe.cook_time || null,
        servings: recipe.servings || null,
        created_at: now,
        updated_at: now
      })

      return this.getById(id)
    } catch (error) {
      console.error('Failed to add recipe:', error)
      throw error
    }
  }

  // Update recipe
  async update(id, updates) {
    try {
      const updateData = {
        name: updates.name,
        url: updates.url || null,
        tags: updates.tags || [],
        cuisine_tags: updates.cuisine_tags || [],
        ingredient_tags: updates.ingredient_tags || [],
        convenience_tags: updates.convenience_tags || [],
        ingredients: updates.ingredients || [],
        instructions: updates.instructions || [],
        prep_time: updates.prep_time || null,
        cook_time: updates.cook_time || null,
        servings: updates.servings || null,
        updated_at: new Date().toISOString()
      }

      const result = await this.db.recipes.update(id, updateData)

      if (result === 0) {
        throw new Error('Recipe not found or no changes made')
      }

      return this.getById(id)
    } catch (error) {
      console.error('Failed to update recipe:', error)
      throw error
    }
  }

  // Delete recipe
  async delete(id) {
    try {
      const result = await this.db.recipes.delete(id)
      return result > 0
    } catch (error) {
      console.error('Failed to delete recipe:', error)
      throw error
    }
  }

  // Bulk insert recipes (for CSV import)
  async bulkInsert(recipes) {
    try {
      const now = new Date().toISOString()
      const recipesToInsert = recipes.map(recipe => ({
        name: recipe.name,
        url: recipe.url || null,
        tags: recipe.tags || [],
        ingredients: recipe.ingredients || [],
        instructions: recipe.instructions || [],
        prep_time: recipe.prep_time || null,
        cook_time: recipe.cook_time || null,
        servings: recipe.servings || null,
        created_at: now,
        updated_at: now
      }))

      const results = await this.db.recipes.bulkAdd(recipesToInsert, { allKeys: true })
      console.log(`Successfully inserted ${results.length} recipes`)
      return results
    } catch (error) {
      console.error('Failed to bulk insert recipes:', error)
      throw error
    }
  }

  // Search recipes by name or tags
  async search(query) {
    try {
      const allRecipes = await this.getAll()
      const lowerQuery = query.toLowerCase()

      return allRecipes.filter(recipe => {
        const nameMatch = recipe.name.toLowerCase().includes(lowerQuery)
        const tagsMatch = recipe.tags.some(tag => tag.toLowerCase().includes(lowerQuery))
        return nameMatch || tagsMatch
      })
    } catch (error) {
      console.error('Failed to search recipes:', error)
      return []
    }
  }

  // Get all unique tags
  async getAllTags() {
    try {
      const recipes = await this.getAll()
      const allTags = recipes.flatMap(recipe => recipe.tags || [])
      return [...new Set(allTags)].sort()
    } catch (error) {
      console.error('Failed to get all tags:', error)
      return []
    }
  }
}

// Export singleton instance
export const recipeService = new RecipeService()