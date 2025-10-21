/**
 * @fileoverview Optimistic updates system for immediate UI updates with rollback
 * 
 * Provides optimistic update capabilities that update the UI immediately
 * and rollback on failure, improving perceived performance and user experience.
 */

import React from 'react'

/**
 * Optimistic update configuration
 */
export const OPTIMISTIC_CONFIG = {
  // Rollback timeout (how long to wait before considering operation failed)
  ROLLBACK_TIMEOUT: 30000, // 30 seconds
  
  // Maximum number of pending optimistic updates
  MAX_PENDING_UPDATES: 10,
  
  // Retry configuration
  MAX_RETRIES: 3,
  RETRY_DELAY: 1000, // 1 second
  
  // Animation configuration
  ANIMATION_DURATION: 300, // 300ms
  FADE_DURATION: 150 // 150ms
}

/**
 * Optimistic update state manager
 */
export class OptimisticUpdateManager {
  constructor() {
    this.pendingUpdates = new Map()
    this.updateHistory = []
    this.listeners = new Set()
  }

  /**
   * Registers a listener for optimistic update events
   * @param {Function} listener - Event listener function
   * @returns {Function} Unsubscribe function
   */
  subscribe(listener) {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }

  /**
   * Notifies all listeners of an event
   * @param {string} event - Event type
   * @param {any} data - Event data
   */
  notify(event, data) {
    this.listeners.forEach(listener => {
      try {
        listener(event, data)
      } catch (error) {
        console.error('Error in optimistic update listener:', error)
      }
    })
  }

  /**
   * Creates an optimistic update
   * @param {string} id - Unique update ID
   * @param {Object} config - Update configuration
   * @returns {Object} Update state
   */
  createUpdate(id, config) {
    const update = {
      id,
      type: config.type, // 'create', 'update', 'delete'
      entityType: config.entityType, // 'recipe', 'weeklyPlan', etc.
      entityId: config.entityId,
      optimisticData: config.optimisticData,
      originalData: config.originalData,
      timestamp: Date.now(),
      status: 'pending', // 'pending', 'success', 'failed', 'rolled_back'
      retryCount: 0,
      rollbackTimeout: null
    }

    this.pendingUpdates.set(id, update)
    this.updateHistory.push(update)

    // Set rollback timeout
    update.rollbackTimeout = setTimeout(() => {
      this.rollbackUpdate(id, 'timeout')
    }, OPTIMISTIC_CONFIG.ROLLBACK_TIMEOUT)

    this.notify('update_created', update)
    return update
  }

  /**
   * Marks an update as successful
   * @param {string} id - Update ID
   * @param {any} actualData - Actual data from server
   */
  markUpdateSuccess(id, actualData) {
    const update = this.pendingUpdates.get(id)
    if (!update) return

    update.status = 'success'
    update.actualData = actualData
    update.completedAt = Date.now()

    // Clear rollback timeout
    if (update.rollbackTimeout) {
      clearTimeout(update.rollbackTimeout)
      update.rollbackTimeout = null
    }

    this.notify('update_success', update)
    
    // Remove from pending updates after a delay
    setTimeout(() => {
      this.pendingUpdates.delete(id)
    }, OPTIMISTIC_CONFIG.ANIMATION_DURATION)
  }

  /**
   * Marks an update as failed and rolls back
   * @param {string} id - Update ID
   * @param {string} reason - Failure reason
   * @param {Error} error - Error object
   */
  markUpdateFailed(id, reason, error) {
    const update = this.pendingUpdates.get(id)
    if (!update) return

    update.status = 'failed'
    update.failureReason = reason
    update.error = error
    update.failedAt = Date.now()

    // Clear rollback timeout
    if (update.rollbackTimeout) {
      clearTimeout(update.rollbackTimeout)
      update.rollbackTimeout = null
    }

    this.notify('update_failed', update)
    this.rollbackUpdate(id, reason)
  }

  /**
   * Rolls back an optimistic update
   * @param {string} id - Update ID
   * @param {string} reason - Rollback reason
   */
  rollbackUpdate(id, reason) {
    const update = this.pendingUpdates.get(id)
    if (!update) return

    update.status = 'rolled_back'
    update.rollbackReason = reason
    update.rolledBackAt = Date.now()

    this.notify('update_rolled_back', update)
    
    // Remove from pending updates
    this.pendingUpdates.delete(id)
  }

