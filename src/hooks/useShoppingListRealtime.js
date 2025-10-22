import { useState, useEffect, useRef } from 'react'
import { supabase, isSupabaseConfigured } from '../lib/supabase.js'
import { authService } from '../services/authService.js'

/**
 * Custom hook for real-time shopping list synchronization
 * @param {number} listId - Shopping list ID to subscribe to
 * @param {Object} options - Configuration options
 * @returns {Object} - { items, isLoading, error, isConnected }
 */
export function useShoppingListRealtime(listId, options = {}) {
  const [items, setItems] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const [isConnected, setIsConnected] = useState(false)
  
  const subscriptionRef = useRef(null)
  const isMountedRef = useRef(true)

  // Configuration options
  const {
    onConflict = 'last-write-wins',
    queueDuringDrag = true,
    enableRealtime = true
  } = options

  useEffect(() => {
    // Only enable real-time if Supabase is configured and user is authenticated
    if (!isSupabaseConfigured() || !authService.isAuthenticated() || !enableRealtime) {
      setIsLoading(false)
      setIsConnected(false)
      return
    }

    if (!listId) {
      setIsLoading(false)
      return
    }

    let mounted = true

    const setupRealtimeSubscription = async () => {
      try {
        setIsLoading(true)
        setError(null)

        // Initial fetch of items
        const { data: initialItems, error: fetchError } = await supabase
          .from('shopping_list_items')
          .select('*')
          .eq('shopping_list_id', listId)
          .order('category', { ascending: true })
          .order('created_at', { ascending: true })

        if (fetchError) {
          throw fetchError
        }

        if (mounted) {
          setItems(initialItems || [])
          setIsLoading(false)
        }

        // Set up real-time subscription
        const subscription = supabase
          .channel(`shopping_list_items_${listId}`)
          .on(
            'postgres_changes',
            {
              event: '*',
              schema: 'public',
              table: 'shopping_list_items',
              filter: `shopping_list_id=eq.${listId}`
            },
            (payload) => {
              if (!mounted) return

              console.log('Real-time shopping list update:', payload)

              setItems(currentItems => {
                const { eventType, new: newRecord, old: oldRecord } = payload

                switch (eventType) {
                  case 'INSERT':
                    // Add new item
                    return [...currentItems, newRecord]
                  
                  case 'UPDATE':
                    // Update existing item
                    return currentItems.map(item => 
                      item.id === newRecord.id ? newRecord : item
                    )
                  
                  case 'DELETE':
                    // Remove deleted item
                    return currentItems.filter(item => item.id !== oldRecord.id)
                  
                  default:
                    return currentItems
                }
              })

              setIsConnected(true)
            }
          )
          .subscribe((status) => {
            if (mounted) {
              console.log('Shopping list subscription status:', status)
              setIsConnected(status === 'SUBSCRIBED')
            }
          })

        subscriptionRef.current = subscription

      } catch (err) {
        console.error('Failed to setup shopping list real-time subscription:', err)
        if (mounted) {
          setError(err.message)
          setIsLoading(false)
          setIsConnected(false)
        }
      }
    }

    setupRealtimeSubscription()

    // Cleanup function
    return () => {
      mounted = false
      isMountedRef.current = false
      
      if (subscriptionRef.current) {
        console.log('Unsubscribing from shopping list real-time updates')
        supabase.removeChannel(subscriptionRef.current)
        subscriptionRef.current = null
      }
    }
  }, [listId, enableRealtime])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isMountedRef.current = false
      if (subscriptionRef.current) {
        supabase.removeChannel(subscriptionRef.current)
      }
    }
  }, [])

  return {
    items,
    isLoading,
    error,
    isConnected
  }
}

/**
 * Hook for managing shopping list state with real-time sync
 * @param {number} listId - Shopping list ID
 * @param {Object} options - Configuration options
 * @returns {Object} - Shopping list state and actions
 */
export function useShoppingList(listId, options = {}) {
  const { items, isLoading, error, isConnected } = useShoppingListRealtime(listId, options)
  
  const [isAdding, setIsAdding] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  // Group items by category
  const itemsByCategory = items.reduce((acc, item) => {
    const category = item.category || 'Other'
    if (!acc[category]) {
      acc[category] = []
    }
    acc[category].push(item)
    return acc
  }, {})

  // Separate checked and unchecked items
  const uncheckedItems = items.filter(item => !item.checked)
  const checkedItems = items.filter(item => item.checked)

  return {
    // Data
    items,
    itemsByCategory,
    uncheckedItems,
    checkedItems,
    
    // Loading states
    isLoading,
    isAdding,
    isUpdating,
    isDeleting,
    
    // Connection state
    isConnected,
    error,
    
    // Computed values
    totalItems: items.length,
    checkedCount: checkedItems.length,
    uncheckedCount: uncheckedItems.length,
    categories: Object.keys(itemsByCategory)
  }
}

