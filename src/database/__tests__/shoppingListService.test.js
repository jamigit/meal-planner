import { describe, it, expect, beforeEach, vi } from 'vitest'
import { shoppingListService } from '../shoppingListService.js'
import { getDatabase } from '../db.js'

// Mock the database
vi.mock('../db.js', () => ({
  getDatabase: vi.fn(() => ({
    persistentShoppingLists: {
      add: vi.fn(),
      get: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      toArray: vi.fn()
    },
    persistentShoppingListItems: {
      add: vi.fn(),
      get: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      where: vi.fn(() => ({
        equals: vi.fn(() => ({
          delete: vi.fn(),
          sortBy: vi.fn()
        }))
      }))
    }
  }))
}))

describe('ShoppingListService (IndexedDB)', () => {
  let mockDb

  beforeEach(() => {
    vi.clearAllMocks()
    mockDb = getDatabase()
  })

  describe('getAllLists', () => {
    it('should return all shopping lists sorted by creation date', async () => {
      const mockLists = [
        { id: 1, name: 'List 1', created_at: '2023-01-02T00:00:00Z' },
        { id: 2, name: 'List 2', created_at: '2023-01-01T00:00:00Z' }
      ]
      mockDb.persistentShoppingLists.toArray.mockResolvedValue(mockLists)

      const result = await shoppingListService.getAllLists()

      expect(result).toEqual([
        { id: 2, name: 'List 2', created_at: '2023-01-01T00:00:00Z' },
        { id: 1, name: 'List 1', created_at: '2023-01-02T00:00:00Z' }
      ])
      expect(mockDb.persistentShoppingLists.toArray).toHaveBeenCalledOnce()
    })

    it('should return empty array on error', async () => {
      mockDb.persistentShoppingLists.toArray.mockRejectedValue(new Error('DB Error'))

      const result = await shoppingListService.getAllLists()

      expect(result).toEqual([])
    })
  })

  describe('getShoppingList', () => {
    it('should return first list when lists exist', async () => {
      const mockLists = [
        { id: 1, name: 'List 1', created_at: '2023-01-01T00:00:00Z' },
        { id: 2, name: 'List 2', created_at: '2023-01-02T00:00:00Z' }
      ]
      mockDb.persistentShoppingLists.toArray.mockResolvedValue(mockLists)

      const result = await shoppingListService.getShoppingList()

      expect(result).toEqual({ id: 1, name: 'List 1', created_at: '2023-01-01T00:00:00Z' })
    })

    it('should create new list when no lists exist', async () => {
      const newList = { id: 1, name: 'My Shopping List', created_at: '2023-01-01T00:00:00Z' }
      mockDb.persistentShoppingLists.toArray.mockResolvedValue([])
      mockDb.persistentShoppingLists.add.mockResolvedValue(1)
      mockDb.persistentShoppingLists.get.mockResolvedValue(newList)

      const result = await shoppingListService.getShoppingList()

      expect(mockDb.persistentShoppingLists.add).toHaveBeenCalledWith({
        name: 'My Shopping List',
        created_at: expect.any(String),
        updated_at: expect.any(String)
      })
      expect(result).toEqual(newList)
    })
  })

  describe('createList', () => {
    it('should create a new shopping list', async () => {
      const newList = { id: 1, name: 'New List', created_at: '2023-01-01T00:00:00Z' }
      mockDb.persistentShoppingLists.add.mockResolvedValue(1)
      mockDb.persistentShoppingLists.get.mockResolvedValue(newList)

      const result = await shoppingListService.createList('New List')

      expect(mockDb.persistentShoppingLists.add).toHaveBeenCalledWith({
        name: 'New List',
        created_at: expect.any(String),
        updated_at: expect.any(String)
      })
      expect(result).toEqual(newList)
    })

    it('should use default name when none provided', async () => {
      const newList = { id: 1, name: 'New Shopping List', created_at: '2023-01-01T00:00:00Z' }
      mockDb.persistentShoppingLists.add.mockResolvedValue(1)
      mockDb.persistentShoppingLists.get.mockResolvedValue(newList)

      await shoppingListService.createList()

      expect(mockDb.persistentShoppingLists.add).toHaveBeenCalledWith({
        name: 'New Shopping List',
        created_at: expect.any(String),
        updated_at: expect.any(String)
      })
    })
  })

  describe('updateList', () => {
    it('should update shopping list', async () => {
      const updatedList = { id: 1, name: 'Updated List' }
      mockDb.persistentShoppingLists.update.mockResolvedValue()
      mockDb.persistentShoppingLists.get.mockResolvedValue(updatedList)

      const result = await shoppingListService.updateList(1, { name: 'Updated List' })

      expect(mockDb.persistentShoppingLists.update).toHaveBeenCalledWith(1, {
        name: 'Updated List',
        updated_at: expect.any(String)
      })
      expect(result).toEqual(updatedList)
    })
  })

  describe('deleteList', () => {
    it('should delete list and all its items', async () => {
      const mockWhereQuery = {
        equals: vi.fn(() => ({
          delete: vi.fn().mockResolvedValue()
        }))
      }
      mockDb.persistentShoppingListItems.where.mockReturnValue(mockWhereQuery)
      mockDb.persistentShoppingLists.delete.mockResolvedValue()

      const result = await shoppingListService.deleteList(1)

      expect(mockDb.persistentShoppingListItems.where).toHaveBeenCalledWith('shopping_list_id')
      expect(mockWhereQuery.equals).toHaveBeenCalledWith(1)
      expect(mockDb.persistentShoppingLists.delete).toHaveBeenCalledWith(1)
      expect(result).toBe(true)
    })
  })

  describe('getAllItems', () => {
    it('should return all items for a list', async () => {
      const mockItems = [
        { id: 1, name: 'Item 1', category: 'Produce', checked: false },
        { id: 2, name: 'Item 2', category: 'Dairy', checked: true }
      ]
      const mockSortQuery = {
        sortBy: vi.fn().mockResolvedValue(mockItems)
      }
      const mockWhereQuery = {
        equals: vi.fn(() => mockSortQuery)
      }
      mockDb.persistentShoppingListItems.where.mockReturnValue(mockWhereQuery)

      const result = await shoppingListService.getAllItems(1)

      expect(mockDb.persistentShoppingListItems.where).toHaveBeenCalledWith('shopping_list_id')
      expect(mockWhereQuery.equals).toHaveBeenCalledWith(1)
      expect(mockSortQuery.sortBy).toHaveBeenCalledWith('sort_order')
      expect(result).toHaveLength(2)
      expect(result[0]).toEqual({
        id: 1,
        name: 'Item 1',
        category: 'Produce',
        checked: false,
        meal_role: 'general'
      })
    })

    it('should return empty array on error', async () => {
      const mockSortQuery = {
        sortBy: vi.fn().mockRejectedValue(new Error('DB Error'))
      }
      const mockWhereQuery = {
        equals: vi.fn(() => mockSortQuery)
      }
      mockDb.persistentShoppingListItems.where.mockReturnValue(mockWhereQuery)

      const result = await shoppingListService.getAllItems(1)

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
      mockDb.persistentShoppingListItems.add.mockResolvedValue(1)
      mockDb.persistentShoppingListItems.get.mockResolvedValue(newItem)

      const result = await shoppingListService.addItem(1, {
        name: 'Apple',
        category: 'Produce',
        quantity: '2',
        unit: 'lbs'
      })

      expect(mockDb.persistentShoppingListItems.add).toHaveBeenCalledWith({
        shopping_list_id: 1,
        name: 'Apple',
        quantity: '2',
        unit: 'lbs',
        category: 'Produce',
        notes: null,
        meal_role: 'general',
        checked: false,
        checked_at: null,
        sort_order: 0,
        created_at: expect.any(String),
        updated_at: expect.any(String)
      })
      expect(result).toEqual(newItem)
    })

    it('should throw error when name is missing', async () => {
      await expect(shoppingListService.addItem(1, { category: 'Produce' }))
        .rejects.toThrow('Item name is required')
    })

    it('should use default category when none provided', async () => {
      const newItem = { id: 1, name: 'Apple', category: 'Other' }
      mockDb.persistentShoppingListItems.add.mockResolvedValue(1)
      mockDb.persistentShoppingListItems.get.mockResolvedValue(newItem)

      await shoppingListService.addItem(1, { name: 'Apple' })

      expect(mockDb.persistentShoppingListItems.add).toHaveBeenCalledWith(
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
      mockDb.persistentShoppingListItems.update.mockResolvedValue()
      mockDb.persistentShoppingListItems.get.mockResolvedValue(updatedItem)

      const result = await shoppingListService.updateItem(1, {
        name: 'Updated Apple',
        category: 'Produce'
      })

      expect(mockDb.persistentShoppingListItems.update).toHaveBeenCalledWith(1, {
        name: 'Updated Apple',
        category: 'Produce',
        updated_at: expect.any(String)
      })
      expect(result).toEqual(updatedItem)
    })

    it('should throw error when name is empty', async () => {
      await expect(shoppingListService.updateItem(1, { name: '' }))
        .rejects.toThrow('Item name is required')
    })
  })

  describe('toggleItemChecked', () => {
    it('should toggle item checked state', async () => {
      const updatedItem = { id: 1, checked: true, checked_at: '2023-01-01T00:00:00Z' }
      mockDb.persistentShoppingListItems.update.mockResolvedValue()
      mockDb.persistentShoppingListItems.get.mockResolvedValue(updatedItem)

      const result = await shoppingListService.toggleItemChecked(1, true)

      expect(mockDb.persistentShoppingListItems.update).toHaveBeenCalledWith(1, {
        checked: true,
        checked_at: expect.any(String),
        updated_at: expect.any(String)
      })
      expect(result).toEqual(updatedItem)
    })

    it('should clear checked_at when unchecked', async () => {
      const updatedItem = { id: 1, checked: false, checked_at: null }
      mockDb.persistentShoppingListItems.update.mockResolvedValue()
      mockDb.persistentShoppingListItems.get.mockResolvedValue(updatedItem)

      await shoppingListService.toggleItemChecked(1, false)

      expect(mockDb.persistentShoppingListItems.update).toHaveBeenCalledWith(1, {
        checked: false,
        checked_at: null,
        updated_at: expect.any(String)
      })
    })
  })

  describe('deleteItem', () => {
    it('should delete item', async () => {
      mockDb.persistentShoppingListItems.delete.mockResolvedValue()

      const result = await shoppingListService.deleteItem(1)

      expect(mockDb.persistentShoppingListItems.delete).toHaveBeenCalledWith(1)
      expect(result).toBe(true)
    })
  })

  describe('bulkUncheckItems', () => {
    it('should uncheck all items in list', async () => {
      const mockUpdateQuery = {
        update: vi.fn().mockResolvedValue()
      }
      const mockWhereQuery = {
        equals: vi.fn(() => mockUpdateQuery)
      }
      mockDb.persistentShoppingListItems.where.mockReturnValue(mockWhereQuery)

      const result = await shoppingListService.bulkUncheckItems(1)

      expect(mockDb.persistentShoppingListItems.where).toHaveBeenCalledWith('shopping_list_id')
      expect(mockWhereQuery.equals).toHaveBeenCalledWith(1)
      expect(mockUpdateQuery.update).toHaveBeenCalledWith({
        checked: false,
        checked_at: null,
        updated_at: expect.any(String)
      })
      expect(result).toBe(true)
    })
  })

  describe('reorderItems', () => {
    it('should reorder items by updating sort_order', async () => {
      const mockUpdateQuery = {
        update: vi.fn().mockResolvedValue()
      }
      const mockWhereQuery = {
        equals: vi.fn(() => mockUpdateQuery)
      }
      mockDb.persistentShoppingListItems.where.mockReturnValue(mockWhereQuery)

      const result = await shoppingListService.reorderItems(1, [3, 1, 2])

      expect(mockDb.persistentShoppingListItems.where).toHaveBeenCalledWith('shopping_list_id')
      expect(mockWhereQuery.equals).toHaveBeenCalledWith(1)
      expect(result).toBe(true)
    })
  })

  describe('moveItemToCategory', () => {
    it('should move item to new category', async () => {
      mockDb.persistentShoppingListItems.update.mockResolvedValue()

      const result = await shoppingListService.moveItemToCategory(1, 'Produce')

      expect(mockDb.persistentShoppingListItems.update).toHaveBeenCalledWith(1, {
        category: 'Produce',
        updated_at: expect.any(String)
      })
      expect(result).toBe(true)
    })

    it('should update sort_order when provided', async () => {
      mockDb.persistentShoppingListItems.update.mockResolvedValue()

      await shoppingListService.moveItemToCategory(1, 'Produce', 5)

      expect(mockDb.persistentShoppingListItems.update).toHaveBeenCalledWith(1, {
        category: 'Produce',
        sort_order: 5,
        updated_at: expect.any(String)
      })
    })
  })
})
