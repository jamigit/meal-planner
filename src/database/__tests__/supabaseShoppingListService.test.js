import { describe, it, expect, beforeEach, vi } from 'vitest'
import { supabaseShoppingListService } from '../supabaseShoppingListService.js'
import { supabase } from '../../lib/supabase.js'
import { authService } from '../../services/authService.js'

// Mock dependencies
vi.mock('../../lib/supabase.js', () => ({
  supabase: {
    from: vi.fn()
  }
}))

vi.mock('../../services/authService.js', () => ({
  authService: {
    getCurrentUser: vi.fn(),
    isAuthenticated: vi.fn()
  }
}))

describe('SupabaseShoppingListService', () => {
  let mockQuery

  beforeEach(() => {
    vi.clearAllMocks()
    
    // Setup mock query chain
    mockQuery = {
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      single: vi.fn()
    }
    
    supabase.from.mockReturnValue(mockQuery)
    authService.getCurrentUser.mockResolvedValue({ id: 'user-123' })
  })

  describe('getUserId', () => {
    it('should return user ID when authenticated', async () => {
      authService.getCurrentUser.mockResolvedValue({ id: 'user-123' })

      const result = await supabaseShoppingListService.getUserId()

      expect(result).toBe('user-123')
    })

    it('should throw error when not authenticated', async () => {
      authService.getCurrentUser.mockRejectedValue(new Error('Not authenticated'))

      await expect(supabaseShoppingListService.getUserId())
        .rejects.toThrow('User not authenticated')
    })
  })

  describe('getAllLists', () => {
    it('should return all shopping lists for user', async () => {
      const mockLists = [
        { id: 1, name: 'List 1', user_id: 'user-123' },
        { id: 2, name: 'List 2', user_id: 'user-123' }
      ]
      mockQuery.single.mockResolvedValue({ data: mockLists, error: null })

      const result = await supabaseShoppingListService.getAllLists()

      expect(supabase.from).toHaveBeenCalledWith('shopping_lists')
      expect(mockQuery.select).toHaveBeenCalledWith('*')
      expect(mockQuery.eq).toHaveBeenCalledWith('user_id', 'user-123')
      expect(mockQuery.order).toHaveBeenCalledWith('created_at', { ascending: true })
      expect(result).toEqual(mockLists)
    })

    it('should throw error on database error', async () => {
      mockQuery.single.mockResolvedValue({ data: null, error: new Error('DB Error') })

      await expect(supabaseShoppingListService.getAllLists())
        .rejects.toThrow('DB Error')
    })
  })

  describe('getShoppingList', () => {
    it('should return first list when lists exist', async () => {
      const mockLists = [
        { id: 1, name: 'List 1', user_id: 'user-123' },
        { id: 2, name: 'List 2', user_id: 'user-123' }
      ]
      mockQuery.single.mockResolvedValue({ data: mockLists, error: null })

      const result = await supabaseShoppingListService.getShoppingList()

      expect(result).toEqual({ id: 1, name: 'List 1', user_id: 'user-123' })
    })

    it('should create new list when no lists exist', async () => {
      const newList = { id: 1, name: 'My Shopping List', user_id: 'user-123' }
      
      // First call returns empty list
      mockQuery.single.mockResolvedValueOnce({ data: [], error: null })
      // Second call returns new list
      mockQuery.single.mockResolvedValueOnce({ data: newList, error: null })

      const result = await supabaseShoppingListService.getShoppingList()

      expect(result).toEqual(newList)
    })
  })

  describe('createList', () => {
    it('should create a new shopping list', async () => {
      const newList = { id: 1, name: 'New List', user_id: 'user-123' }
      mockQuery.single.mockResolvedValue({ data: newList, error: null })

      const result = await supabaseShoppingListService.createList('New List')

      expect(supabase.from).toHaveBeenCalledWith('shopping_lists')
      expect(mockQuery.insert).toHaveBeenCalledWith({
        user_id: 'user-123',
        name: 'New List'
      })
      expect(mockQuery.select).toHaveBeenCalled()
      expect(mockQuery.single).toHaveBeenCalled()
      expect(result).toEqual(newList)
    })

    it('should use default name when none provided', async () => {
      const newList = { id: 1, name: 'New Shopping List', user_id: 'user-123' }
      mockQuery.single.mockResolvedValue({ data: newList, error: null })

      await supabaseShoppingListService.createList()

      expect(mockQuery.insert).toHaveBeenCalledWith({
        user_id: 'user-123',
        name: 'New Shopping List'
      })
    })
  })

  describe('updateList', () => {
    it('should update shopping list', async () => {
      const updatedList = { id: 1, name: 'Updated List', user_id: 'user-123' }
      mockQuery.single.mockResolvedValue({ data: updatedList, error: null })

      const result = await supabaseShoppingListService.updateList(1, { name: 'Updated List' })

      expect(supabase.from).toHaveBeenCalledWith('shopping_lists')
      expect(mockQuery.update).toHaveBeenCalledWith({ name: 'Updated List' })
      expect(mockQuery.eq).toHaveBeenCalledWith('id', 1)
      expect(mockQuery.eq).toHaveBeenCalledWith('user_id', 'user-123')
      expect(result).toEqual(updatedList)
    })
  })

  describe('deleteList', () => {
    it('should delete shopping list', async () => {
      mockQuery.delete.mockResolvedValue({ error: null })

      const result = await supabaseShoppingListService.deleteList(1)

      expect(supabase.from).toHaveBeenCalledWith('shopping_lists')
      expect(mockQuery.delete).toHaveBeenCalled()
      expect(mockQuery.eq).toHaveBeenCalledWith('id', 1)
      expect(mockQuery.eq).toHaveBeenCalledWith('user_id', 'user-123')
      expect(result).toBe(true)
    })

    it('should throw error on database error', async () => {
      mockQuery.delete.mockResolvedValue({ error: new Error('DB Error') })

      await expect(supabaseShoppingListService.deleteList(1))
        .rejects.toThrow('DB Error')
    })
  })

  describe('getAllItems', () => {
    it('should return all items for a shopping list', async () => {
      const mockItems = [
        { id: 1, name: 'Item 1', category: 'Produce', checked: false },
        { id: 2, name: 'Item 2', category: 'Dairy', checked: true }
      ]
      mockQuery.select.mockResolvedValue({ data: mockItems, error: null })

      const result = await supabaseShoppingListService.getAllItems(1)

      expect(supabase.from).toHaveBeenCalledWith('shopping_list_items')
      expect(mockQuery.select).toHaveBeenCalledWith('*')
      expect(mockQuery.eq).toHaveBeenCalledWith('shopping_list_id', 1)
      expect(mockQuery.eq).toHaveBeenCalledWith('user_id', 'user-123')
      expect(mockQuery.order).toHaveBeenCalledWith('sort_order', { ascending: true })
      expect(mockQuery.order).toHaveBeenCalledWith('category', { ascending: true })
      expect(mockQuery.order).toHaveBeenCalledWith('created_at', { ascending: true })
      expect(result).toEqual(mockItems)
    })

    it('should return empty array on error', async () => {
      mockQuery.select.mockResolvedValue({ data: null, error: new Error('DB Error') })

      const result = await supabaseShoppingListService.getAllItems(1)

      expect(result).toEqual([])
    })
  })

  describe('addItem', () => {
    it('should add new item to shopping list', async () => {
      const newItem = {
        id: 1,
        name: 'Apple',
        category: 'Produce',
        quantity: '2',
        unit: 'lbs',
        checked: false,
        meal_role: 'general'
      }
      mockQuery.single.mockResolvedValue({ data: newItem, error: null })

      const result = await supabaseShoppingListService.addItem(1, {
        name: 'Apple',
        category: 'Produce',
        quantity: '2',
        unit: 'lbs'
      })

      expect(supabase.from).toHaveBeenCalledWith('shopping_list_items')
      expect(mockQuery.insert).toHaveBeenCalledWith({
        shopping_list_id: 1,
        user_id: 'user-123',
        name: 'Apple',
        quantity: '2',
        unit: 'lbs',
        category: 'Produce',
        notes: null,
        meal_role: 'general',
        checked: false,
        sort_order: 0
      })
      expect(result).toEqual(newItem)
    })

    it('should throw error when name is missing', async () => {
      await expect(supabaseShoppingListService.addItem(1, { category: 'Produce' }))
        .rejects.toThrow('Item name is required')
    })

    it('should use default category when none provided', async () => {
      const newItem = { id: 1, name: 'Apple', category: 'Other' }
      mockQuery.single.mockResolvedValue({ data: newItem, error: null })

      await supabaseShoppingListService.addItem(1, { name: 'Apple' })

      expect(mockQuery.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          category: 'Other',
          meal_role: 'general'
        })
      )
    })
  })

  describe('updateItem', () => {
    it('should update item with provided fields', async () => {
      const updatedItem = { id: 1, name: 'Updated Apple', category: 'Produce' }
      mockQuery.single.mockResolvedValue({ data: updatedItem, error: null })

      const result = await supabaseShoppingListService.updateItem(1, {
        name: 'Updated Apple',
        category: 'Produce'
      })

      expect(supabase.from).toHaveBeenCalledWith('shopping_list_items')
      expect(mockQuery.update).toHaveBeenCalledWith({
        name: 'Updated Apple',
        category: 'Produce'
      })
      expect(mockQuery.eq).toHaveBeenCalledWith('id', 1)
      expect(mockQuery.eq).toHaveBeenCalledWith('user_id', 'user-123')
      expect(result).toEqual(updatedItem)
    })

    it('should throw error when name is empty', async () => {
      await expect(supabaseShoppingListService.updateItem(1, { name: '' }))
        .rejects.toThrow('Item name is required')
    })
  })

  describe('toggleItemChecked', () => {
    it('should toggle item checked state', async () => {
      const updatedItem = { id: 1, checked: true, checked_at: '2023-01-01T00:00:00Z' }
      mockQuery.single.mockResolvedValue({ data: updatedItem, error: null })

      const result = await supabaseShoppingListService.toggleItemChecked(1, true)

      expect(mockQuery.update).toHaveBeenCalledWith({
        checked: true,
        checked_at: expect.any(String)
      })
      expect(mockQuery.eq).toHaveBeenCalledWith('id', 1)
      expect(mockQuery.eq).toHaveBeenCalledWith('user_id', 'user-123')
      expect(result).toEqual(updatedItem)
    })

    it('should clear checked_at when unchecked', async () => {
      const updatedItem = { id: 1, checked: false, checked_at: null }
      mockQuery.single.mockResolvedValue({ data: updatedItem, error: null })

      await supabaseShoppingListService.toggleItemChecked(1, false)

      expect(mockQuery.update).toHaveBeenCalledWith({
        checked: false,
        checked_at: null
      })
    })
  })

  describe('deleteItem', () => {
    it('should delete item', async () => {
      mockQuery.delete.mockResolvedValue({ error: null })

      const result = await supabaseShoppingListService.deleteItem(1)

      expect(supabase.from).toHaveBeenCalledWith('shopping_list_items')
      expect(mockQuery.delete).toHaveBeenCalled()
      expect(mockQuery.eq).toHaveBeenCalledWith('id', 1)
      expect(mockQuery.eq).toHaveBeenCalledWith('user_id', 'user-123')
      expect(result).toBe(true)
    })

    it('should throw error on database error', async () => {
      mockQuery.delete.mockResolvedValue({ error: new Error('DB Error') })

      await expect(supabaseShoppingListService.deleteItem(1))
        .rejects.toThrow('DB Error')
    })
  })

  describe('bulkAddItems', () => {
    it('should add multiple items to shopping list', async () => {
      const newItems = [
        { id: 1, name: 'Apple', category: 'Produce' },
        { id: 2, name: 'Milk', category: 'Dairy' }
      ]
      mockQuery.insert.mockResolvedValue({ data: newItems, error: null })

      const result = await supabaseShoppingListService.bulkAddItems(1, [
        { name: 'Apple', category: 'Produce' },
        { name: 'Milk', category: 'Dairy' }
      ])

      expect(supabase.from).toHaveBeenCalledWith('shopping_list_items')
      expect(mockQuery.insert).toHaveBeenCalledWith([
        expect.objectContaining({
          shopping_list_id: 1,
          user_id: 'user-123',
          name: 'Apple',
          category: 'Produce',
          meal_role: 'general',
          checked: false
        }),
        expect.objectContaining({
          shopping_list_id: 1,
          user_id: 'user-123',
          name: 'Milk',
          category: 'Dairy',
          meal_role: 'general',
          checked: false
        })
      ])
      expect(result).toEqual(newItems)
    })
  })

  describe('bulkUncheckItems', () => {
    it('should uncheck all items in list', async () => {
      mockQuery.update.mockResolvedValue({ error: null })

      const result = await supabaseShoppingListService.bulkUncheckItems(1)

      expect(supabase.from).toHaveBeenCalledWith('shopping_list_items')
      expect(mockQuery.update).toHaveBeenCalledWith({
        checked: false,
        checked_at: null
      })
      expect(mockQuery.eq).toHaveBeenCalledWith('shopping_list_id', 1)
      expect(mockQuery.eq).toHaveBeenCalledWith('user_id', 'user-123')
      expect(result).toBe(true)
    })
  })

  describe('reorderItems', () => {
    it('should reorder items by updating sort_order', async () => {
      mockQuery.update.mockResolvedValue({ error: null })

      const result = await supabaseShoppingListService.reorderItems(1, [3, 1, 2])

      expect(supabase.from).toHaveBeenCalledWith('shopping_list_items')
      expect(mockQuery.update).toHaveBeenCalledWith({
        sort_order: 0,
        updated_at: expect.any(String)
      })
      expect(mockQuery.eq).toHaveBeenCalledWith('id', 3)
      expect(mockQuery.eq).toHaveBeenCalledWith('shopping_list_id', 1)
      expect(mockQuery.eq).toHaveBeenCalledWith('user_id', 'user-123')
      expect(result).toBe(true)
    })
  })

  describe('moveItemToCategory', () => {
    it('should move item to new category', async () => {
      mockQuery.update.mockResolvedValue({ error: null })

      const result = await supabaseShoppingListService.moveItemToCategory(1, 'Produce')

      expect(supabase.from).toHaveBeenCalledWith('shopping_list_items')
      expect(mockQuery.update).toHaveBeenCalledWith({
        category: 'Produce',
        updated_at: expect.any(String)
      })
      expect(mockQuery.eq).toHaveBeenCalledWith('id', 1)
      expect(mockQuery.eq).toHaveBeenCalledWith('user_id', 'user-123')
      expect(result).toBe(true)
    })

    it('should update sort_order when provided', async () => {
      mockQuery.update.mockResolvedValue({ error: null })

      await supabaseShoppingListService.moveItemToCategory(1, 'Produce', 5)

      expect(mockQuery.update).toHaveBeenCalledWith({
        category: 'Produce',
        sort_order: 5,
        updated_at: expect.any(String)
      })
    })
  })
})
