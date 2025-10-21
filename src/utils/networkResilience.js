/**
 * @fileoverview Network resilience utilities for offline detection and auto-retry
 * 
 * Provides comprehensive network state management, offline detection,
 * automatic retry with exponential backoff, and queue management for failed requests.
 */

import React from 'react'

/**
 * Network resilience configuration
 */
export const NETWORK_CONFIG = {
  // Retry configuration
  MAX_RETRIES: 5,
  BASE_DELAY: 1000, // 1 second
  MAX_DELAY: 30000, // 30 seconds
  BACKOFF_MULTIPLIER: 2,
  
  // Network detection
  PING_INTERVAL: 10000, // 10 seconds
  PING_TIMEOUT: 5000, // 5 seconds
  PING_URL: '/api/ping', // Health check endpoint
  
  // Queue configuration
  MAX_QUEUE_SIZE: 100,
  QUEUE_FLUSH_INTERVAL: 5000, // 5 seconds
  
  // Offline behavior
  CACHE_DURATION: 24 * 60 * 60 * 1000, // 24 hours
  SYNC_ON_RECONNECT: true,
  SHOW_OFFLINE_INDICATOR: true
}

/**
 * Network state manager
 */
export class NetworkStateManager {
  constructor() {
    this.isOnline = navigator.onLine
    this.isConnected = true
    this.lastSeen = Date.now()
    this.retryQueue = []
    this.listeners = new Set()
    this.pingInterval = null
    this.queueFlushInterval = null
    this.retryTimeouts = new Map()
    
    this.init()
  }

  /**
   * Initializes network monitoring
   */
  init() {
    // Listen to browser online/offline events
    window.addEventListener('online', this.handleOnline.bind(this))
    window.addEventListener('offline', this.handleOffline.bind(this))
    
    // Start periodic connectivity checks
    this.startPingInterval()
    
    // Start queue processing
    this.startQueueFlush()
  }

  /**
   * Registers a listener for network state changes
   * @param {Function} listener - Event listener function
   * @returns {Function} Unsubscribe function
   */
  subscribe(listener) {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }

  /**
   * Notifies all listeners of network state changes
   * @param {string} event - Event type
   * @param {any} data - Event data
   */
  notify(event, data) {
    this.listeners.forEach(listener => {
      try {
        listener(event, data)
      } catch (error) {
        console.error('Error in network state listener:', error)
      }
    })
  }

  /**
   * Handles online event
   */
  handleOnline() {
    this.isOnline = true
    this.lastSeen = Date.now()
    this.notify('online', { timestamp: Date.now() })
    
    // Process queued requests
    this.processRetryQueue()
  }

  /**
   * Handles offline event
   */
  handleOffline() {
    this.isOnline = false
    this.notify('offline', { timestamp: Date.now() })
  }

