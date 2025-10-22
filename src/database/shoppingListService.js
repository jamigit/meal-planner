import { getDatabase } from './db.js'
import { validateStringField } from '../utils/schemaValidation.js'

class ShoppingListService {
  constructor() {
    this.db = getDatabase()
  }

  // Normalize shopping list item data
  normalizeItem(item) {
    return {
      ...item,
      name: validateStringField(item.name, 'name', true),
      quantity: validateStringField(item.quantity, 'quantity', false),
      unit: validateStringField(item.unit, 'unit', false),
      category: validateStringField(item.category, 'category', false) || 'Other',
      notes: validateStringField(item.notes, 'notes', false),
      checked: Boolean(item.checked)
    }
  }

  // Get or create user's main shopping list
  async getShoppingList() {
    try {
      // For IndexedDB, we'll use a single default list
      // In a real app, you might want to support multiple lists
      let list = await this.db.persistentShoppingLists.get(1)
      
      if (!list) {
        const now = new Date().toISOString()
        const id = await this.db.persistentShoppingLists.add({
          id: 1,
          name: 'My Shopping List',
          created_at: now,
          updated_at: now
        })
        list = await this.db.persistentShoppingLists.get(id)
      }
      
      return list
    } catch (error) {
      console.error('Failed to get shopping list:', error)
      throw error
    }
  }

  // Get all items for a shopping list
  async getAllItems(listId) {
    try {
      const items = await this.db.persistentShoppingListItems
        .where('shopping_list_id')
        .equals(listId)
        .sortBy('category')
      
      return items.map(item => this.normalizeItem(item))
    } catch (error) {
      console.error('Failed to get shopping list items:', error)
      return []
    }
  }

  // Add new item to shopping list
  async addItem(listId, itemData) {
    try {
      const name = validateStringField(itemData.name, 'name', true)
      if (!name) {
        throw new Error('Item name is required')
      }

      const now = new Date().toISOString()
      const normalizedItem = {
        shopping_list_id: listId,
        name: name,
        quantity: validateStringField(itemData.quantity, 'quantity', false),
        unit: validateStringField(itemData.unit, 'unit', false),
        category: validateStringField(itemData.category, 'category', false) || 'Other',
        notes: validateStringField(itemData.notes, 'notes', false),
        checked: false,
        checked_at: null,
        created_at: now,
        updated_at: now
      }

      const id = await this.db.persistentShoppingListItems.add(normalizedItem)
      return this.normalizeItem(await this.db.persistentShoppingListItems.get(id))
    } catch (error) {
      console.error('Failed to add shopping list item:', error)
      throw error
    }
  }

  // Update shopping list item
  async updateItem(itemId, updates) {
    try {
      const normalizedUpdates = {
        updated_at: new Date().toISOString()
      }
      
      if (updates.name !== undefined) {
        normalizedUpdates.name = validateStringField(updates.name, 'name', true)
        if (!normalizedUpdates.name) {
          throw new Error('Item name is required')
        }
      }
      
      if (updates.quantity !== undefined) {
        normalizedUpdates.quantity = validateStringField(updates.quantity, 'quantity', false)
      }
      
      if (updates.unit !== undefined) {
        normalizedUpdates.unit = validateStringField(updates.unit, 'unit', false)
      }
      
      if (updates.category !== undefined) {
        normalizedUpdates.category = validateStringField(updates.category, 'category', false) || 'Other'
      }
      
      if (updates.notes !== undefined) {
        normalizedUpdates.notes = validateStringField(updates.notes, 'notes', false)
      }

      await this.db.persistentShoppingListItems.update(itemId, normalizedUpdates)
      return this.normalizeItem(await this.db.persistentShoppingListItems.get(itemId))
    } catch (error) {
      console.error('Failed to update shopping list item:', error)
      throw error
    }
  }

  // Toggle item checked state
  async toggleItemChecked(itemId, checked) {
    try {
      const updates = {
        checked: checked,
        checked_at: checked ? new Date().toISOString() : null,
        updated_at: new Date().toISOString()
      }

      await this.db.persistentShoppingListItems.update(itemId, updates)
      return this.normalizeItem(await this.db.persistentShoppingListItems.get(itemId))
    } catch (error) {
      console.error('Failed to toggle item checked state:', error)
      throw error
    }
  }

  // Delete shopping list item
  async deleteItem(itemId) {
    try {
      await this.db.persistentShoppingListItems.delete(itemId)
      return true
    } catch (error) {
      console.error('Failed to delete shopping list item:', error)
      throw error
    }
  }

  // Bulk add items to shopping list
  async bulkAddItems(listId, itemsArray) {
    try {
      const now = new Date().toISOString()
      const normalizedItems = itemsArray.map(item => ({
        shopping_list_id: listId,
        name: validateStringField(item.name, 'name', true),
        quantity: validateStringField(item.quantity, 'quantity', false),
        unit: validateStringField(item.unit, 'unit', false),
        category: validateStringField(item.category, 'category', false) || 'Other',
        notes: validateStringField(item.notes, 'notes', false),
        checked: false,
        checked_at: null,
        created_at: now,
        updated_at: now
      }))

      const ids = await this.db.persistentShoppingListItems.bulkAdd(normalizedItems)
      
      // Return the added items
      const addedItems = []
      for (const id of ids) {
        const item = await this.db.persistentShoppingListItems.get(id)
        if (item) {
          addedItems.push(this.normalizeItem(item))
        }
      }
      
      return addedItems
    } catch (error) {
      console.error('Failed to bulk add items:', error)
      throw error
    }
  }

  // Uncheck all items in shopping list
  async bulkUncheckItems(listId) {
    try {
      const items = await this.db.persistentShoppingListItems
        .where('shopping_list_id')
        .equals(listId)
        .toArray()

      const updates = items.map(item => ({
        ...item,
        checked: false,
        checked_at: null,
        updated_at: new Date().toISOString()
      }))

      await this.db.persistentShoppingListItems.bulkPut(updates)
      return true
    } catch (error) {
      console.error('Failed to bulk uncheck items:', error)
      throw error
    }
  }
}

export const shoppingListService = new ShoppingListService()

