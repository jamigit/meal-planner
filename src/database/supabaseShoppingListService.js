import { supabase } from '../lib/supabase.js'
import { authService } from '../services/authService.js'
import { validateStringField, validateNumericField } from '../utils/schemaValidation.js'

class SupabaseShoppingListService {
  constructor() {
    this.listsTableName = 'shopping_lists'
    this.itemsTableName = 'shopping_list_items'
  }

  async getUserId() {
    try {
      const user = await authService.getCurrentUser()
      if (!user) throw new Error('User not authenticated')
      return user.id
    } catch (error) {
      throw new Error('User not authenticated')
    }
  }

  // Get or create user's main shopping list
  async getShoppingList() {
    try {
      const userId = await this.getUserId()
      
      // Try to get existing shopping list
      const { data: existingList, error: fetchError } = await supabase
        .from(this.listsTableName)
        .select('*')
        .eq('user_id', userId)
        .single()

      if (fetchError && fetchError.code !== 'PGRST116') {
        throw fetchError
      }

      // If no list exists, create one
      if (!existingList) {
        const { data: newList, error: createError } = await supabase
          .from(this.listsTableName)
          .insert({
            user_id: userId,
            name: 'My Shopping List'
          })
          .select()
          .single()

        if (createError) throw createError
        return newList
      }

      return existingList
    } catch (error) {
      console.error('Failed to get shopping list:', error)
      throw error
    }
  }

  // Get all items for a shopping list
  async getAllItems(listId) {
    try {
      const userId = await this.getUserId()
      
      const { data, error } = await supabase
        .from(this.itemsTableName)
        .select('*')
        .eq('shopping_list_id', listId)
        .eq('user_id', userId)
        .order('category', { ascending: true })
        .order('created_at', { ascending: true })

      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Failed to get shopping list items:', error)
      return []
    }
  }

  // Add new item to shopping list
  async addItem(listId, itemData) {
    try {
      const userId = await this.getUserId()
      
      // Validate required fields
      const name = validateStringField(itemData.name, 'name', true)
      if (!name) {
        throw new Error('Item name is required')
      }

      const normalizedItem = {
        shopping_list_id: listId,
        user_id: userId,
        name: name,
        quantity: validateStringField(itemData.quantity, 'quantity', false),
        unit: validateStringField(itemData.unit, 'unit', false),
        category: validateStringField(itemData.category, 'category', false) || 'Other',
        notes: validateStringField(itemData.notes, 'notes', false),
        checked: false
      }

      const { data, error } = await supabase
        .from(this.itemsTableName)
        .insert(normalizedItem)
        .select()
        .single()

      if (error) throw error
      return data
    } catch (error) {
      console.error('Failed to add shopping list item:', error)
      throw error
    }
  }

  // Update shopping list item
  async updateItem(itemId, updates) {
    try {
      const userId = await this.getUserId()
      
      const normalizedUpdates = {}
      
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

      const { data, error } = await supabase
        .from(this.itemsTableName)
        .update(normalizedUpdates)
        .eq('id', itemId)
        .eq('user_id', userId)
        .select()
        .single()

      if (error) throw error
      return data
    } catch (error) {
      console.error('Failed to update shopping list item:', error)
      throw error
    }
  }

  // Toggle item checked state
  async toggleItemChecked(itemId, checked) {
    try {
      const userId = await this.getUserId()
      
      const updates = {
        checked: checked,
        checked_at: checked ? new Date().toISOString() : null
      }

      const { data, error } = await supabase
        .from(this.itemsTableName)
        .update(updates)
        .eq('id', itemId)
        .eq('user_id', userId)
        .select()
        .single()

      if (error) throw error
      return data
    } catch (error) {
      console.error('Failed to toggle item checked state:', error)
      throw error
    }
  }

  // Delete shopping list item
  async deleteItem(itemId) {
    try {
      const userId = await this.getUserId()
      
      const { error } = await supabase
        .from(this.itemsTableName)
        .delete()
        .eq('id', itemId)
        .eq('user_id', userId)

      if (error) throw error
      return true
    } catch (error) {
      console.error('Failed to delete shopping list item:', error)
      throw error
    }
  }

  // Bulk add items to shopping list
  async bulkAddItems(listId, itemsArray) {
    try {
      const userId = await this.getUserId()
      
      const normalizedItems = itemsArray.map(item => ({
        shopping_list_id: listId,
        user_id: userId,
        name: validateStringField(item.name, 'name', true),
        quantity: validateStringField(item.quantity, 'quantity', false),
        unit: validateStringField(item.unit, 'unit', false),
        category: validateStringField(item.category, 'category', false) || 'Other',
        notes: validateStringField(item.notes, 'notes', false),
        checked: false
      }))

      const { data, error } = await supabase
        .from(this.itemsTableName)
        .insert(normalizedItems)
        .select()

      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Failed to bulk add items:', error)
      throw error
    }
  }

  // Uncheck all items in shopping list
  async bulkUncheckItems(listId) {
    try {
      const userId = await this.getUserId()
      
      const { error } = await supabase
        .from(this.itemsTableName)
        .update({
          checked: false,
          checked_at: null
        })
        .eq('shopping_list_id', listId)
        .eq('user_id', userId)

      if (error) throw error
      return true
    } catch (error) {
      console.error('Failed to bulk uncheck items:', error)
      throw error
    }
  }
}

export const supabaseShoppingListService = new SupabaseShoppingListService()