  /**
   * Checks network connectivity with ping
   * @returns {Promise<boolean>} Whether network is connected
   */
  async checkConnectivity() {
    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), NETWORK_CONFIG.PING_TIMEOUT)
      
      const response = await fetch(NETWORK_CONFIG.PING_URL, {
        method: 'HEAD',
        signal: controller.signal,
        cache: 'no-cache'
      })
      
      clearTimeout(timeoutId)
      
      const isConnected = response.ok
      this.updateConnectionState(isConnected)
      
      return isConnected
    } catch (error) {
      this.updateConnectionState(false)
      return false
    }
  }

  /**
   * Updates connection state
   * @param {boolean} isConnected - Whether connected
   */
  updateConnectionState(isConnected) {
    const wasConnected = this.isConnected
    this.isConnected = isConnected
    
    if (isConnected) {
      this.lastSeen = Date.now()
    }
    
    if (wasConnected !== isConnected) {
      this.notify('connection_changed', {
        isConnected,
        timestamp: Date.now()
      })
      
      if (isConnected && NETWORK_CONFIG.SYNC_ON_RECONNECT) {
        this.processRetryQueue()
      }
    }
  }

  /**
   * Starts periodic ping interval
   */
  startPingInterval() {
    this.pingInterval = setInterval(() => {
      this.checkConnectivity()
    }, NETWORK_CONFIG.PING_INTERVAL)
  }

  /**
   * Stops ping interval
   */
  stopPingInterval() {
    if (this.pingInterval) {
      clearInterval(this.pingInterval)
      this.pingInterval = null
    }
  }

  /**
   * Adds a request to the retry queue
   * @param {Object} request - Request configuration
   */
  addToRetryQueue(request) {
    if (this.retryQueue.length >= NETWORK_CONFIG.MAX_QUEUE_SIZE) {
      console.warn('Retry queue is full, dropping oldest request')
      this.retryQueue.shift()
    }
    
    this.retryQueue.push({
      ...request,
      addedAt: Date.now(),
      retryCount: 0
    })
    
    this.notify('request_queued', { request })
  }

  /**
   * Processes the retry queue
   */
  async processRetryQueue() {
    if (!this.isOnline || !this.isConnected) {
      return
    }
    
    const requests = [...this.retryQueue]
    this.retryQueue = []
    
    for (const request of requests) {
      try {
        await this.retryRequest(request)
      } catch (error) {
        console.error('Failed to retry request:', error)
        // Re-add to queue if retry limit not exceeded
        if (request.retryCount < NETWORK_CONFIG.MAX_RETRIES) {
          this.addToRetryQueue(request)
        }
      }
    }
  }

  /**
   * Retries a single request
   * @param {Object} request - Request to retry
   */
  async retryRequest(request) {
    const delay = this.calculateRetryDelay(request.retryCount)
    
    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(async () => {
        try {
          const result = await request.fn(...request.args)
          this.notify('request_retry_success', { request, result })
          resolve(result)
        } catch (error) {
          request.retryCount++
          this.notify('request_retry_failed', { request, error })
          reject(error)
        }
      }, delay)
      
      this.retryTimeouts.set(request.id, timeoutId)
    })
  }

  /**
   * Calculates retry delay with exponential backoff
   * @param {number} retryCount - Number of retries attempted
   * @returns {number} Delay in milliseconds
   */
  calculateRetryDelay(retryCount) {
    const delay = NETWORK_CONFIG.BASE_DELAY * Math.pow(NETWORK_CONFIG.BACKOFF_MULTIPLIER, retryCount)
    return Math.min(delay, NETWORK_CONFIG.MAX_DELAY)
  }

  /**
   * Starts queue flush interval
   */
  startQueueFlush() {
    this.queueFlushInterval = setInterval(() => {
      this.processRetryQueue()
    }, NETWORK_CONFIG.QUEUE_FLUSH_INTERVAL)
  }

  /**
   * Stops queue flush interval
   */
  stopQueueFlush() {
    if (this.queueFlushInterval) {
      clearInterval(this.queueFlushInterval)
      this.queueFlushInterval = null
    }
  }

  /**
   * Gets current network state
   * @returns {Object} Network state
   */
  getNetworkState() {
    return {
      isOnline: this.isOnline,
      isConnected: this.isConnected,
      lastSeen: this.lastSeen,
      queueSize: this.retryQueue.length,
      uptime: Date.now() - this.lastSeen
    }
  }

  /**
   * Clears retry queue
   */
  clearRetryQueue() {
    this.retryQueue.forEach(request => {
      const timeoutId = this.retryTimeouts.get(request.id)
      if (timeoutId) {
        clearTimeout(timeoutId)
        this.retryTimeouts.delete(request.id)
      }
    })
    
    this.retryQueue = []
    this.notify('queue_cleared', null)
  }

  /**
   * Destroys the network state manager
   */
  destroy() {
    this.stopPingInterval()
    this.stopQueueFlush()
    this.clearRetryQueue()
    
    window.removeEventListener('online', this.handleOnline.bind(this))
    window.removeEventListener('offline', this.handleOffline.bind(this))
    
    this.listeners.clear()
  }
}

// Global network state manager
export const networkStateManager = new NetworkStateManager()

/**
 * Higher-order function for network-resilient operations
 * @param {Function} asyncFn - Async function to wrap
 * @param {string} operation - Operation name
 * @param {Object} options - Retry options
 * @returns {Function} Network-resilient function
 */
