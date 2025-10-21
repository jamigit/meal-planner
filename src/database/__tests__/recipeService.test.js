/**
 * @fileoverview Unit tests for IndexedDB Recipe Service
 * 
 * Tests the recipeService.js implementation using fake-indexeddb
 * to ensure all CRUD operations work correctly.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { recipeService } from '@/database/recipeService.js'
import { cleanupTestData, createTestRecipe } from '@/tests/setup.js'
import { testRecipes } from '@/tests/fixtures/testData.js'

describe('RecipeService (IndexedDB)', () => {
  beforeEach(async () => {
    await cleanupTestData()
    // Wait for IndexedDB to be ready
    await new Promise(resolve => setTimeout(resolve, 100))
  })

  afterEach(async () => {
    await cleanupTestData()
  })

  describe('getAll', () => {
    it('should return empty array when no recipes exist', async () => {
      const recipes = await recipeService.getAll()
      expect(recipes).toEqual([])
    })

    it('should return all recipes ordered by created_at desc', async () => {
      // Add test recipes
      await recipeService.add(testRecipes[0])
      await recipeService.add(testRecipes[1])
      await recipeService.add(testRecipes[2])

      const recipes = await recipeService.getAll()
      expect(recipes).toHaveLength(3)
      expect(recipes[0].name).toBe(testRecipes[2].name) // Most recent first
      expect(recipes[1].name).toBe(testRecipes[1].name)
      expect(recipes[2].name).toBe(testRecipes[0].name)
    })

    it('should normalize array fields to empty arrays', async () => {
      const recipe = createTestRecipe({
        tags: null,
        cuisine_tags: undefined,
        ingredient_tags: [],
        convenience_tags: null,
        ingredients: undefined,
        instructions: []
      })

      await recipeService.add(recipe)
      const recipes = await recipeService.getAll()
      
      expect(recipes[0].tags).toEqual([])
      expect(recipes[0].cuisine_tags).toEqual([])
      expect(recipes[0].ingredient_tags).toEqual([])
      expect(recipes[0].convenience_tags).toEqual([])
      expect(recipes[0].ingredients).toEqual([])
      expect(recipes[0].instructions).toEqual([])
    })

    it('should normalize numeric fields to null', async () => {
      const recipe = createTestRecipe({
        prep_time: 0,
        cook_time: -5,
        servings: 'invalid'
      })

      await recipeService.add(recipe)
      const recipes = await recipeService.getAll()
      
      expect(recipes[0].prep_time).toBeNull()
      expect(recipes[0].cook_time).toBeNull()
      expect(recipes[0].servings).toBeNull()
    })
  })

  describe('getById', () => {
    it('should return null for non-existent recipe', async () => {
      const recipe = await recipeService.getById(999)
      expect(recipe).toBeNull()
    })

    it('should return recipe with normalized fields', async () => {
      const recipeData = createTestRecipe()
      const addedRecipe = await recipeService.add(recipeData)
      
      const recipe = await recipeService.getById(addedRecipe.id)
      expect(recipe).toBeDefined()
      expect(recipe.id).toBe(addedRecipe.id)
      expect(recipe.name).toBe(recipeData.name)
      expect(recipe.tags).toEqual(recipeData.tags)
      expect(recipe.created_at).toBeDefined()
      expect(recipe.updated_at).toBeDefined()
    })
  })

  describe('add', () => {
    it('should add recipe with all required fields', async () => {
      const recipeData = createTestRecipe()
      const recipe = await recipeService.add(recipeData)
      
      expect(recipe).toBeDefined()
      expect(recipe.id).toBeDefined()
      expect(recipe.name).toBe(recipeData.name)
      expect(recipe.url).toBe(recipeData.url)
      expect(recipe.created_at).toBeDefined()
      expect(recipe.updated_at).toBeDefined()
    })

    it('should add recipe with minimal data', async () => {
      const recipeData = {
        name: 'Simple Recipe'
      }
      
      const recipe = await recipeService.add(recipeData)
      
      expect(recipe.name).toBe('Simple Recipe')
      expect(recipe.url).toBeNull()
      expect(recipe.tags).toEqual([])
      expect(recipe.ingredients).toEqual([])
      expect(recipe.instructions).toEqual([])
    })

    it('should throw error for invalid recipe data', async () => {
      await expect(recipeService.add(null)).rejects.toThrow()
      await expect(recipeService.add({})).rejects.toThrow()
      await expect(recipeService.add({ name: '' })).rejects.toThrow()
    })

    it('should handle URL normalization', async () => {
      const recipeData = createTestRecipe({
        url: '  https://example.com/recipe  '
      })
      
      const recipe = await recipeService.add(recipeData)
      expect(recipe.url).toBe('https://example.com/recipe')
    })
  })

  describe('update', () => {
    it('should update existing recipe', async () => {
      const recipeData = createTestRecipe()
      const addedRecipe = await recipeService.add(recipeData)
      
      const updates = {
        name: 'Updated Recipe Name',
        prep_time: 30,
        servings: 6
      }
      
      const updatedRecipe = await recipeService.update(addedRecipe.id, updates)
      
      expect(updatedRecipe.name).toBe('Updated Recipe Name')
      expect(updatedRecipe.prep_time).toBe(30)
      expect(updatedRecipe.servings).toBe(6)
      expect(updatedRecipe.updated_at).not.toBe(addedRecipe.updated_at)
    })

    it('should throw error for non-existent recipe', async () => {
      const updates = { name: 'New Name' }
      
      await expect(recipeService.update(999, updates)).rejects.toThrow('Recipe not found')
    })

    it('should normalize updated fields', async () => {
      const recipeData = createTestRecipe()
      const addedRecipe = await recipeService.add(recipeData)
      
      const updates = {
        tags: null,
        ingredients: undefined,
        prep_time: 0
      }
      
      const updatedRecipe = await recipeService.update(addedRecipe.id, updates)
      
      expect(updatedRecipe.tags).toEqual([])
      expect(updatedRecipe.ingredients).toEqual([])
      expect(updatedRecipe.prep_time).toBeNull()
    })
  })

  describe('delete', () => {
    it('should delete existing recipe', async () => {
      const recipeData = createTestRecipe()
      const addedRecipe = await recipeService.add(recipeData)
      
      const result = await recipeService.delete(addedRecipe.id)
      expect(result).toBe(true)
      
      const deletedRecipe = await recipeService.getById(addedRecipe.id)
      expect(deletedRecipe).toBeNull()
    })

    it('should return false for non-existent recipe', async () => {
      const result = await recipeService.delete(999)
      expect(result).toBe(false)
    })
  })

  describe('bulkInsert', () => {
    it('should insert multiple recipes', async () => {
      const recipes = [testRecipes[0], testRecipes[1], testRecipes[2]]
      
      const results = await recipeService.bulkInsert(recipes)
      
      expect(results).toHaveLength(3)
      
      const allRecipes = await recipeService.getAll()
      expect(allRecipes).toHaveLength(3)
    })

    it('should handle empty array', async () => {
      const results = await recipeService.bulkInsert([])
      expect(results).toEqual([])
    })

    it('should normalize all recipes in bulk insert', async () => {
      const recipes = [
        createTestRecipe({ tags: null, prep_time: 0 }),
        createTestRecipe({ ingredients: undefined, cook_time: -5 })
      ]
      
      await recipeService.bulkInsert(recipes)
      const allRecipes = await recipeService.getAll()
      
      expect(allRecipes[0].tags).toEqual([])
      expect(allRecipes[0].prep_time).toBeNull()
      expect(allRecipes[1].ingredients).toEqual([])
      expect(allRecipes[1].cook_time).toBeNull()
    })
  })

  describe('search', () => {
    beforeEach(async () => {
      // Add test recipes for search
      await recipeService.add(testRecipes[0]) // Chicken Parmesan
      await recipeService.add(testRecipes[1]) // Thai Green Curry
      await recipeService.add(testRecipes[2]) // Quick Pasta Salad
    })

    it('should search by recipe name', async () => {
      const results = await recipeService.search('chicken')
      expect(results).toHaveLength(1)
      expect(results[0].name).toBe('Chicken Parmesan')
    })

    it('should search by tags', async () => {
      const results = await recipeService.search('italian')
      expect(results).toHaveLength(2) // Chicken Parmesan and Quick Pasta Salad
    })

    it('should be case insensitive', async () => {
      const results = await recipeService.search('CHICKEN')
      expect(results).toHaveLength(1)
    })

    it('should return empty array for no matches', async () => {
      const results = await recipeService.search('nonexistent')
      expect(results).toEqual([])
    })

    it('should handle empty search query', async () => {
      const results = await recipeService.search('')
      expect(results).toEqual([])
    })
  })

  describe('getAllTags', () => {
    beforeEach(async () => {
      await recipeService.add(testRecipes[0])
      await recipeService.add(testRecipes[1])
      await recipeService.add(testRecipes[2])
    })

    it('should return all unique tags sorted alphabetically', async () => {
      const tags = await recipeService.getAllTags()
      
      expect(tags).toContain('chicken')
      expect(tags).toContain('italian')
      expect(tags).toContain('quick')
      expect(tags).toContain('thai')
      expect(tags).toContain('vegetarian')
      
      // Check sorting
      const sortedTags = [...tags].sort()
      expect(tags).toEqual(sortedTags)
    })

    it('should return empty array when no recipes exist', async () => {
      const tags = await recipeService.getAllTags()
      expect(tags).toEqual([])
    })

    it('should deduplicate tags', async () => {
      // Add recipe with duplicate tags
      await recipeService.add(createTestRecipe({
        name: 'Another Italian Recipe',
        tags: ['italian', 'pasta', 'quick']
      }))
      
      const tags = await recipeService.getAllTags()
      const italianCount = tags.filter(tag => tag === 'italian').length
      expect(italianCount).toBe(1)
    })
  })

  describe('error handling', () => {
    it('should handle database errors gracefully', async () => {
      // Mock database error
      const originalDb = recipeService.db
      recipeService.db = {
        recipes: {
          add: vi.fn().mockRejectedValue(new Error('Database error'))
        }
      }
      
      await expect(recipeService.add(createTestRecipe())).rejects.toThrow('Database error')
      
      // Restore original database
      recipeService.db = originalDb
    })

    it('should return empty array on getAll error', async () => {
      const originalDb = recipeService.db
      recipeService.db = {
        recipes: {
          orderBy: vi.fn().mockRejectedValue(new Error('Database error'))
        }
      }
      
      const recipes = await recipeService.getAll()
      expect(recipes).toEqual([])
      
      // Restore original database
      recipeService.db = originalDb
    })
  })
})
