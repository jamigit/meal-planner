/**
 * @fileoverview Enhanced React hooks with request lifecycle management
 * 
 * Provides React hooks that automatically handle request cancellation,
 * memory leak prevention, and request deduplication.
 */

import React from 'react'
import { useRequestLifecycle, useMemoryLeakPrevention } from '../utils/requestLifecycle.js'
import { useServiceOperation, useFetch, useMutation } from '../hooks/useServiceOperations.js'

/**
 * Enhanced service operation hook with request lifecycle management
 * @param {Function} serviceMethod - The service method to call
 * @param {Object} options - Configuration options
 * @returns {Object} Operation state and controls with lifecycle management
 */
export function useServiceOperationWithLifecycle(serviceMethod, options = {}) {
  const {
    operation = 'Operation',
    timeout = 30000,
    enableDeduplication = false,
    ...restOptions
  } = options

  const { isRequestActive, startRequest, cancelRequest } = useRequestLifecycle(operation)
  const { addCleanup, removeCleanup } = useMemoryLeakPrevention()

  // Enhanced service operation with lifecycle management
  const serviceOperation = useServiceOperation(serviceMethod, {
    ...restOptions,
    onSuccess: (data) => {
      addCleanup(() => cancelRequest())
      restOptions.onSuccess?.(data)
    },
    onError: (error) => {
      addCleanup(() => cancelRequest())
      restOptions.onError?.(error)
    }
  })

  const executeWithLifecycle = React.useCallback(async (...args) => {
    const signal = startRequest(timeout)
    
    try {
      const result = await serviceOperation.execute(...args)
      return result
    } catch (error) {
      if (error.name === 'AbortError' || error.message.includes('cancelled')) {
        throw new Error(`Operation ${operation} was cancelled`)
      }
      throw error
    }
  }, [serviceOperation.execute, startRequest, timeout, operation])

  return {
    ...serviceOperation,
    execute: executeWithLifecycle,
    isRequestActive,
    cancelRequest
  }
}

/**
 * Enhanced fetch hook with request lifecycle management
 * @param {Function} fetchFunction - Function that returns a promise
 * @param {Object} options - Configuration options
 * @returns {Object} Fetch state and controls with lifecycle management
 */
export function useFetchWithLifecycle(fetchFunction, options = {}) {
  const {
    operation = 'Fetch',
    timeout = 30000,
    enableDeduplication = false,
    ...restOptions
  } = options

  const { isRequestActive, startRequest, cancelRequest } = useRequestLifecycle(operation)
  const { addCleanup, removeCleanup } = useMemoryLeakPrevention()

  const fetchOperation = useFetch(fetchFunction, {
    ...restOptions,
    onSuccess: (data) => {
      addCleanup(() => cancelRequest())
      restOptions.onSuccess?.(data)
    },
    onError: (error) => {
      addCleanup(() => cancelRequest())
      restOptions.onError?.(error)
    }
  })

  const fetchDataWithLifecycle = React.useCallback(async (forceRefresh = false) => {
    const signal = startRequest(timeout)
    
    try {
      const result = await fetchOperation.fetchData(forceRefresh)
      return result
    } catch (error) {
      if (error.name === 'AbortError' || error.message.includes('cancelled')) {
        throw new Error(`Fetch ${operation} was cancelled`)
      }
      throw error
    }
  }, [fetchOperation.fetchData, startRequest, timeout, operation])

  return {
    ...fetchOperation,
    fetchData: fetchDataWithLifecycle,
    isRequestActive,
    cancelRequest
  }
}

/**
 * Enhanced mutation hook with request lifecycle management
 * @param {Function} mutationFunction - The mutation function
 * @param {Object} options - Configuration options
 * @returns {Object} Mutation state and controls with lifecycle management
 */
export function useMutationWithLifecycle(mutationFunction, options = {}) {
  const {
    operation = 'Mutation',
    timeout = 30000,
    ...restOptions
  } = options

  const { isRequestActive, startRequest, cancelRequest } = useRequestLifecycle(operation)
  const { addCleanup, removeCleanup } = useMemoryLeakPrevention()

  const mutationOperation = useMutation(mutationFunction, {
    ...restOptions,
    onSuccess: (data) => {
      addCleanup(() => cancelRequest())
      restOptions.onSuccess?.(data)
    },
    onError: (error) => {
      addCleanup(() => cancelRequest())
      restOptions.onError?.(error)
    }
  })

  const mutateWithLifecycle = React.useCallback(async (...args) => {
    const signal = startRequest(timeout)
    
    try {
      const result = await mutationOperation.mutate(...args)
      return result
    } catch (error) {
      if (error.name === 'AbortError' || error.message.includes('cancelled')) {
        throw new Error(`Mutation ${operation} was cancelled`)
      }
      throw error
    }
  }, [mutationOperation.mutate, startRequest, timeout, operation])

  return {
    ...mutationOperation,
    mutate: mutateWithLifecycle,
    isRequestActive,
    cancelRequest
  }
}