  /**
   * Retries a failed update
   * @param {string} id - Update ID
   * @param {Function} retryFn - Function to retry the operation
   */
  async retryUpdate(id, retryFn) {
    const update = this.pendingUpdates.get(id)
    if (!update || update.retryCount >= OPTIMISTIC_CONFIG.MAX_RETRIES) {
      return false
    }

    update.retryCount++
    update.status = 'retrying'

    this.notify('update_retrying', update)

    try {
      const result = await retryFn()
      this.markUpdateSuccess(id, result)
      return true
    } catch (error) {
      if (update.retryCount >= OPTIMISTIC_CONFIG.MAX_RETRIES) {
        this.markUpdateFailed(id, 'max_retries_exceeded', error)
      } else {
        // Schedule retry
        setTimeout(() => {
          this.retryUpdate(id, retryFn)
        }, OPTIMISTIC_CONFIG.RETRY_DELAY * update.retryCount)
      }
      return false
    }
  }

  /**
   * Gets all pending updates
   * @returns {Array} Array of pending updates
   */
  getPendingUpdates() {
    return Array.from(this.pendingUpdates.values())
  }

  /**
   * Gets pending updates for a specific entity
   * @param {string} entityType - Entity type
   * @param {string} entityId - Entity ID
   * @returns {Array} Array of pending updates for the entity
   */
  getPendingUpdatesForEntity(entityType, entityId) {
    return Array.from(this.pendingUpdates.values()).filter(
      update => update.entityType === entityType && update.entityId === entityId
    )
  }

  /**
   * Clears all pending updates
   */
  clearAllUpdates() {
    this.pendingUpdates.forEach(update => {
      if (update.rollbackTimeout) {
        clearTimeout(update.rollbackTimeout)
      }
    })
    this.pendingUpdates.clear()
    this.notify('all_updates_cleared', null)
  }

  /**
   * Gets update history
   * @param {number} limit - Maximum number of history items
   * @returns {Array} Update history
   */
  getUpdateHistory(limit = 50) {
    return this.updateHistory
      .slice(-limit)
      .sort((a, b) => b.timestamp - a.timestamp)
  }
}

// Global optimistic update manager
export const optimisticUpdateManager = new OptimisticUpdateManager()

/**
 * React hook for optimistic updates
 * @param {string} entityType - Type of entity being updated
 * @param {string} entityId - ID of entity being updated
 * @returns {Object} Optimistic update utilities
 */