export function withNetworkResilience(asyncFn, operation, options = {}) {
  const {
    maxRetries = NETWORK_CONFIG.MAX_RETRIES,
    baseDelay = NETWORK_CONFIG.BASE_DELAY,
    maxDelay = NETWORK_CONFIG.MAX_DELAY,
    backoffMultiplier = NETWORK_CONFIG.BACKOFF_MULTIPLIER,
    enableQueue = true,
    retryCondition = (error) => {
      // Retry on network errors, timeouts, and 5xx server errors
      return error.name === 'NetworkError' || 
             error.name === 'TimeoutError' ||
             (error.status >= 500 && error.status < 600)
    }
  } = options

  return async (...args) => {
    let lastError = null
    
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        // Check if we're online before attempting
        if (!networkStateManager.isOnline) {
          throw new Error('Network is offline')
        }
        
        const result = await asyncFn(...args)
        
        // Clear any queued retries for this operation
        if (attempt > 0) {
          networkStateManager.notify('operation_success', { operation, attempt })
        }
        
        return result
      } catch (error) {
        lastError = error
        
        // Check if we should retry
        if (attempt < maxRetries && retryCondition(error)) {
          const delay = Math.min(
            baseDelay * Math.pow(backoffMultiplier, attempt),
            maxDelay
          )
          
          networkStateManager.notify('operation_retry', { 
            operation, 
            attempt: attempt + 1, 
            error,
            delay 
          })
          
          // Wait before retrying
          await new Promise(resolve => setTimeout(resolve, delay))
          continue
        }
        
        // If we can't retry, queue the request if enabled
        if (enableQueue && attempt === maxRetries) {
          const requestId = `${operation}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
          networkStateManager.addToRetryQueue({
            id: requestId,
            operation,
            fn: asyncFn,
            args,
            retryCount: attempt
          })
        }
        
        break
      }
    }
    
    throw lastError
  }
}

/**
 * React hook for network state
 * @returns {Object} Network state and utilities
 */
export function useNetworkState() {
  const [networkState, setNetworkState] = React.useState(
    networkStateManager.getNetworkState()
  )

  React.useEffect(() => {
    const unsubscribe = networkStateManager.subscribe((event, data) => {
      setNetworkState(networkStateManager.getNetworkState())
    })

    return unsubscribe
  }, [])

  const checkConnectivity = React.useCallback(async () => {
    return await networkStateManager.checkConnectivity()
  }, [])

  const clearRetryQueue = React.useCallback(() => {
    networkStateManager.clearRetryQueue()
  }, [])

  return {
    ...networkState,
    checkConnectivity,
    clearRetryQueue
  }
}

/**
 * React hook for network-resilient operations
 * @param {Function} asyncFn - Async function to make resilient
 * @param {Object} options - Retry options
 * @returns {Object} Resilient operation utilities
 */
export function useNetworkResilientOperation(asyncFn, options = {}) {
  const [isRetrying, setIsRetrying] = React.useState(false)
  const [retryCount, setRetryCount] = React.useState(0)
  const [lastError, setLastError] = React.useState(null)

  const resilientFn = React.useMemo(() => {
    return withNetworkResilience(asyncFn, 'operation', {
      ...options,
      onRetry: (attempt, error, delay) => {
        setIsRetrying(true)
        setRetryCount(attempt)
        setLastError(error)
      },
      onSuccess: () => {
        setIsRetrying(false)
        setRetryCount(0)
        setLastError(null)
      }
    })
  }, [asyncFn, options])

  const execute = React.useCallback(async (...args) => {
    try {
      return await resilientFn(...args)
    } catch (error) {
      setLastError(error)
      throw error
    }
  }, [resilientFn])

  return {
    execute,
    isRetrying,
    retryCount,
    lastError,
    isOnline: networkStateManager.isOnline,
    isConnected: networkStateManager.isConnected
  }
}

/**
 * Offline cache manager
 */
export class OfflineCacheManager {
  constructor() {
    this.cache = new Map()
    this.maxSize = 100
    this.maxAge = NETWORK_CONFIG.CACHE_DURATION
  }

  /**
   * Stores data in offline cache
   * @param {string} key - Cache key
   * @param {any} data - Data to cache
   * @param {number} ttl - Time to live in milliseconds
   */
  set(key, data, ttl = this.maxAge) {
    // Remove oldest entries if cache is full
    if (this.cache.size >= this.maxSize) {
      const oldestKey = this.cache.keys().next().value
      this.cache.delete(oldestKey)
    }

    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    })
  }

  /**
   * Retrieves data from offline cache
   * @param {string} key - Cache key
   * @returns {any} Cached data or null
   */
  get(key) {
    const entry = this.cache.get(key)
    
    if (!entry) {
      return null
    }

    // Check if entry has expired
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key)
      return null
    }

    return entry.data
  }

  /**
   * Removes data from offline cache
   * @param {string} key - Cache key
   */
  delete(key) {
    this.cache.delete(key)
  }

  /**
   * Clears all cached data
   */
  clear() {
    this.cache.clear()
  }

  /**
   * Gets cache statistics
   * @returns {Object} Cache statistics
   */
  getStats() {
    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      maxAge: this.maxAge
    }
  }
}

// Global offline cache manager
export const offlineCacheManager = new OfflineCacheManager()

/**
 * React hook for offline cache
 * @returns {Object} Cache utilities
 */
export function useOfflineCache() {
  const [cacheStats, setCacheStats] = React.useState(
    offlineCacheManager.getStats()
  )

  React.useEffect(() => {
    const interval = setInterval(() => {
      setCacheStats(offlineCacheManager.getStats())
    }, 1000)

    return () => clearInterval(interval)
  }, [])

  const setCache = React.useCallback((key, data, ttl) => {
    offlineCacheManager.set(key, data, ttl)
    setCacheStats(offlineCacheManager.getStats())
  }, [])

  const getCache = React.useCallback((key) => {
    return offlineCacheManager.get(key)
  }, [])

  const deleteCache = React.useCallback((key) => {
    offlineCacheManager.delete(key)
    setCacheStats(offlineCacheManager.getStats())
  }, [])

  const clearCache = React.useCallback(() => {
    offlineCacheManager.clear()
    setCacheStats(offlineCacheManager.getStats())
  }, [])

  return {
    cacheStats,
    setCache,
    getCache,
    deleteCache,
    clearCache
  }
}
