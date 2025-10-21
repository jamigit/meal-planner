/**
 * @fileoverview React hooks for service operations with error handling and loading states
 * 
 * Provides React hooks that automatically handle loading states, error handling,
 * and response formatting for service operations.
 */

import { useState, useEffect, useCallback, useRef } from 'react'
import { useLoadingState } from '../utils/loadingStates.js'
import { normalizeError, logError } from '../utils/errorHandling.js'
import { useRequestLifecycle, useMemoryLeakPrevention } from '../utils/requestLifecycle.js'

/**
 * Hook for async service operations with automatic error handling and loading states
 * @param {Function} serviceMethod - The service method to call
 * @param {Object} options - Configuration options
 * @returns {Object} Operation state and controls
 */
export function useServiceOperation(serviceMethod, options = {}) {
  const {
    immediate = false,
    dependencies = [],
    onSuccess = null,
    onError = null,
    operation = 'Operation',
    loadingType = 'update'
  } = options

  const [data, setData] = useState(null)
  const [error, setError] = useState(null)
  const [isSuccess, setIsSuccess] = useState(false)
  const loadingState = useLoadingState(operation)
  const abortControllerRef = useRef(null)

  const execute = useCallback(async (...args) => {
    // Cancel previous request if still running
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }

    // Create new abort controller
    abortControllerRef.current = new AbortController()
    
    try {
      loadingState.startLoading(loadingType, operation)
      setError(null)
      setIsSuccess(false)

      const result = await serviceMethod(...args)
      
      // Check if request was aborted
      if (abortControllerRef.current?.signal.aborted) {
        return
      }

      if (result.success) {
        setData(result.data)
        setIsSuccess(true)
        onSuccess?.(result.data)
      } else {
        setError(result.error)
        onError?.(result.error)
      }
    } catch (err) {
      if (!abortControllerRef.current?.signal.aborted) {
        const errorResponse = normalizeError(err)
        setError(errorResponse.error)
        logError(errorResponse, `useServiceOperation:${operation}`)
        onError?.(errorResponse.error)
      }
    } finally {
      if (!abortControllerRef.current?.signal.aborted) {
        loadingState.stopLoading()
      }
    }
  }, [serviceMethod, loadingType, operation, onSuccess, onError])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
    }
  }, [])

  // Execute immediately if requested
  useEffect(() => {
    if (immediate) {
      execute(...dependencies)
    }
  }, [immediate, execute, ...dependencies])

  const reset = useCallback(() => {
    setData(null)
    setError(null)
    setIsSuccess(false)
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }
  }, [])

  return {
    data,
    error,
    isSuccess,
    isLoading: loadingState.isLoading,
    loadingType: loadingState.type,
    loadingMessage: loadingState.message,
    execute,
    reset
  }
}

/**
 * Hook for fetching data with automatic retry and caching
 * @param {Function} fetchFunction - Function that returns a promise
 * @param {Object} options - Configuration options
 * @returns {Object} Fetch state and controls
 */
export function useFetch(fetchFunction, options = {}) {
  const {
    immediate = true,
    dependencies = [],
    retryCount = 3,
    retryDelay = 1000,
    cacheTime = 5 * 60 * 1000, // 5 minutes
    staleTime = 1 * 60 * 1000, // 1 minute
    onSuccess = null,
    onError = null
  } = options

  const [data, setData] = useState(null)
  const [error, setError] = useState(null)
  const [isStale, setIsStale] = useState(false)
  const loadingState = useLoadingState('Fetching data')
  const cacheRef = useRef(new Map())
  const lastFetchRef = useRef(0)
  const retryCountRef = useRef(0)

  const fetchData = useCallback(async (forceRefresh = false) => {
    const now = Date.now()
    const cacheKey = JSON.stringify(dependencies)
    const cachedData = cacheRef.current.get(cacheKey)
    
    // Use cached data if available and not stale
    if (!forceRefresh && cachedData && (now - lastFetchRef.current) < staleTime) {
      setData(cachedData.data)
      setIsStale(false)
      return cachedData.data
    }

    // Mark as stale if using cached data
    if (cachedData && (now - lastFetchRef.current) >= staleTime) {
      setIsStale(true)
    }

    try {
      loadingState.startLoading('initial', 'Fetching data')
      setError(null)

      const result = await fetchFunction(...dependencies)
      
      if (result.success) {
        setData(result.data)
        setIsStale(false)
        lastFetchRef.current = now
        
        // Cache the result
        cacheRef.current.set(cacheKey, {
          data: result.data,
          timestamp: now
        })
        
        // Clear cache after cacheTime
        setTimeout(() => {
          cacheRef.current.delete(cacheKey)
        }, cacheTime)
        
        retryCountRef.current = 0
        onSuccess?.(result.data)
        return result.data
      } else {
        throw new Error(result.error.message)
      }
    } catch (err) {
      const errorResponse = normalizeError(err)
      setError(errorResponse.error)
      logError(errorResponse, 'useFetch')
      
      // Retry logic
      if (retryCountRef.current < retryCount) {
        retryCountRef.current++
        setTimeout(() => {
          fetchData(forceRefresh)
        }, retryDelay * retryCountRef.current)
      } else {
        onError?.(errorResponse.error)
      }
    } finally {
      loadingState.stopLoading()
    }
  }, [fetchFunction, dependencies, retryCount, retryDelay, cacheTime, staleTime, onSuccess, onError])

  const refresh = useCallback(() => {
    return fetchData(true)
  }, [fetchData])

  const invalidateCache = useCallback(() => {
    cacheRef.current.clear()
    lastFetchRef.current = 0
  }, [])

  // Execute on mount and when dependencies change
  useEffect(() => {
    if (immediate) {
      fetchData()
    }
  }, [immediate, fetchData])

  return {
    data,
    error,
    isLoading: loadingState.isLoading,
    isStale,
    fetchData,
    refresh,
    invalidateCache
  }
}

