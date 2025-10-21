/**
 * @fileoverview React hooks for optimistic updates integration
 * 
 * Provides React hooks that integrate optimistic updates with service operations,
 * providing immediate UI feedback with automatic rollback on failure.
 */

import React from 'react'
import { 
  useOptimisticUpdates, 
  optimisticUpdateManager,
  withOptimisticUpdates 
} from '../utils/optimisticUpdates.jsx'
import { useServiceOperation } from '../hooks/useServiceOperations.js'

/**
 * Hook for optimistic service operations
 * @param {Function} serviceMethod - Service method to wrap
 * @param {Object} options - Configuration options
 * @returns {Object} Optimistic service operation utilities
 */
export function useOptimisticServiceOperation(serviceMethod, options = {}) {
  const {
    entityType = 'unknown',
    getEntityId = (args) => args[0]?.id || 'unknown',
    createOptimisticData = (args) => args[0],
    getOriginalData = (args) => null,
    updateType = 'update',
    operation = 'Operation',
    loadingType = 'update',
    onSuccess = null,
    onError = null,
    enableOptimisticUpdates = true
  } = options

  const [data, setData] = React.useState(null)
  const [error, setError] = React.useState(null)
  const [isSuccess, setIsSuccess] = React.useState(false)
  const [isOptimistic, setIsOptimistic] = React.useState(false)

  // Get optimistic update state for the current entity
  const { pendingUpdates, isOptimistic: hasPendingUpdates } = useOptimisticUpdates(
    entityType, 
    getEntityId([data])
  )

  React.useEffect(() => {
    setIsOptimistic(hasPendingUpdates)
  }, [hasPendingUpdates])

  // Wrap service method with optimistic updates
  const optimisticServiceMethod = React.useMemo(() => {
    if (!enableOptimisticUpdates) return serviceMethod

    return withOptimisticUpdates(serviceMethod, operation, {
      entityType,
      getEntityId,
      createOptimisticData,
      getOriginalData,
      updateType
    })
  }, [serviceMethod, enableOptimisticUpdates, entityType, getEntityId, createOptimisticData, getOriginalData, updateType, operation])

  // Use the regular service operation hook with optimistic method
  const serviceOperation = useServiceOperation(optimisticServiceMethod, {
    operation,
    loadingType,
    onSuccess: (result) => {
      setData(result)
      setIsSuccess(true)
      onSuccess?.(result)
    },
    onError: (err) => {
      setError(err)
      onError?.(err)
    }
  })

  const executeOptimistic = React.useCallback(async (...args) => {
    const entityId = getEntityId(args)
    const optimisticData = createOptimisticData(args)
    const originalData = getOriginalData(args)

    // Immediately update UI with optimistic data
    if (enableOptimisticUpdates && optimisticData) {
      setData(optimisticData)
      setIsOptimistic(true)
    }

    try {
      const result = await serviceOperation.execute(...args)
      return result
    } catch (error) {
      // Rollback optimistic data on error
      if (enableOptimisticUpdates && originalData) {
        setData(originalData)
      }
      throw error
    }
  }, [serviceOperation.execute, enableOptimisticUpdates, getEntityId, createOptimisticData, getOriginalData])

  return {
    ...serviceOperation,
    execute: executeOptimistic,
    isOptimistic,
    pendingUpdates,
    data: isOptimistic ? data : serviceOperation.data,
    error: serviceOperation.error,
    isSuccess: serviceOperation.isSuccess
  }
}

/**
 * Hook for optimistic CRUD operations
 * @param {Object} service - Service object with CRUD methods
 * @param {string} entityType - Type of entity
 * @param {Object} options - Configuration options
 * @returns {Object} Optimistic CRUD utilities
 */
