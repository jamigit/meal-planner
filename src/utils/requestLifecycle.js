/**
 * @fileoverview Request lifecycle management utilities
 * 
 * Provides request cancellation, deduplication, timeout handling,
 * and memory leak prevention for async operations.
 */

import React from 'react'

/**
 * Request manager for handling request lifecycle
 */
export class RequestManager {
  constructor() {
    this.activeRequests = new Map()
    this.requestTimeouts = new Map()
    this.defaultTimeout = 30000 // 30 seconds
  }

  /**
   * Creates a new request with abort controller and timeout
   * @param {string} requestId - Unique identifier for the request
   * @param {number} timeout - Timeout in milliseconds
   * @returns {Object} Request configuration with abort controller
   */
  createRequest(requestId, timeout = this.defaultTimeout) {
    // Cancel existing request with same ID
    this.cancelRequest(requestId)

    const abortController = new AbortController()
    const timeoutId = setTimeout(() => {
      abortController.abort()
      this.cleanupRequest(requestId)
    }, timeout)

    const requestConfig = {
      abortController,
      timeoutId,
      createdAt: Date.now(),
      timeout
    }

    this.activeRequests.set(requestId, requestConfig)
    this.requestTimeouts.set(requestId, timeoutId)

    return {
      signal: abortController.signal,
      abort: () => this.cancelRequest(requestId),
      isAborted: () => abortController.signal.aborted
    }
  }

  /**
   * Cancels a request by ID
   * @param {string} requestId - Request ID to cancel
   */
  cancelRequest(requestId) {
    const request = this.activeRequests.get(requestId)
    if (request) {
      request.abortController.abort()
      this.cleanupRequest(requestId)
    }
  }

  /**
   * Cleans up request resources
   * @param {string} requestId - Request ID to cleanup
   */
  cleanupRequest(requestId) {
    const timeoutId = this.requestTimeouts.get(requestId)
    if (timeoutId) {
      clearTimeout(timeoutId)
      this.requestTimeouts.delete(requestId)
    }
    this.activeRequests.delete(requestId)
  }

  /**
   * Cancels all active requests
   */
  cancelAllRequests() {
    for (const [requestId] of this.activeRequests) {
      this.cancelRequest(requestId)
    }
  }

  /**
   * Gets active request count
   * @returns {number} Number of active requests
   */
  getActiveRequestCount() {
    return this.activeRequests.size
  }

  /**
   * Gets all active request IDs
   * @returns {string[]} Array of active request IDs
   */
  getActiveRequestIds() {
    return Array.from(this.activeRequests.keys())
  }
}

/**
 * Request deduplication manager
 */
export class RequestDeduplicationManager {
  constructor() {
    this.pendingRequests = new Map()
  }

  /**
   * Creates a deduplicated request
   * @param {string} requestKey - Unique key for the request
   * @param {Function} requestFn - Function that returns a promise
   * @returns {Promise} Promise that resolves when request completes
   */
  async deduplicateRequest(requestKey, requestFn) {
    // If request is already pending, return the existing promise
    if (this.pendingRequests.has(requestKey)) {
      return this.pendingRequests.get(requestKey)
    }

    // Create new request
    const requestPromise = requestFn().finally(() => {
      this.pendingRequests.delete(requestKey)
    })

    this.pendingRequests.set(requestKey, requestPromise)
    return requestPromise
  }

  /**
   * Cancels a pending request
   * @param {string} requestKey - Request key to cancel
   */
  cancelPendingRequest(requestKey) {
    this.pendingRequests.delete(requestKey)
  }

  /**
   * Cancels all pending requests
   */
  cancelAllPendingRequests() {
    this.pendingRequests.clear()
  }

  /**
   * Gets pending request count
   * @returns {number} Number of pending requests
   */
  getPendingRequestCount() {
    return this.pendingRequests.size
  }
}

// Global instances
export const requestManager = new RequestManager()
export const deduplicationManager = new RequestDeduplicationManager()

/**
 * Higher-order function that adds request lifecycle management to async functions
 * @param {Function} asyncFn - Async function to wrap
 * @param {string} operation - Operation name for request ID
 * @param {Object} options - Configuration options
 * @returns {Function} Wrapped function with request management
 */
export function withRequestLifecycle(asyncFn, operation, options = {}) {
  const {
    timeout = 30000,
    enableDeduplication = false,
    generateRequestId = (op, args) => `${op}_${JSON.stringify(args)}`
  } = options

  return async (...args) => {
    const requestId = generateRequestId(operation, args)
    
    // Handle deduplication
    if (enableDeduplication) {
      return deduplicationManager.deduplicateRequest(requestId, async () => {
        const requestConfig = requestManager.createRequest(requestId, timeout)
        
        try {
          const result = await asyncFn(requestConfig.signal, ...args)
          return result
        } catch (error) {
          if (error.name === 'AbortError') {
            throw new Error(`Request ${operation} was cancelled`)
          }
          throw error
        } finally {
          requestManager.cleanupRequest(requestId)
        }
      })
    }

    // Regular request with lifecycle management
    const requestConfig = requestManager.createRequest(requestId, timeout)
    
    try {
      const result = await asyncFn(requestConfig.signal, ...args)
      return result
    } catch (error) {
      if (error.name === 'AbortError') {
        throw new Error(`Request ${operation} was cancelled`)
      }
      throw error
    } finally {
      requestManager.cleanupRequest(requestId)
    }
  }
}

