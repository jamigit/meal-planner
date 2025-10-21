/**
 * @fileoverview Service wrapper for consistent error handling and loading states
 * 
 * Provides a standardized interface for all service operations with
 * automatic error handling, loading states, and response formatting.
 */

import { withErrorHandling, createSuccessResponse, normalizeError, logError } from '../utils/errorHandling.js'
import { LOADING_TYPES } from '../utils/loadingStates.js'

/**
 * Service wrapper class that adds error handling and loading states to services
 */
export class ServiceWrapper {
  constructor(service, serviceName) {
    this.service = service
    this.serviceName = serviceName
    this.loadingStates = new Map()
  }

  /**
   * Wraps a service method with error handling and loading state management
   * @param {string} methodName - Name of the service method
   * @param {string} operation - Human-readable operation description
   * @param {string} loadingType - Type of loading operation
   * @returns {Function} Wrapped method
   */
  wrapMethod(methodName, operation, loadingType = LOADING_TYPES.UPDATE) {
    const originalMethod = this.service[methodName]
    if (!originalMethod) {
      throw new Error(`Method ${methodName} not found on service ${this.serviceName}`)
    }

    return async (...args) => {
      const operationKey = `${methodName}_${Date.now()}`
      
      try {
        // Start loading state
        this.startLoading(operationKey, loadingType, operation)
        
        // Call the original method
        const result = await originalMethod.call(this.service, ...args)
        
        // Stop loading state
        this.stopLoading(operationKey)
        
        // Return standardized response
        return createSuccessResponse(result)
        
      } catch (error) {
        // Stop loading state
        this.stopLoading(operationKey)
        
        // Normalize and log error
        const errorResponse = normalizeError(error)
        logError(errorResponse, `${this.serviceName}.${methodName}`)
        
        // Return error response
        return errorResponse
      }
    }
  }

  /**
   * Wraps all service methods automatically
   * @param {Object} methodConfigs - Configuration for each method
   * @returns {Object} Wrapped service with standardized methods
   */
  wrapAllMethods(methodConfigs = {}) {
    const wrappedService = {}
    
    // Get all methods from the service
    const methods = Object.getOwnPropertyNames(Object.getPrototypeOf(this.service))
      .filter(name => name !== 'constructor' && typeof this.service[name] === 'function')
    
    // Wrap each method
    methods.forEach(methodName => {
      const config = methodConfigs[methodName] || {}
      const operation = config.operation || methodName
      const loadingType = config.loadingType || LOADING_TYPES.UPDATE
      
      wrappedService[methodName] = this.wrapMethod(methodName, operation, loadingType)
    })
    
    return wrappedService
  }

  /**
   * Starts loading state for an operation
   * @param {string} operationKey - Unique key for the operation
   * @param {string} loadingType - Type of loading
   * @param {string} operation - Operation description
   */
  startLoading(operationKey, loadingType, operation) {
    this.loadingStates.set(operationKey, {
      isLoading: true,
      type: loadingType,
      operation,
      startTime: Date.now()
    })
    
    // Emit loading start event
    this.emitLoadingEvent('start', operationKey, operation)
  }

  /**
   * Stops loading state for an operation
   * @param {string} operationKey - Unique key for the operation
   */
  stopLoading(operationKey) {
    const loadingState = this.loadingStates.get(operationKey)
    if (loadingState) {
      const duration = Date.now() - loadingState.startTime
      this.loadingStates.delete(operationKey)
      
      // Emit loading complete event
      this.emitLoadingEvent('complete', operationKey, loadingState.operation, duration)
    }
  }

  /**
   * Emits loading events for global loading state management
   * @param {string} eventType - Type of event (start, complete, error)
   * @param {string} operationKey - Operation key
   * @param {string} operation - Operation description
   * @param {number} duration - Operation duration (for complete events)
   */
  emitLoadingEvent(eventType, operationKey, operation, duration = null) {
    const event = new CustomEvent(`service-loading-${eventType}`, {
      detail: {
        service: this.serviceName,
        operationKey,
        operation,
        duration,
        timestamp: new Date().toISOString()
      }
    })
    
    window.dispatchEvent(event)
  }

  /**
   * Gets current loading state
   * @returns {Object} Current loading state
   */
  getLoadingState() {
    const activeOperations = Array.from(this.loadingStates.values())
    
    if (activeOperations.length === 0) {
      return {
        isLoading: false,
        type: null,
        operation: null,
        count: 0
      }
    }
    
    // Return the most recent operation
    const latest = activeOperations.reduce((latest, current) => 
      current.startTime > latest.startTime ? current : latest
    )
    
    return {
      isLoading: true,
      type: latest.type,
      operation: latest.operation,
      count: activeOperations.length
    }
  }
}

