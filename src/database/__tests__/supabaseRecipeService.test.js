/**
 * @fileoverview Unit tests for Supabase Recipe Service
 * 
 * Tests the supabaseRecipeService.js implementation using MSW
 * to mock Supabase API calls and ensure all CRUD operations work correctly.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { supabaseRecipeService } from '@/database/supabaseRecipeService.js'
import { authService } from '@/services/authService.js'
import { createTestRecipe, createTestUser } from '@/tests/setup.js'
import { testRecipes } from '@/tests/fixtures/testData.js'

describe('SupabaseRecipeService', () => {
  beforeEach(() => {
    // Mock authenticated user
    vi.mocked(authService.getCurrentUser).mockResolvedValue(createTestUser())
    vi.mocked(authService.isAuthenticated).mockReturnValue(true)
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('getAll', () => {
    it('should return all recipes for authenticated user', async () => {
      const recipes = await supabaseRecipeService.getAll()
      
      expect(recipes).toBeDefined()
      expect(Array.isArray(recipes)).toBe(true)
      expect(authService.getCurrentUser).toHaveBeenCalled()
    })

    it('should return empty array when no recipes exist', async () => {
      // Mock empty response
      const mockSupabase = await import('@/lib/supabase')
      vi.mocked(mockSupabase.supabase.from).mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: [], error: null })
      })

      const recipes = await supabaseRecipeService.getAll()
      expect(recipes).toEqual([])
    })

    it('should handle Supabase errors gracefully', async () => {
      // Mock error response
      const mockSupabase = await import('@/lib/supabase')
      vi.mocked(mockSupabase.supabase.from).mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: null, error: { message: 'Database error' } })
      })

      const recipes = await supabaseRecipeService.getAll()
      expect(recipes).toEqual([])
    })
  })

  describe('getById', () => {
    it('should return recipe by ID for authenticated user', async () => {
      const recipeId = 1
      
      // Mock successful response
      const mockSupabase = await import('@/lib/supabase')
      vi.mocked(mockSupabase.supabase.from).mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ 
          data: testRecipes[0], 
          error: null 
        })
      })

      const recipe = await supabaseRecipeService.getById(recipeId)
      
      expect(recipe).toBeDefined()
      expect(recipe.id).toBe(recipeId)
    })

    it('should return null for non-existent recipe', async () => {
      const recipeId = 999
      
      // Mock not found response
      const mockSupabase = await import('@/lib/supabase')
      vi.mocked(mockSupabase.supabase.from).mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ 
          data: null, 
          error: { code: 'PGRST116', message: 'No rows found' } 
        })
      })

      const recipe = await supabaseRecipeService.getById(recipeId)
      expect(recipe).toBeNull()
    })

    it('should throw error for authentication failure', async () => {
      vi.mocked(authService.getCurrentUser).mockRejectedValue(new Error('Not authenticated'))
      
      await expect(supabaseRecipeService.getById(1)).rejects.toThrow('User not authenticated')
    })
  })

  describe('add', () => {
    it('should add new recipe for authenticated user', async () => {
      const recipeData = createTestRecipe()
      
      // Mock successful insert
      const mockSupabase = await import('@/lib/supabase')
      vi.mocked(mockSupabase.supabase.from).mockReturnValue({
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ 
          data: { ...recipeData, id: 1, user_id: 'test-user-id' }, 
          error: null 
        })
      })

      const recipe = await supabaseRecipeService.add(recipeData)
      
      expect(recipe).toBeDefined()
      expect(recipe.id).toBe(1)
      expect(recipe.user_id).toBe('test-user-id')
    })

    it('should normalize recipe data before inserting', async () => {
      const recipeData = createTestRecipe({
        tags: null,
        cuisine_tags: undefined,
        ingredients: [],
        prep_time: 0
      })
      
      const mockSupabase = await import('@/lib/supabase')
      const mockInsert = vi.fn().mockReturnThis()
      vi.mocked(mockSupabase.supabase.from).mockReturnValue({
        insert: mockInsert,
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ 
          data: { ...recipeData, id: 1 }, 
          error: null 
        })
      })

      await supabaseRecipeService.add(recipeData)
      
      // Check that normalized data was passed to insert
      expect(mockInsert).toHaveBeenCalledWith(
        expect.objectContaining({
          tags: [],
          cuisine_tags: [],
          ingredients: [],
          prep_time: null
        })
      )
    })

    it('should throw error for authentication failure', async () => {
      vi.mocked(authService.getCurrentUser).mockRejectedValue(new Error('Not authenticated'))
      
      await expect(supabaseRecipeService.add(createTestRecipe())).rejects.toThrow('User not authenticated')
    })

    it('should throw error for Supabase insert failure', async () => {
      const recipeData = createTestRecipe()
      
      // Mock error response
      const mockSupabase = await import('@/lib/supabase')
      vi.mocked(mockSupabase.supabase.from).mockReturnValue({
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ 
          data: null, 
          error: { message: 'Insert failed' } 
        })
      })

      await expect(supabaseRecipeService.add(recipeData)).rejects.toThrow('Insert failed')
    })
  })

  describe('update', () => {
    it('should update existing recipe for authenticated user', async () => {
      const recipeId = 1
      const updates = {
        name: 'Updated Recipe Name',
        prep_time: 30
      }
      
      // Mock successful update
      const mockSupabase = await import('@/lib/supabase')
      vi.mocked(mockSupabase.supabase.from).mockReturnValue({
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ 
          data: { ...testRecipes[0], ...updates, id: recipeId }, 
          error: null 
        })
      })

      const recipe = await supabaseRecipeService.update(recipeId, updates)
      
      expect(recipe).toBeDefined()
      expect(recipe.name).toBe('Updated Recipe Name')
      expect(recipe.prep_time).toBe(30)
    })

    it('should normalize update data', async () => {
      const recipeId = 1
      const updates = {
        tags: null,
        ingredients: undefined,
        prep_time: 0
      }
      
      const mockSupabase = await import('@/lib/supabase')
      const mockUpdate = vi.fn().mockReturnThis()
      vi.mocked(mockSupabase.supabase.from).mockReturnValue({
        update: mockUpdate,
        eq: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ 
          data: testRecipes[0], 
          error: null 
        })
      })

      await supabaseRecipeService.update(recipeId, updates)
      
      // Check that normalized data was passed to update
      expect(mockUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          tags: [],
          ingredients: [],
          prep_time: null
        })
      )
    })

    it('should throw error for authentication failure', async () => {
      vi.mocked(authService.getCurrentUser).mockRejectedValue(new Error('Not authenticated'))
      
      await expect(supabaseRecipeService.update(1, { name: 'New Name' })).rejects.toThrow('User not authenticated')
    })
  })

  describe('delete', () => {
    it('should delete recipe for authenticated user', async () => {
      const recipeId = 1
      
      // Mock successful delete
      const mockSupabase = await import('@/lib/supabase')
      vi.mocked(mockSupabase.supabase.from).mockReturnValue({
        delete: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        mockResolvedValue: vi.fn().mockResolvedValue({ error: null })
      })

      const result = await supabaseRecipeService.delete(recipeId)
      expect(result).toBe(true)
    })

    it('should throw error for authentication failure', async () => {
      vi.mocked(authService.getCurrentUser).mockRejectedValue(new Error('Not authenticated'))
      
      await expect(supabaseRecipeService.delete(1)).rejects.toThrow('User not authenticated')
    })
  })

  describe('search', () => {
    it('should search recipes by name and tags', async () => {
      const query = 'chicken'
      
      // Mock search response
      const mockSupabase = await import('@/lib/supabase')
      vi.mocked(mockSupabase.supabase.from).mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        or: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ 
          data: [testRecipes[0]], 
          error: null 
        })
      })

      const results = await supabaseRecipeService.search(query)
      
      expect(results).toBeDefined()
      expect(Array.isArray(results)).toBe(true)
    })

    it('should return empty array on search error', async () => {
      const query = 'chicken'
      
      // Mock error response
      const mockSupabase = await import('@/lib/supabase')
      vi.mocked(mockSupabase.supabase.from).mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        or: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ 
          data: null, 
          error: { message: 'Search error' } 
        })
      })

      const results = await supabaseRecipeService.search(query)
      expect(results).toEqual([])
    })
  })

  describe('getAllTags', () => {
    it('should return all unique tags for authenticated user', async () => {
      // Mock tags response
      const mockSupabase = await import('@/lib/supabase')
      vi.mocked(mockSupabase.supabase.from).mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ 
          data: [
            { tags: ['italian', 'chicken'] },
            { tags: ['thai', 'spicy'] },
            { tags: ['italian', 'quick'] }
          ], 
          error: null 
        })
      })

      const tags = await supabaseRecipeService.getAllTags()
      
      expect(tags).toContain('italian')
      expect(tags).toContain('chicken')
      expect(tags).toContain('thai')
      expect(tags).toContain('spicy')
      expect(tags).toContain('quick')
      
      // Check deduplication
      const italianCount = tags.filter(tag => tag === 'italian').length
      expect(italianCount).toBe(1)
    })

    it('should return empty array when no recipes exist', async () => {
      // Mock empty response
      const mockSupabase = await import('@/lib/supabase')
      vi.mocked(mockSupabase.supabase.from).mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ 
          data: [], 
          error: null 
        })
      })

      const tags = await supabaseRecipeService.getAllTags()
      expect(tags).toEqual([])
    })
  })

  describe('bulkInsert', () => {
    it('should insert multiple recipes', async () => {
      const recipes = [testRecipes[0], testRecipes[1]]
      
      // Mock successful bulk insert
      const mockSupabase = await import('@/lib/supabase')
      vi.mocked(mockSupabase.supabase.from).mockReturnValue({
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockResolvedValue({ 
          data: recipes.map((r, i) => ({ ...r, id: i + 1, user_id: 'test-user-id' })), 
          error: null 
        })
      })

      const results = await supabaseRecipeService.bulkInsert(recipes)
      
      expect(results).toHaveLength(2)
      expect(results[0].user_id).toBe('test-user-id')
      expect(results[1].user_id).toBe('test-user-id')
    })

    it('should normalize all recipes in bulk insert', async () => {
      const recipes = [
        createTestRecipe({ tags: null, prep_time: 0 }),
        createTestRecipe({ ingredients: undefined, cook_time: -5 })
      ]
      
      const mockSupabase = await import('@/lib/supabase')
      const mockInsert = vi.fn().mockReturnThis()
      vi.mocked(mockSupabase.supabase.from).mockReturnValue({
        insert: mockInsert,
        select: vi.fn().mockResolvedValue({ 
          data: recipes.map((r, i) => ({ ...r, id: i + 1 })), 
          error: null 
        })
      })

      await supabaseRecipeService.bulkInsert(recipes)
      
      // Check that normalized data was passed to insert
      expect(mockInsert).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            tags: [],
            prep_time: null
          }),
          expect.objectContaining({
            ingredients: [],
            cook_time: null
          })
        ])
      )
    })

    it('should throw error for authentication failure', async () => {
      vi.mocked(authService.getCurrentUser).mockRejectedValue(new Error('Not authenticated'))
      
      await expect(supabaseRecipeService.bulkInsert([testRecipes[0]])).rejects.toThrow('User not authenticated')
    })
  })

  describe('error handling', () => {
    it('should handle network errors gracefully', async () => {
      // Mock network error
      const mockSupabase = await import('@/lib/supabase')
      vi.mocked(mockSupabase.supabase.from).mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockRejectedValue(new Error('Network error'))
      })

      const recipes = await supabaseRecipeService.getAll()
      expect(recipes).toEqual([])
    })

    it('should log errors to console', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      
      // Mock error response
      const mockSupabase = await import('@/lib/supabase')
      vi.mocked(mockSupabase.supabase.from).mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ 
          data: null, 
          error: { message: 'Database error' } 
        })
      })

      await supabaseRecipeService.getAll()
      
      expect(consoleSpy).toHaveBeenCalledWith('Failed to get recipes:', expect.any(Object))
      
      consoleSpy.mockRestore()
    })
  })
})