/**
 * React hook for request lifecycle management
 * @param {string} operation - Operation name
 * @returns {Object} Request management utilities
 */
export function useRequestLifecycle(operation) {
  const [isRequestActive, setIsRequestActive] = React.useState(false)
  const abortControllerRef = React.useRef(null)

  const startRequest = React.useCallback((timeout = 30000) => {
    // Cancel previous request if still active
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }

    const requestConfig = requestManager.createRequest(`${operation}_${Date.now()}`, timeout)
    abortControllerRef.current = requestConfig.abortController
    setIsRequestActive(true)

    return requestConfig.signal
  }, [operation])

  const cancelRequest = React.useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
      abortControllerRef.current = null
      setIsRequestActive(false)
    }
  }, [])

  // Cleanup on unmount
  React.useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
    }
  }, [])

  return {
    isRequestActive,
    startRequest,
    cancelRequest,
    signal: abortControllerRef.current?.signal
  }
}

/**
 * Enhanced fetch with request lifecycle management
 * @param {string} url - URL to fetch
 * @param {Object} options - Fetch options
 * @param {Object} lifecycleOptions - Lifecycle options
 * @returns {Promise} Fetch promise with lifecycle management
 */
export async function fetchWithLifecycle(url, options = {}, lifecycleOptions = {}) {
  const {
    timeout = 30000,
    requestId = `fetch_${url}_${Date.now()}`,
    enableDeduplication = false
  } = lifecycleOptions

  const requestConfig = requestManager.createRequest(requestId, timeout)
  
  try {
    const response = await fetch(url, {
      ...options,
      signal: requestConfig.signal
    })

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }

    return response
  } catch (error) {
    if (error.name === 'AbortError') {
      throw new Error(`Request to ${url} was cancelled`)
    }
    throw error
  } finally {
    requestManager.cleanupRequest(requestId)
  }
}

/**
 * Service wrapper with request lifecycle management
 * @param {Object} service - Service to wrap
 * @param {string} serviceName - Name of the service
 * @returns {Object} Service with request lifecycle management
 */
export function wrapServiceWithLifecycle(service, serviceName) {
  const wrappedService = {}
  
  // Get all methods from the service
  const methods = Object.getOwnPropertyNames(Object.getPrototypeOf(service))
    .filter(name => name !== 'constructor' && typeof service[name] === 'function')
  
  // Wrap each method
  methods.forEach(methodName => {
    wrappedService[methodName] = withRequestLifecycle(
      service[methodName],
      `${serviceName}.${methodName}`,
      {
        timeout: 30000,
        enableDeduplication: ['getAll', 'getById', 'search'].includes(methodName)
      }
    )
  })
  
  return wrappedService
}

/**
 * Memory leak prevention utilities
 */
export class MemoryLeakPrevention {
  constructor() {
    this.activeSubscriptions = new Set()
    this.activeIntervals = new Set()
    this.activeTimeouts = new Set()
  }

  /**
   * Tracks a subscription for cleanup
   * @param {Object} subscription - Subscription to track
   * @returns {Object} Tracked subscription
   */
  trackSubscription(subscription) {
    this.activeSubscriptions.add(subscription)
    return subscription
  }

  /**
   * Tracks an interval for cleanup
   * @param {number} intervalId - Interval ID to track
   * @returns {number} Tracked interval ID
   */
  trackInterval(intervalId) {
    this.activeIntervals.add(intervalId)
    return intervalId
  }

  /**
   * Tracks a timeout for cleanup
   * @param {number} timeoutId - Timeout ID to track
   * @returns {number} Tracked timeout ID
   */
  trackTimeout(timeoutId) {
    this.activeTimeouts.add(timeoutId)
    return timeoutId
  }

  /**
   * Cleans up all tracked resources
   */
  cleanup() {
    // Cleanup subscriptions
    this.activeSubscriptions.forEach(subscription => {
      if (subscription && typeof subscription.unsubscribe === 'function') {
        subscription.unsubscribe()
      }
    })
    this.activeSubscriptions.clear()

    // Cleanup intervals
    this.activeIntervals.forEach(intervalId => {
      clearInterval(intervalId)
    })
    this.activeIntervals.clear()

    // Cleanup timeouts
    this.activeTimeouts.forEach(timeoutId => {
      clearTimeout(timeoutId)
    })
    this.activeTimeouts.clear()
  }
}

// Global memory leak prevention instance
export const memoryLeakPrevention = new MemoryLeakPrevention()

/**
 * React hook for memory leak prevention
 * @returns {Object} Memory leak prevention utilities
 */
export function useMemoryLeakPrevention() {
  const cleanupFunctions = React.useRef(new Set())

  const addCleanup = React.useCallback((cleanupFn) => {
    cleanupFunctions.current.add(cleanupFn)
  }, [])

  const removeCleanup = React.useCallback((cleanupFn) => {
    cleanupFunctions.current.delete(cleanupFn)
  }, [])

  // Cleanup on unmount
  React.useEffect(() => {
    return () => {
      cleanupFunctions.current.forEach(cleanupFn => {
        try {
          cleanupFn()
        } catch (error) {
          console.warn('Error during cleanup:', error)
        }
      })
      cleanupFunctions.current.clear()
    }
  }, [])

  return {
    addCleanup,
    removeCleanup
  }
}
