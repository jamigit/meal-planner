/**
 * @fileoverview Tag management service for CRUD operations on recipe tags
 * 
 * Provides functionality to rename, delete, add, and merge tags across the system.
 * Handles both IndexedDB and Supabase backends through serviceSelector.
 */

import { serviceSelector } from './serviceSelector.js'
import { TAG_TAXONOMY } from '../constants/recipeTags.js'

class TagManagementService {
  constructor() {
    this.recipeService = null
  }

  async getRecipeService() {
    if (!this.recipeService) {
      this.recipeService = await serviceSelector.getRecipeService()
    }
    return this.recipeService
  }

  /**
   * Get all tags with usage statistics
   * @returns {Promise<Object>} Tag usage statistics by category
   */
  async getAllTagsWithUsage() {
    try {
      const recipeService = await this.getRecipeService()
      const recipes = await recipeService.getAll()
      
      const usage = {
        cuisine_tags: {},
        ingredient_tags: {},
        convenience_tags: {},
        dietary_tags: {}
      }

      // Count usage for each tag
      recipes.forEach(recipe => {
        Object.keys(usage).forEach(category => {
          const tags = recipe[category] || []
          tags.forEach(tag => {
            usage[category][tag] = (usage[category][tag] || 0) + 1
          })
        })
      })

      return {
        success: true,
        data: usage
      }
    } catch (error) {
      console.error('Error getting tag usage:', error)
      return {
        success: false,
        error: error.message
      }
    }
  }

  /**
   * Rename a tag across all recipes
   * @param {string} category - Tag category (cuisine_tags, ingredient_tags, etc.)
   * @param {string} oldName - Current tag name
   * @param {string} newName - New tag name
   * @returns {Promise<Object>} Result with recipes affected count
   */
  async renameTag(category, oldName, newName) {
    try {
      // Validate inputs
      if (!category || !oldName || !newName) {
        return {
          success: false,
          error: 'Category, old name, and new name are required'
        }
      }

      if (!TAG_TAXONOMY[category]) {
        return {
          success: false,
          error: `Invalid category: ${category}`
        }
      }

      if (oldName === newName) {
        return {
          success: true,
          recipesAffected: 0,
          message: 'No change needed'
        }
      }

      // Check if new name already exists
      if (TAG_TAXONOMY[category].includes(newName)) {
        return {
          success: false,
          error: `Tag "${newName}" already exists in ${category}`
        }
      }

      const recipeService = await this.getRecipeService()
      const recipes = await recipeService.getAll()
      
      let recipesAffected = 0
      const updatedRecipes = []

      // Find and update recipes with the old tag
      recipes.forEach(recipe => {
        const tags = recipe[category] || []
        const tagIndex = tags.indexOf(oldName)
        
        if (tagIndex !== -1) {
          const updatedRecipe = { ...recipe }
          updatedRecipe[category] = [...tags]
          updatedRecipe[category][tagIndex] = newName
          updatedRecipes.push(updatedRecipe)
          recipesAffected++
        }
      })

      // Update recipes in database
      for (const recipe of updatedRecipes) {
        await recipeService.update(recipe.id, recipe)
      }

      // Update taxonomy
      const taxonomyIndex = TAG_TAXONOMY[category].indexOf(oldName)
      if (taxonomyIndex !== -1) {
        TAG_TAXONOMY[category][taxonomyIndex] = newName
      }

      return {
        success: true,
        recipesAffected,
        message: `Renamed "${oldName}" to "${newName}" in ${recipesAffected} recipes`
      }
    } catch (error) {
      console.error('Error renaming tag:', error)
      return {
        success: false,
        error: error.message
      }
    }
  }

  /**
   * Delete a tag from all recipes
   * @param {string} category - Tag category
   * @param {string} tagName - Tag to delete
   * @param {string|null} replacementTag - Optional replacement tag
   * @returns {Promise<Object>} Result with recipes affected count
   */
  async deleteTag(category, tagName, replacementTag = null) {
    try {
      if (!category || !tagName) {
        return {
          success: false,
          error: 'Category and tag name are required'
        }
      }

      const recipeService = await this.getRecipeService()
      const recipes = await recipeService.getAll()
      
      let recipesAffected = 0
      const updatedRecipes = []

      // Find and update recipes with the tag
      recipes.forEach(recipe => {
        const tags = recipe[category] || []
        const tagIndex = tags.indexOf(tagName)
        
        if (tagIndex !== -1) {
          const updatedRecipe = { ...recipe }
          updatedRecipe[category] = [...tags]
          
          if (replacementTag) {
            // Replace with another tag
            updatedRecipe[category][tagIndex] = replacementTag
          } else {
            // Remove the tag
            updatedRecipe[category].splice(tagIndex, 1)
          }
          
          updatedRecipes.push(updatedRecipe)
          recipesAffected++
        }
      })

      // Update recipes in database
      for (const recipe of updatedRecipes) {
        await recipeService.update(recipe.id, recipe)
      }

      // Remove from taxonomy
      const taxonomyIndex = TAG_TAXONOMY[category].indexOf(tagName)
      if (taxonomyIndex !== -1) {
        TAG_TAXONOMY[category].splice(taxonomyIndex, 1)
      }

      const action = replacementTag ? `replaced with "${replacementTag}"` : 'removed'
      return {
        success: true,
        recipesAffected,
        message: `Tag "${tagName}" ${action} in ${recipesAffected} recipes`
      }
    } catch (error) {
      console.error('Error deleting tag:', error)
      return {
        success: false,
        error: error.message
      }
    }
  }

