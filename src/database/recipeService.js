import { getDatabase } from './db.js'
import { validateNumericField, validateArrayField, validateStringField } from '../utils/schemaValidation.js'
import { withErrorHandling, createSuccessResponse, ERROR_CODES, ERROR_TYPES } from '../utils/errorHandling.js'
import { validateRecipe } from '../utils/dataValidation.js'

class RecipeService {
  constructor() {
    this.db = getDatabase()
  }

  // Normalize recipe data to ensure consistent format
  normalizeRecipe(recipe) {
    return {
      ...recipe,
      tags: validateArrayField(recipe.tags, 'tags'),
      cuisine_tags: validateArrayField(recipe.cuisine_tags, 'cuisine_tags'),
      ingredient_tags: validateArrayField(recipe.ingredient_tags, 'ingredient_tags'),
      convenience_tags: validateArrayField(recipe.convenience_tags, 'convenience_tags'),
      ingredients: validateArrayField(recipe.ingredients, 'ingredients'),
      instructions: validateArrayField(recipe.instructions, 'instructions'),
      prep_time: validateNumericField(recipe.prep_time, 'prep_time'),
      cook_time: validateNumericField(recipe.cook_time, 'cook_time'),
      servings: validateNumericField(recipe.servings, 'servings'),
      url: validateStringField(recipe.url, 'url', false)
    }
  }

  // Get all recipes
  async getAll() {
    try {
      const recipes = await this.db.recipes.orderBy('created_at').reverse().toArray()
      return recipes.map(recipe => this.normalizeRecipe(recipe))
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

      return this.normalizeRecipe(recipe)
    } catch (error) {
      console.error('Failed to get recipe by ID:', error)
      return null
    }
  }

  // Add new recipe
  async add(recipe) {
    try {
      // Validate recipe data using comprehensive validation
      const validationResult = validateRecipe(recipe)
      if (!validationResult.isValid) {
        throw new Error(`Validation failed: ${validationResult.errors.join(', ')}`)
      }

      const validatedRecipe = validationResult.data
      const now = new Date().toISOString()
      
      const normalizedRecipe = {
        name: validatedRecipe.name,
        url: validatedRecipe.url || null,
        tags: validatedRecipe.tags || [],
        cuisine_tags: validatedRecipe.cuisine_tags || [],
        ingredient_tags: validatedRecipe.ingredient_tags || [],
        convenience_tags: validatedRecipe.convenience_tags || [],
        ingredients: validatedRecipe.ingredients || [],
        instructions: validatedRecipe.instructions || [],
        prep_time: validatedRecipe.prep_time || null,
        cook_time: validatedRecipe.cook_time || null,
        servings: validatedRecipe.servings || null,
        created_at: now,
        updated_at: now
      }

      const id = await this.db.recipes.add(normalizedRecipe)
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
        name: updates.name ? validateStringField(updates.name, 'name', true) : undefined,
        url: validateStringField(updates.url, 'url', false),
        tags: validateArrayField(updates.tags, 'tags'),
        cuisine_tags: validateArrayField(updates.cuisine_tags, 'cuisine_tags'),
        ingredient_tags: validateArrayField(updates.ingredient_tags, 'ingredient_tags'),
        convenience_tags: validateArrayField(updates.convenience_tags, 'convenience_tags'),
        ingredients: validateArrayField(updates.ingredients, 'ingredients'),
        instructions: validateArrayField(updates.instructions, 'instructions'),
        prep_time: validateNumericField(updates.prep_time, 'prep_time'),
        cook_time: validateNumericField(updates.cook_time, 'cook_time'),
        servings: validateNumericField(updates.servings, 'servings'),
        updated_at: new Date().toISOString()
      }

      // Remove undefined values
      Object.keys(updateData).forEach(key => {
        if (updateData[key] === undefined) {
          delete updateData[key]
        }
      })

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
      // Check if recipe exists first
      const existingRecipe = await this.db.recipes.get(id)
      if (!existingRecipe) {
        return false
      }
      
      await this.db.recipes.delete(id)
      return true
    } catch (error) {
      console.error('Failed to delete recipe:', error)
      throw error
    }
  }

  // Bulk insert recipes (for CSV import)
  async bulkInsert(recipes) {
    try {
      const now = new Date().toISOString()
      const recipesToInsert = recipes.map(recipe => {
        const name = validateStringField(recipe.name, 'name', true)
        if (!name) {
          throw new Error(`Recipe name is required for recipe: ${JSON.stringify(recipe)}`)
        }
        
        return {
          name: name,
          url: validateStringField(recipe.url, 'url', false),
          tags: validateArrayField(recipe.tags, 'tags'),
          cuisine_tags: validateArrayField(recipe.cuisine_tags, 'cuisine_tags'),
          ingredient_tags: validateArrayField(recipe.ingredient_tags, 'ingredient_tags'),
          convenience_tags: validateArrayField(recipe.convenience_tags, 'convenience_tags'),
          ingredients: validateArrayField(recipe.ingredients, 'ingredients'),
          instructions: validateArrayField(recipe.instructions, 'instructions'),
          prep_time: validateNumericField(recipe.prep_time, 'prep_time'),
          cook_time: validateNumericField(recipe.cook_time, 'cook_time'),
          servings: validateNumericField(recipe.servings, 'servings'),
          created_at: now,
          updated_at: now
        }
      })

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
      // Return empty array for empty or invalid queries
      if (!query || typeof query !== 'string' || query.trim() === '') {
        return []
      }

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
      if (recipes.length === 0) {
        return []
      }
      
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