export function useOptimisticCRUD(service, entityType, options = {}) {
  const {
    getEntityId = (item) => item?.id || 'unknown',
    createOptimisticItem = (data) => ({ ...data, id: `temp_${Date.now()}` }),
    updateOptimisticItem = (original, updates) => ({ ...original, ...updates }),
    deleteOptimisticItem = (item) => ({ ...item, _deleted: true })
  } = options

  const [items, setItems] = React.useState([])
  const [isOptimistic, setIsOptimistic] = React.useState(false)

  // Optimistic create operation
  const createOptimistic = React.useCallback(async (data) => {
    const optimisticItem = createOptimisticItem(data)
    
    // Immediately add to UI
    setItems(prev => [...prev, optimisticItem])
    setIsOptimistic(true)

    try {
      const result = await service.add(data)
      
      // Replace optimistic item with real result
      setItems(prev => prev.map(item => 
        item.id === optimisticItem.id ? result : item
      ))
      
      return result
    } catch (error) {
      // Remove optimistic item on error
      setItems(prev => prev.filter(item => item.id !== optimisticItem.id))
      throw error
    } finally {
      setIsOptimistic(false)
    }
  }, [service, createOptimisticItem])

  // Optimistic update operation
  const updateOptimistic = React.useCallback(async (id, updates) => {
    const originalItem = items.find(item => item.id === id)
    if (!originalItem) throw new Error('Item not found')

    const optimisticItem = updateOptimisticItem(originalItem, updates)
    
    // Immediately update UI
    setItems(prev => prev.map(item => 
      item.id === id ? optimisticItem : item
    ))
    setIsOptimistic(true)

    try {
      const result = await service.update(id, updates)
      
      // Replace with real result
      setItems(prev => prev.map(item => 
        item.id === id ? result : item
      ))
      
      return result
    } catch (error) {
      // Rollback to original item
      setItems(prev => prev.map(item => 
        item.id === id ? originalItem : item
      ))
      throw error
    } finally {
      setIsOptimistic(false)
    }
  }, [service, items, updateOptimisticItem])

  // Optimistic delete operation
  const deleteOptimistic = React.useCallback(async (id) => {
    const originalItem = items.find(item => item.id === id)
    if (!originalItem) throw new Error('Item not found')

    const optimisticItem = deleteOptimisticItem(originalItem)
    
    // Immediately update UI (mark as deleted)
    setItems(prev => prev.map(item => 
      item.id === id ? optimisticItem : item
    ))
    setIsOptimistic(true)

    try {
      await service.delete(id)
      
      // Remove from UI
      setItems(prev => prev.filter(item => item.id !== id))
      
      return true
    } catch (error) {
      // Rollback to original item
      setItems(prev => prev.map(item => 
        item.id === id ? originalItem : item
      ))
      throw error
    } finally {
      setIsOptimistic(false)
    }
  }, [service, items, deleteOptimisticItem])

  // Load items
  const loadItems = React.useCallback(async () => {
    try {
      const result = await service.getAll()
      if (result.success) {
        setItems(result.data)
      }
    } catch (error) {
      console.error('Failed to load items:', error)
    }
  }, [service])

  // Load items on mount
  React.useEffect(() => {
    loadItems()
  }, [loadItems])

  return {
    items,
    isOptimistic,
    create: createOptimistic,
    update: updateOptimistic,
    delete: deleteOptimistic,
    loadItems,
    refresh: loadItems
  }
}

/**
 * Hook for optimistic form operations
 * @param {Object} formData - Initial form data
 * @param {Function} onSubmit - Submit function
 * @param {Object} options - Configuration options
 * @returns {Object} Optimistic form utilities
 */
export function useOptimisticForm(formData, onSubmit, options = {}) {
  const {
    entityType = 'form',
    entityId = 'unknown',
    enableAutoSave = false,
    autoSaveDelay = 2000,
    onOptimisticChange = null
  } = options

  const [data, setData] = React.useState(formData)
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [isOptimistic, setIsOptimistic] = React.useState(false)
  const [lastSaved, setLastSaved] = React.useState(null)

  const { createOptimisticUpdate, markSuccess, markFailed } = useOptimisticUpdates(entityType, entityId)

  // Auto-save functionality
  React.useEffect(() => {
    if (!enableAutoSave) return

    const timer = setTimeout(() => {
      if (data !== formData) {
        handleOptimisticSubmit(data)
      }
    }, autoSaveDelay)

    return () => clearTimeout(timer)
  }, [data, formData, enableAutoSave, autoSaveDelay])

  const handleOptimisticSubmit = React.useCallback(async (submitData) => {
    const update = createOptimisticUpdate({
      type: 'update',
      optimisticData: submitData,
      originalData: formData
    })

    setIsOptimistic(true)
    setIsSubmitting(true)

    try {
      const result = await onSubmit(submitData)
      markSuccess(update.id, result)
      setLastSaved(new Date())
      return result
    } catch (error) {
      markFailed(update.id, 'submit_error', error)
      throw error
    } finally {
      setIsSubmitting(false)
      setIsOptimistic(false)
    }
  }, [onSubmit, formData, createOptimisticUpdate, markSuccess, markFailed])

  const handleChange = React.useCallback((field, value) => {
    const newData = { ...data, [field]: value }
    setData(newData)
    onOptimisticChange?.(newData)
  }, [data, onOptimisticChange])

  const handleSubmit = React.useCallback(async (e) => {
    e?.preventDefault()
    return handleOptimisticSubmit(data)
  }, [data, handleOptimisticSubmit])

  return {
    data,
    isSubmitting,
    isOptimistic,
    lastSaved,
    handleChange,
    handleSubmit,
    setData
  }
}