export function useOptimisticUpdates(entityType, entityId) {
  const [pendingUpdates, setPendingUpdates] = React.useState([])
  const [isOptimistic, setIsOptimistic] = React.useState(false)

  React.useEffect(() => {
    const unsubscribe = optimisticUpdateManager.subscribe((event, data) => {
      if (data && data.entityType === entityType && data.entityId === entityId) {
        setPendingUpdates(prev => {
          const filtered = prev.filter(update => update.id !== data.id)
          if (data.status === 'pending' || data.status === 'retrying') {
            return [...filtered, data]
          }
          return filtered
        })
        
        setIsOptimistic(data.status === 'pending' || data.status === 'retrying')
      }
    })

    // Get initial pending updates
    const initialUpdates = optimisticUpdateManager.getPendingUpdatesForEntity(entityType, entityId)
    setPendingUpdates(initialUpdates)
    setIsOptimistic(initialUpdates.length > 0)

    return unsubscribe
  }, [entityType, entityId])

  const createOptimisticUpdate = React.useCallback((config) => {
    const id = `${entityType}_${entityId}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    return optimisticUpdateManager.createUpdate(id, {
      ...config,
      entityType,
      entityId
    })
  }, [entityType, entityId])

  const markSuccess = React.useCallback((id, actualData) => {
    optimisticUpdateManager.markUpdateSuccess(id, actualData)
  }, [])

  const markFailed = React.useCallback((id, reason, error) => {
    optimisticUpdateManager.markUpdateFailed(id, reason, error)
  }, [])

  const retryUpdate = React.useCallback((id, retryFn) => {
    return optimisticUpdateManager.retryUpdate(id, retryFn)
  }, [])

  return {
    pendingUpdates,
    isOptimistic,
    createOptimisticUpdate,
    markSuccess,
    markFailed,
    retryUpdate
  }
}

/**
 * Higher-order function for optimistic service operations
 * @param {Function} serviceMethod - Service method to wrap
 * @param {string} operation - Operation name
 * @param {Object} options - Optimistic options
 * @returns {Function} Optimistic service method
 */
export function withOptimisticUpdates(serviceMethod, operation, options = {}) {
  const {
    entityType = 'unknown',
    getEntityId = (args) => args[0]?.id || 'unknown',
    createOptimisticData = (args) => args[0],
    getOriginalData = (args) => null,
    updateType = 'update'
  } = options

  return async (...args) => {
    const entityId = getEntityId(args)
    const optimisticData = createOptimisticData(args)
    const originalData = getOriginalData(args)

    // Create optimistic update
    const update = optimisticUpdateManager.createUpdate(
      `${operation}_${entityId}_${Date.now()}`,
      {
        type: updateType,
        entityType,
        entityId,
        optimisticData,
        originalData
      }
    )

    try {
      // Execute service method
      const result = await serviceMethod(...args)
      
      // Mark as successful
      optimisticUpdateManager.markUpdateSuccess(update.id, result)
      
      return result
    } catch (error) {
      // Mark as failed
      optimisticUpdateManager.markUpdateFailed(update.id, 'service_error', error)
      throw error
    }
  }
}

/**
 * Optimistic update component for visual feedback
 * @param {Object} props - Component props
 * @returns {JSX.Element}
 */
export function OptimisticUpdateIndicator({ 
  entityType, 
  entityId, 
  className = '',
  showProgress = true 
}) {
  const { pendingUpdates, isOptimistic } = useOptimisticUpdates(entityType, entityId)

  if (!isOptimistic || pendingUpdates.length === 0) {
    return null
  }

  const latestUpdate = pendingUpdates[pendingUpdates.length - 1]

  return (
    <div className={`optimistic-indicator ${className}`}>
      <div className="flex items-center space-x-2">
        <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-500 border-t-transparent" />
        <span className="text-sm text-blue-600">
          {latestUpdate.status === 'retrying' ? 'Retrying...' : 'Saving...'}
        </span>
        {showProgress && pendingUpdates.length > 1 && (
          <span className="text-xs text-gray-500">
            ({pendingUpdates.length} pending)
          </span>
        )}
      </div>
    </div>
  )
}

/**
 * Optimistic update toast notifications
 * @param {Object} props - Component props
 * @returns {JSX.Element}
 */
export function OptimisticUpdateToasts({ className = '' }) {
  const [toasts, setToasts] = React.useState([])

  React.useEffect(() => {
    const unsubscribe = optimisticUpdateManager.subscribe((event, data) => {
      if (event === 'update_success') {
        setToasts(prev => [...prev, {
          id: data.id,
          type: 'success',
          message: `${data.entityType} updated successfully`,
          timestamp: Date.now()
        }])
      } else if (event === 'update_failed') {
        setToasts(prev => [...prev, {
          id: data.id,
          type: 'error',
          message: `Failed to update ${data.entityType}. Changes reverted.`,
          timestamp: Date.now()
        }])
      }
    })

    return unsubscribe
  }, [])

  React.useEffect(() => {
    const timer = setInterval(() => {
      setToasts(prev => prev.filter(toast => 
        Date.now() - toast.timestamp < 5000 // Remove toasts older than 5 seconds
      ))
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  if (toasts.length === 0) return null

  return (
    <div className={`optimistic-toasts fixed top-4 right-4 z-50 space-y-2 ${className}`}>
      {toasts.map(toast => (
        <div
          key={toast.id}
          className={`p-3 rounded-md shadow-lg transition-all duration-300 ${
            toast.type === 'success' 
              ? 'bg-green-100 text-green-800 border border-green-200' 
              : 'bg-red-100 text-red-800 border border-red-200'
          }`}
        >
          <div className="flex items-center space-x-2">
            <span className="text-sm font-medium">{toast.message}</span>
            <button
              onClick={() => setToasts(prev => prev.filter(t => t.id !== toast.id))}
              className="text-gray-400 hover:text-gray-600"
            >
              ×
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}

/**
 * Optimistic update history component
 * @param {Object} props - Component props
 * @returns {JSX.Element}
 */
export function OptimisticUpdateHistory({ 
  limit = 10, 
  className = '',
  showDetails = false 
}) {
  const [history, setHistory] = React.useState([])

  React.useEffect(() => {
    const updateHistory = () => {
      setHistory(optimisticUpdateManager.getUpdateHistory(limit))
    }

    updateHistory()
    
    const unsubscribe = optimisticUpdateManager.subscribe(() => {
      updateHistory()
    })

    return unsubscribe
  }, [limit])

  if (history.length === 0) return null

  return (
    <div className={`optimistic-history ${className}`}>
      <h3 className="text-sm font-medium text-gray-700 mb-2">Recent Updates</h3>
      <div className="space-y-1">
        {history.map(update => (
          <div
            key={update.id}
            className={`text-xs p-2 rounded ${
              update.status === 'success' 
                ? 'bg-green-50 text-green-700' 
                : update.status === 'failed' 
                  ? 'bg-red-50 text-red-700'
                  : 'bg-yellow-50 text-yellow-700'
            }`}
          >
            <div className="flex justify-between items-center">
              <span>{update.entityType} {update.type}</span>
              <span className="text-xs opacity-75">
                {new Date(update.timestamp).toLocaleTimeString()}
              </span>
            </div>
            {showDetails && (
              <div className="mt-1 text-xs opacity-75">
                Status: {update.status}
                {update.failureReason && ` - ${update.failureReason}`}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
