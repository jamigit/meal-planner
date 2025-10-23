import React from 'react'
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useShoppingListRealtime, useShoppingList } from '../useShoppingListRealtime.js'
import { supabase } from '../../lib/supabase.js'
import { authService } from '../../services/authService.js'

// Mock dependencies
vi.mock('../../lib/supabase.js', () => ({
  supabase: {
    from: vi.fn(),
    channel: vi.fn(),
    removeChannel: vi.fn()
  },
  isSupabaseConfigured: vi.fn()
}))

vi.mock('../../services/authService.js', () => ({
  authService: {
    isAuthenticated: vi.fn()
  }
}))

describe('useShoppingListRealtime', () => {
  let mockQuery
  let mockChannel
  let mockSubscription

  beforeEach(() => {
    vi.clearAllMocks()
    
    // Setup mock query chain
    mockQuery = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis()
    }
    
    // Setup mock channel/subscription
    mockSubscription = {
      on: vi.fn().mockReturnThis(),
      subscribe: vi.fn()
    }
    
    mockChannel = {
      on: vi.fn().mockReturnValue(mockSubscription)
    }
    
    supabase.from.mockReturnValue(mockQuery)
    supabase.channel.mockReturnValue(mockChannel)
    
    // Default mocks
    authService.isAuthenticated.mockReturnValue(true)
    vi.mocked(require('../../lib/supabase.js').isSupabaseConfigured).mockReturnValue(true)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('useShoppingListRealtime', () => {
    it('should initialize with loading state', () => {
      const { result } = renderHook(() => useShoppingListRealtime(1))

      expect(result.current.isLoading).toBe(true)
      expect(result.current.items).toEqual([])
      expect(result.current.error).toBe(null)
      expect(result.current.isConnected).toBe(false)
    })

    it('should fetch initial items and setup subscription', async () => {
      const mockItems = [
        { id: 1, name: 'Apple', category: 'Produce', checked: false },
        { id: 2, name: 'Milk', category: 'Dairy', checked: true }
      ]
      
      mockQuery.select.mockResolvedValue({ data: mockItems, error: null })
      mockSubscription.subscribe.mockImplementation((callback) => {
        callback('SUBSCRIBED')
        return mockSubscription
      })

      const { result } = renderHook(() => useShoppingListRealtime(1))

      // Wait for async operations
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0))
      })

      expect(result.current.items).toEqual(mockItems)
      expect(result.current.isLoading).toBe(false)
      expect(result.current.isConnected).toBe(true)
      expect(supabase.channel).toHaveBeenCalledWith('shopping_list_items_1')
    })

    it('should handle real-time INSERT events', async () => {
      const initialItems = [{ id: 1, name: 'Apple', category: 'Produce', checked: false }]
      const newItem = { id: 2, name: 'Banana', category: 'Produce', checked: false }
      
      mockQuery.select.mockResolvedValue({ data: initialItems, error: null })
      
      let eventCallback
      mockSubscription.on.mockImplementation((type, config, callback) => {
        if (type === 'postgres_changes') {
          eventCallback = callback
        }
        return mockSubscription
      })
      mockSubscription.subscribe.mockImplementation((callback) => {
        callback('SUBSCRIBED')
        return mockSubscription
      })

      const { result } = renderHook(() => useShoppingListRealtime(1))

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0))
      })

      // Simulate INSERT event
      await act(async () => {
        eventCallback({
          eventType: 'INSERT',
          new: newItem
        })
      })

      expect(result.current.items).toEqual([...initialItems, newItem])
    })

    it('should handle real-time UPDATE events', async () => {
      const items = [
        { id: 1, name: 'Apple', category: 'Produce', checked: false },
        { id: 2, name: 'Milk', category: 'Dairy', checked: true }
      ]
      const updatedItem = { id: 1, name: 'Green Apple', category: 'Produce', checked: false }
      
      mockQuery.select.mockResolvedValue({ data: items, error: null })
      
      let eventCallback
      mockSubscription.on.mockImplementation((type, config, callback) => {
        if (type === 'postgres_changes') {
          eventCallback = callback
        }
        return mockSubscription
      })
      mockSubscription.subscribe.mockImplementation((callback) => {
        callback('SUBSCRIBED')
        return mockSubscription
      })

      const { result } = renderHook(() => useShoppingListRealtime(1))

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0))
      })

      // Simulate UPDATE event
      await act(async () => {
        eventCallback({
          eventType: 'UPDATE',
          new: updatedItem
        })
      })

      expect(result.current.items).toEqual([updatedItem, items[1]])
    })

    it('should handle real-time DELETE events', async () => {
      const items = [
        { id: 1, name: 'Apple', category: 'Produce', checked: false },
        { id: 2, name: 'Milk', category: 'Dairy', checked: true }
      ]
      
      mockQuery.select.mockResolvedValue({ data: items, error: null })
      
      let eventCallback
      mockSubscription.on.mockImplementation((type, config, callback) => {
        if (type === 'postgres_changes') {
          eventCallback = callback
        }
        return mockSubscription
      })
      mockSubscription.subscribe.mockImplementation((callback) => {
        callback('SUBSCRIBED')
        return mockSubscription
      })

      const { result } = renderHook(() => useShoppingListRealtime(1))

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0))
      })

      // Simulate DELETE event
      await act(async () => {
        eventCallback({
          eventType: 'DELETE',
          old: { id: 1 }
        })
      })

      expect(result.current.items).toEqual([items[1]])
    })

    it('should handle connection errors', async () => {
      mockQuery.select.mockRejectedValue(new Error('Connection failed'))

      const { result } = renderHook(() => useShoppingListRealtime(1))

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0))
      })

      expect(result.current.error).toBe('Connection failed')
      expect(result.current.isLoading).toBe(false)
      expect(result.current.isConnected).toBe(false)
    })

    it('should not setup subscription when Supabase not configured', async () => {
      vi.mocked(require('../../lib/supabase.js').isSupabaseConfigured).mockReturnValue(false)

      const { result } = renderHook(() => useShoppingListRealtime(1))

      expect(result.current.isLoading).toBe(false)
      expect(result.current.isConnected).toBe(false)
      expect(supabase.channel).not.toHaveBeenCalled()
    })

    it('should not setup subscription when user not authenticated', async () => {
      authService.isAuthenticated.mockReturnValue(false)

      const { result } = renderHook(() => useShoppingListRealtime(1))

      expect(result.current.isLoading).toBe(false)
      expect(result.current.isConnected).toBe(false)
      expect(supabase.channel).not.toHaveBeenCalled()
    })

    it('should cleanup subscription on unmount', async () => {
      mockQuery.select.mockResolvedValue({ data: [], error: null })
      mockSubscription.subscribe.mockImplementation((callback) => {
        callback('SUBSCRIBED')
        return mockSubscription
      })

      const { unmount } = renderHook(() => useShoppingListRealtime(1))

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0))
      })

      unmount()

      expect(supabase.removeChannel).toHaveBeenCalledWith(mockSubscription)
    })

    it('should not setup subscription when listId is null', () => {
      const { result } = renderHook(() => useShoppingListRealtime(null))

      expect(result.current.isLoading).toBe(false)
      expect(supabase.channel).not.toHaveBeenCalled()
    })

    it('should handle subscription status changes', async () => {
      mockQuery.select.mockResolvedValue({ data: [], error: null })
      
      let statusCallback
      mockSubscription.subscribe.mockImplementation((callback) => {
        statusCallback = callback
        return mockSubscription
      })

      const { result } = renderHook(() => useShoppingListRealtime(1))

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0))
      })

      // Simulate status change
      await act(async () => {
        statusCallback('SUBSCRIBED')
      })

      expect(result.current.isConnected).toBe(true)

      await act(async () => {
        statusCallback('CHANNEL_ERROR')
      })

      expect(result.current.isConnected).toBe(false)
    })
  })

  describe('useShoppingList', () => {
    it('should return computed values and grouped items', async () => {
      const mockItems = [
        { id: 1, name: 'Apple', category: 'Produce', checked: false },
        { id: 2, name: 'Milk', category: 'Dairy', checked: true },
        { id: 3, name: 'Banana', category: 'Produce', checked: false }
      ]
      
      mockQuery.select.mockResolvedValue({ data: mockItems, error: null })
      mockSubscription.subscribe.mockImplementation((callback) => {
        callback('SUBSCRIBED')
        return mockSubscription
      })

      const { result } = renderHook(() => useShoppingList(1))

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0))
      })

      expect(result.current.items).toEqual(mockItems)
      expect(result.current.totalItems).toBe(3)
      expect(result.current.checkedCount).toBe(1)
      expect(result.current.uncheckedCount).toBe(2)
      expect(result.current.uncheckedItems).toHaveLength(2)
      expect(result.current.checkedItems).toHaveLength(1)
      expect(result.current.itemsByCategory).toEqual({
        'Produce': [
          { id: 1, name: 'Apple', category: 'Produce', checked: false },
          { id: 3, name: 'Banana', category: 'Produce', checked: false }
        ],
        'Dairy': [
          { id: 2, name: 'Milk', category: 'Dairy', checked: true }
        ]
      })
      expect(result.current.categories).toEqual(['Dairy', 'Produce'])
    })

    it('should handle items without category', async () => {
      const mockItems = [
        { id: 1, name: 'Apple', checked: false },
        { id: 2, name: 'Milk', category: null, checked: true }
      ]
      
      mockQuery.select.mockResolvedValue({ data: mockItems, error: null })
      mockSubscription.subscribe.mockImplementation((callback) => {
        callback('SUBSCRIBED')
        return mockSubscription
      })

      const { result } = renderHook(() => useShoppingList(1))

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0))
      })

      expect(result.current.itemsByCategory).toEqual({
        'Other': [
          { id: 1, name: 'Apple', checked: false },
          { id: 2, name: 'Milk', category: null, checked: true }
        ]
      })
    })
  })
})