  /**
   * Merge multiple tags into one
   * @param {string} category - Tag category
   * @param {string[]} sourceTags - Tags to merge from
   * @param {string} targetTag - Tag to merge into
   * @returns {Promise<Object>} Result with recipes affected count
   */
  async mergeTags(category, sourceTags, targetTag) {
    try {
      if (!category || !sourceTags?.length || !targetTag) {
        return {
          success: false,
          error: 'Category, source tags, and target tag are required'
        }
      }

      if (!TAG_TAXONOMY[category].includes(targetTag)) {
        return {
          success: false,
          error: `Target tag "${targetTag}" does not exist in ${category}`
        }
      }

      const recipeService = await this.getRecipeService()
      const recipes = await recipeService.getAll()
      
      let recipesAffected = 0
      const updatedRecipes = []

      // Find and update recipes with source tags
      recipes.forEach(recipe => {
        const tags = recipe[category] || []
        let hasChanges = false
        const updatedTags = [...tags]

        sourceTags.forEach(sourceTag => {
          const tagIndex = updatedTags.indexOf(sourceTag)
          if (tagIndex !== -1) {
            // Replace source tag with target tag
            updatedTags[tagIndex] = targetTag
            hasChanges = true
          }
        })

        if (hasChanges) {
          // Remove duplicates
          const uniqueTags = [...new Set(updatedTags)]
          
          const updatedRecipe = { ...recipe }
          updatedRecipe[category] = uniqueTags
          updatedRecipes.push(updatedRecipe)
          recipesAffected++
        }
      })

      // Update recipes in database
      for (const recipe of updatedRecipes) {
        await recipeService.update(recipe.id, recipe)
      }

      // Remove source tags from taxonomy
      sourceTags.forEach(sourceTag => {
        const taxonomyIndex = TAG_TAXONOMY[category].indexOf(sourceTag)
        if (taxonomyIndex !== -1) {
          TAG_TAXONOMY[category].splice(taxonomyIndex, 1)
        }
      })

      return {
        success: true,
        recipesAffected,
        message: `Merged ${sourceTags.length} tags into "${targetTag}" in ${recipesAffected} recipes`
      }
    } catch (error) {
      console.error('Error merging tags:', error)
      return {
        success: false,
        error: error.message
      }
    }
  }

  /**
   * Add a new tag to the taxonomy
   * @param {string} category - Tag category
   * @param {string} tagName - New tag name
   * @returns {Promise<Object>} Result
   */
  async addNewTag(category, tagName) {
    try {
      if (!category || !tagName) {
        return {
          success: false,
          error: 'Category and tag name are required'
        }
      }

      if (!TAG_TAXONOMY[category]) {
        return {
          success: false,
          error: `Invalid category: ${category}`
        }
      }

      if (TAG_TAXONOMY[category].includes(tagName)) {
        return {
          success: false,
          error: `Tag "${tagName}" already exists in ${category}`
        }
      }

      // Add to taxonomy
      TAG_TAXONOMY[category].push(tagName)
      TAG_TAXONOMY[category].sort() // Keep sorted

      return {
        success: true,
        message: `Added "${tagName}" to ${category}`
      }
    } catch (error) {
      console.error('Error adding tag:', error)
      return {
        success: false,
        error: error.message
      }
    }
  }

  /**
   * Find orphaned tags (tags in recipes not in taxonomy)
   * @returns {Promise<Object>} Orphaned tags by category
   */
  async getOrphanedTags() {
    try {
      const recipeService = await this.getRecipeService()
      const recipes = await recipeService.getAll()
      
      const orphaned = {
        cuisine_tags: new Set(),
        ingredient_tags: new Set(),
        convenience_tags: new Set(),
        dietary_tags: new Set()
      }

      // Find tags in recipes that aren't in taxonomy
      recipes.forEach(recipe => {
        Object.keys(orphaned).forEach(category => {
          const recipeTags = recipe[category] || []
          recipeTags.forEach(tag => {
            if (!TAG_TAXONOMY[category].includes(tag)) {
              orphaned[category].add(tag)
            }
          })
        })
      })

      // Convert sets to arrays
      Object.keys(orphaned).forEach(category => {
        orphaned[category] = Array.from(orphaned[category]).sort()
      })

      return {
        success: true,
        data: orphaned
      }
    } catch (error) {
      console.error('Error finding orphaned tags:', error)
      return {
        success: false,
        error: error.message
      }
    }
  }

  /**
   * Validate tag name format
   * @param {string} tagName - Tag name to validate
   * @returns {Object} Validation result
   */
  validateTagName(tagName) {
    if (!tagName || typeof tagName !== 'string') {
      return {
        valid: false,
        error: 'Tag name must be a non-empty string'
      }
    }

    const trimmed = tagName.trim()
    
    if (trimmed.length === 0) {
      return {
        valid: false,
        error: 'Tag name cannot be empty'
      }
    }

    if (trimmed.length > 50) {
      return {
        valid: false,
        error: 'Tag name cannot exceed 50 characters'
      }
    }

    // Check for invalid characters
    const invalidChars = /[<>:"/\\|?*]/
    if (invalidChars.test(trimmed)) {
      return {
        valid: false,
        error: 'Tag name contains invalid characters'
      }
    }

    return {
      valid: true,
      normalized: trimmed
    }
  }

  /**
   * Get tag statistics
   * @returns {Object} Tag statistics
   */
  getTagStatistics() {
    const stats = {
      totalTags: 0,
      byCategory: {},
      totalCategories: Object.keys(TAG_TAXONOMY).length
    }

    Object.entries(TAG_TAXONOMY).forEach(([category, tags]) => {
      stats.byCategory[category] = tags.length
      stats.totalTags += tags.length
    })

    return stats
  }
}

export const tagManagementService = new TagManagementService()