/**
 * Creates a wrapped service with standardized error handling and loading states
 * @param {Object} service - The service to wrap
 * @param {string} serviceName - Name of the service
 * @param {Object} methodConfigs - Configuration for each method
 * @returns {Object} Wrapped service
 */
export function createWrappedService(service, serviceName, methodConfigs = {}) {
  const wrapper = new ServiceWrapper(service, serviceName)
  return wrapper.wrapAllMethods(methodConfigs)
}

/**
 * Default method configurations for common service patterns
 */
export const DEFAULT_METHOD_CONFIGS = {
  // Recipe service configurations
  recipeService: {
    getAll: { operation: 'Loading recipes', loadingType: LOADING_TYPES.INITIAL },
    getById: { operation: 'Loading recipe', loadingType: LOADING_TYPES.INITIAL },
    add: { operation: 'Creating recipe', loadingType: LOADING_TYPES.CREATE },
    update: { operation: 'Updating recipe', loadingType: LOADING_TYPES.UPDATE },
    delete: { operation: 'Deleting recipe', loadingType: LOADING_TYPES.DELETE },
    search: { operation: 'Searching recipes', loadingType: LOADING_TYPES.BACKGROUND },
    getAllTags: { operation: 'Loading tags', loadingType: LOADING_TYPES.BACKGROUND },
    bulkInsert: { operation: 'Importing recipes', loadingType: LOADING_TYPES.CREATE }
  },
  
  // Weekly plan service configurations
  weeklyPlanService: {
    getAll: { operation: 'Loading meal plans', loadingType: LOADING_TYPES.INITIAL },
    getCurrent: { operation: 'Loading current plan', loadingType: LOADING_TYPES.INITIAL },
    getCurrentWithRecipes: { operation: 'Loading current plan', loadingType: LOADING_TYPES.INITIAL },
    save: { operation: 'Saving meal plan', loadingType: LOADING_TYPES.CREATE },
    update: { operation: 'Updating meal plan', loadingType: LOADING_TYPES.UPDATE },
    delete: { operation: 'Deleting meal plan', loadingType: LOADING_TYPES.DELETE },
    setAsCurrent: { operation: 'Setting current plan', loadingType: LOADING_TYPES.UPDATE },
    clearCurrentPlans: { operation: 'Clearing current plans', loadingType: LOADING_TYPES.UPDATE }
  },
  
  // Meal history service configurations
  mealHistoryService: {
    getAll: { operation: 'Loading meal history', loadingType: LOADING_TYPES.INITIAL },
    getByWeek: { operation: 'Loading week history', loadingType: LOADING_TYPES.INITIAL },
    add: { operation: 'Recording meal', loadingType: LOADING_TYPES.CREATE },
    update: { operation: 'Updating meal record', loadingType: LOADING_TYPES.UPDATE },
    delete: { operation: 'Removing meal record', loadingType: LOADING_TYPES.DELETE },
    getFrequency: { operation: 'Calculating frequency', loadingType: LOADING_TYPES.BACKGROUND }
  }
}

/**
 * Global loading state manager
 */
export class GlobalLoadingManager {
  constructor() {
    this.activeOperations = new Map()
    this.listeners = new Set()
    
    // Listen for service loading events
    window.addEventListener('service-loading-start', this.handleLoadingStart.bind(this))
    window.addEventListener('service-loading-complete', this.handleLoadingComplete.bind(this))
  }

  handleLoadingStart(event) {
    const { operationKey, service, operation } = event.detail
    this.activeOperations.set(operationKey, {
      service,
      operation,
      startTime: Date.now()
    })
    
    this.notifyListeners()
  }

  handleLoadingComplete(event) {
    const { operationKey } = event.detail
    this.activeOperations.delete(operationKey)
    this.notifyListeners()
  }

  addListener(callback) {
    this.listeners.add(callback)
    return () => this.listeners.delete(callback)
  }

  notifyListeners() {
    const state = this.getGlobalLoadingState()
    this.listeners.forEach(callback => callback(state))
  }

  getGlobalLoadingState() {
    const operations = Array.from(this.activeOperations.values())
    
    if (operations.length === 0) {
      return {
        isLoading: false,
        operations: [],
        count: 0
      }
    }
    
    return {
      isLoading: true,
      operations,
      count: operations.length
    }
  }
}

// Global instance
export const globalLoadingManager = new GlobalLoadingManager()