/**
 * Hook for optimistic list operations
 * @param {Array} initialItems - Initial list items
 * @param {Object} options - Configuration options
 * @returns {Object} Optimistic list utilities
 */
export function useOptimisticList(initialItems = [], options = {}) {
  const {
    entityType = 'list',
    getItemId = (item) => item?.id || 'unknown',
    createOptimisticItem = (data) => ({ ...data, id: `temp_${Date.now()}` }),
    updateOptimisticItem = (original, updates) => ({ ...original, ...updates }),
    deleteOptimisticItem = (item) => ({ ...item, _deleted: true })
  } = options

  const [items, setItems] = React.useState(initialItems)
  const [isOptimistic, setIsOptimistic] = React.useState(false)

  const addItem = React.useCallback((item) => {
    const optimisticItem = createOptimisticItem(item)
    setItems(prev => [...prev, optimisticItem])
    setIsOptimistic(true)
    return optimisticItem
  }, [createOptimisticItem])

  const updateItem = React.useCallback((id, updates) => {
    setItems(prev => prev.map(item => 
      getItemId(item) === id ? updateOptimisticItem(item, updates) : item
    ))
    setIsOptimistic(true)
  }, [getItemId, updateOptimisticItem])

  const removeItem = React.useCallback((id) => {
    setItems(prev => prev.map(item => 
      getItemId(item) === id ? deleteOptimisticItem(item) : item
    ))
    setIsOptimistic(true)
  }, [getItemId, deleteOptimisticItem])

  const replaceItem = React.useCallback((id, newItem) => {
    setItems(prev => prev.map(item => 
      getItemId(item) === id ? newItem : item
    ))
    setIsOptimistic(false)
  }, [getItemId])

  const rollbackItem = React.useCallback((id, originalItem) => {
    setItems(prev => prev.map(item => 
      getItemId(item) === id ? originalItem : item
    ))
    setIsOptimistic(false)
  }, [getItemId])

  const setItemsOptimistic = React.useCallback((newItems) => {
    setItems(newItems)
    setIsOptimistic(true)
  }, [])

  const setItemsConfirmed = React.useCallback((newItems) => {
    setItems(newItems)
    setIsOptimistic(false)
  }, [])

  return {
    items,
    isOptimistic,
    addItem,
    updateItem,
    removeItem,
    replaceItem,
    rollbackItem,
    setItemsOptimistic,
    setItemsConfirmed,
    setItems
  }
}

/**
 * Hook for optimistic search operations
 * @param {Function} searchFunction - Search function
 * @param {Object} options - Configuration options
 * @returns {Object} Optimistic search utilities
 */
export function useOptimisticSearch(searchFunction, options = {}) {
  const {
    debounceDelay = 300,
    minQueryLength = 2,
    enableOptimisticResults = true
  } = options

  const [query, setQuery] = React.useState('')
  const [results, setResults] = React.useState([])
  const [isSearching, setIsSearching] = React.useState(false)
  const [isOptimistic, setIsOptimistic] = React.useState(false)
  const [lastQuery, setLastQuery] = React.useState('')

  const debouncedSearch = React.useMemo(() => {
    let timeoutId
    return (searchQuery) => {
      clearTimeout(timeoutId)
      timeoutId = setTimeout(async () => {
        if (searchQuery.length < minQueryLength) {
          setResults([])
          setIsSearching(false)
          return
        }

        setIsSearching(true)
        setIsOptimistic(enableOptimisticResults)

        try {
          const searchResults = await searchFunction(searchQuery)
          setResults(searchResults)
          setLastQuery(searchQuery)
        } catch (error) {
          console.error('Search failed:', error)
          setResults([])
        } finally {
          setIsSearching(false)
          setIsOptimistic(false)
        }
      }, debounceDelay)
    }
  }, [searchFunction, debounceDelay, minQueryLength, enableOptimisticResults])

  const handleSearch = React.useCallback((newQuery) => {
    setQuery(newQuery)
    debouncedSearch(newQuery)
  }, [debouncedSearch])

  const clearSearch = React.useCallback(() => {
    setQuery('')
    setResults([])
    setIsSearching(false)
    setIsOptimistic(false)
  }, [])

  return {
    query,
    results,
    isSearching,
    isOptimistic,
    lastQuery,
    handleSearch,
    clearSearch,
    setQuery
  }
}