/**
 * Hook for managing multiple concurrent requests
 * @param {Object} requestConfigs - Configuration for each request
 * @returns {Object} Combined state and controls
 */
export function useMultipleRequestsWithLifecycle(requestConfigs) {
  const [activeRequests, setActiveRequests] = React.useState(new Set())
  const { addCleanup, removeCleanup } = useMemoryLeakPrevention()

  const executeRequest = React.useCallback(async (requestKey, requestFn) => {
    const requestId = `${requestKey}_${Date.now()}`
    
    setActiveRequests(prev => new Set([...prev, requestId]))
    
    const cleanup = () => {
      setActiveRequests(prev => {
        const newSet = new Set(prev)
        newSet.delete(requestId)
        return newSet
      })
    }
    
    addCleanup(cleanup)
    
    try {
      const result = await requestFn()
      return result
    } finally {
      cleanup()
      removeCleanup(cleanup)
    }
  }, [addCleanup, removeCleanup])

  const cancelAllRequests = React.useCallback(() => {
    setActiveRequests(new Set())
  }, [])

  return {
    activeRequests: Array.from(activeRequests),
    activeRequestCount: activeRequests.size,
    executeRequest,
    cancelAllRequests
  }
}

/**
 * Hook for automatic cleanup on component unmount
 * @param {Function} cleanupFn - Cleanup function to run on unmount
 */
export function useCleanupOnUnmount(cleanupFn) {
  const { addCleanup } = useMemoryLeakPrevention()
  
  React.useEffect(() => {
    addCleanup(cleanupFn)
    
    return () => {
      cleanupFn()
    }
  }, [cleanupFn, addCleanup])
}

/**
 * Hook for managing request timeouts
 * @param {number} timeout - Timeout in milliseconds
 * @returns {Object} Timeout management utilities
 */
export function useRequestTimeout(timeout = 30000) {
  const [isTimedOut, setIsTimedOut] = React.useState(false)
  const timeoutRef = React.useRef(null)
  const { addCleanup, removeCleanup } = useMemoryLeakPrevention()

  const startTimeout = React.useCallback(() => {
    setIsTimedOut(false)
    
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }
    
    timeoutRef.current = setTimeout(() => {
      setIsTimedOut(true)
    }, timeout)
    
    const cleanup = () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
        timeoutRef.current = null
      }
    }
    
    addCleanup(cleanup)
    
    return cleanup
  }, [timeout, addCleanup])

  const clearTimeout = React.useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
      timeoutRef.current = null
      setIsTimedOut(false)
    }
  }, [])

  React.useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [])

  return {
    isTimedOut,
    startTimeout,
    clearTimeout
  }
}

/**
 * Hook for request retry logic with exponential backoff
 * @param {Function} requestFn - Function to retry
 * @param {Object} options - Retry options
 * @returns {Object} Retry state and controls
 */
export function useRequestRetry(requestFn, options = {}) {
  const {
    maxRetries = 3,
    baseDelay = 1000,
    maxDelay = 10000,
    retryCondition = (error) => !error.message.includes('cancelled')
  } = options

  const [retryCount, setRetryCount] = React.useState(0)
  const [isRetrying, setIsRetrying] = React.useState(false)
  const { addCleanup, removeCleanup } = useMemoryLeakPrevention()

  const executeWithRetry = React.useCallback(async (...args) => {
    let currentRetryCount = 0
    
    while (currentRetryCount <= maxRetries) {
      try {
        const result = await requestFn(...args)
        setRetryCount(0)
        setIsRetrying(false)
        return result
      } catch (error) {
        if (!retryCondition(error) || currentRetryCount >= maxRetries) {
          setRetryCount(0)
          setIsRetrying(false)
          throw error
        }
        
        currentRetryCount++
        setRetryCount(currentRetryCount)
        setIsRetrying(true)
        
        const delay = Math.min(baseDelay * Math.pow(2, currentRetryCount - 1), maxDelay)
        
        await new Promise(resolve => {
          const timeoutId = setTimeout(resolve, delay)
          addCleanup(() => clearTimeout(timeoutId))
        })
      }
    }
  }, [requestFn, maxRetries, baseDelay, maxDelay, retryCondition, addCleanup])

  return {
    retryCount,
    isRetrying,
    executeWithRetry
  }
}