/**
 * Hook for mutations (create, update, delete operations)
 * @param {Function} mutationFunction - The mutation function
 * @param {Object} options - Configuration options
 * @returns {Object} Mutation state and controls
 */
export function useMutation(mutationFunction, options = {}) {
  const {
    onSuccess = null,
    onError = null,
    optimisticUpdate = null,
    rollbackOnError = true,
    operation = 'Mutation'
  } = options

  const [data, setData] = useState(null)
  const [error, setError] = useState(null)
  const [isSuccess, setIsSuccess] = useState(false)
  const loadingState = useLoadingState(operation)
  const originalDataRef = useRef(null)

  const mutate = useCallback(async (...args) => {
    try {
      loadingState.startLoading('update', operation)
      setError(null)
      setIsSuccess(false)

      // Store original data for rollback
      if (optimisticUpdate && rollbackOnError) {
        originalDataRef.current = optimisticUpdate.getCurrentData?.()
      }

      // Apply optimistic update
      if (optimisticUpdate) {
        optimisticUpdate.apply(...args)
      }

      const result = await mutationFunction(...args)
      
      if (result.success) {
        setData(result.data)
        setIsSuccess(true)
        onSuccess?.(result.data)
        return result.data
      } else {
        throw new Error(result.error.message)
      }
    } catch (err) {
      const errorResponse = normalizeError(err)
      setError(errorResponse.error)
      logError(errorResponse, `useMutation:${operation}`)
      
      // Rollback optimistic update
      if (optimisticUpdate && rollbackOnError && originalDataRef.current) {
        optimisticUpdate.rollback(originalDataRef.current)
      }
      
      onError?.(errorResponse.error)
      throw errorResponse.error
    } finally {
      loadingState.stopLoading()
    }
  }, [mutationFunction, optimisticUpdate, rollbackOnError, operation, onSuccess, onError])

  const reset = useCallback(() => {
    setData(null)
    setError(null)
    setIsSuccess(false)
  }, [])

  return {
    data,
    error,
    isSuccess,
    isLoading: loadingState.isLoading,
    mutate,
    reset
  }
}

/**
 * Hook for managing multiple related data fetches
 * @param {Object} fetchConfigs - Configuration for each fetch operation
 * @returns {Object} Combined state and controls
 */
export function useMultipleFetches(fetchConfigs) {
  const [results, setResults] = useState({})
  const [errors, setErrors] = useState({})
  const [isLoading, setIsLoading] = useState(false)
  const loadingState = useLoadingState('Multiple fetches')

  const fetchAll = useCallback(async () => {
    setIsLoading(true)
    loadingState.startLoading('initial', 'Loading data')
    
    const promises = Object.entries(fetchConfigs).map(async ([key, config]) => {
      try {
        const result = await config.fetchFunction(...(config.dependencies || []))
        return { key, result, error: null }
      } catch (error) {
        return { key, result: null, error: normalizeError(error).error }
      }
    })

    const results = await Promise.all(promises)
    
    const newResults = {}
    const newErrors = {}
    
    results.forEach(({ key, result, error }) => {
      if (error) {
        newErrors[key] = error
      } else {
        newResults[key] = result.success ? result.data : null
      }
    })
    
    setResults(newResults)
    setErrors(newErrors)
    setIsLoading(false)
    loadingState.stopLoading()
  }, [fetchConfigs])

  const refresh = useCallback(() => {
    return fetchAll()
  }, [fetchAll])

  useEffect(() => {
    fetchAll()
  }, [fetchAll])

  return {
    results,
    errors,
    isLoading,
    fetchAll,
    refresh
  }
}
