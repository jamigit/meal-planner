/**
 * @fileoverview Loading state management utilities
 * 
 * Provides consistent loading state patterns across the application,
 * including different types of loading states and state management.
 */

/**
 * Loading state types
 */
export const LOADING_TYPES = {
  INITIAL: 'initial',      // First time loading data
  REFRESH: 'refresh',      // Refreshing existing data
  UPDATE: 'update',        // Updating existing data
  CREATE: 'create',        // Creating new data
  DELETE: 'delete',        // Deleting data
  BACKGROUND: 'background' // Background operation (non-blocking)
}

/**
 * Loading state structure
 * @typedef {Object} LoadingState
 * @property {boolean} isLoading - Whether any loading is happening
 * @property {string} type - Type of loading operation
 * @property {string} operation - Description of the operation
 * @property {number} progress - Progress percentage (0-100)
 * @property {string} message - User-friendly loading message
 */

/**
 * Creates initial loading state
 * @returns {LoadingState}
 */
export function createInitialLoadingState() {
  return {
    isLoading: false,
    type: null,
    operation: null,
    progress: 0,
    message: null
  }
}

/**
 * Creates loading state for specific operation
 * @param {string} type - Loading type
 * @param {string} operation - Operation description
 * @param {string} message - User-friendly message
 * @param {number} progress - Progress percentage
 * @returns {LoadingState}
 */
export function createLoadingState(type, operation, message = null, progress = 0) {
  return {
    isLoading: true,
    type,
    operation,
    progress: Math.max(0, Math.min(100, progress)),
    message: message || getDefaultLoadingMessage(type, operation)
  }
}

/**
 * Gets default loading message for operation type
 * @param {string} type - Loading type
 * @param {string} operation - Operation description
 * @returns {string}
 */
function getDefaultLoadingMessage(type, operation) {
  const messages = {
    [LOADING_TYPES.INITIAL]: 'Loading...',
    [LOADING_TYPES.REFRESH]: 'Refreshing...',
    [LOADING_TYPES.UPDATE]: 'Updating...',
    [LOADING_TYPES.CREATE]: 'Creating...',
    [LOADING_TYPES.DELETE]: 'Deleting...',
    [LOADING_TYPES.BACKGROUND]: 'Syncing...'
  }
  
  return messages[type] || `${operation}...`
}

/**
 * Loading state reducer for useReducer
 * @param {LoadingState} state - Current state
 * @param {Object} action - Action object
 * @returns {LoadingState}
 */
export function loadingReducer(state, action) {
  switch (action.type) {
    case 'START_LOADING':
      return createLoadingState(
        action.loadingType,
        action.operation,
        action.message,
        action.progress
      )
    
    case 'UPDATE_PROGRESS':
      return {
        ...state,
        progress: Math.max(0, Math.min(100, action.progress)),
        message: action.message || state.message
      }
    
    case 'STOP_LOADING':
      return createInitialLoadingState()
    
    case 'SET_MESSAGE':
      return {
        ...state,
        message: action.message
      }
    
    default:
      return state
  }
}

/**
 * Custom hook for managing loading states
 * @param {string} operation - Default operation name
 * @returns {Object} Loading state and controls
 */
export function useLoadingState(operation = 'Operation') {
  const [state, dispatch] = React.useReducer(loadingReducer, createInitialLoadingState())
  
  const startLoading = React.useCallback((type, op = operation, message = null) => {
    dispatch({
      type: 'START_LOADING',
      loadingType: type,
      operation: op,
      message
    })
  }, [operation])
  
  const updateProgress = React.useCallback((progress, message = null) => {
    dispatch({
      type: 'UPDATE_PROGRESS',
      progress,
      message
    })
  }, [])
  
  const stopLoading = React.useCallback(() => {
    dispatch({ type: 'STOP_LOADING' })
  }, [])
  
  const setMessage = React.useCallback((message) => {
    dispatch({ type: 'SET_MESSAGE', message })
  }, [])
  
  return {
    ...state,
    startLoading,
    updateProgress,
    stopLoading,
    setMessage
  }
}

/**
 * Higher-order function that adds loading state to async operations
 * @param {Function} asyncFn - Async function to wrap
 * @param {string} operation - Operation name
 * @param {string} loadingType - Type of loading
 * @returns {Function} Wrapped function with loading state
 */
export function withLoadingState(asyncFn, operation, loadingType = LOADING_TYPES.UPDATE) {
  return async (...args) => {
    const loadingState = {
      isLoading: true,
      type: loadingType,
      operation,
      progress: 0,
      message: getDefaultLoadingMessage(loadingType, operation)
    }
    
    try {
      // Emit loading start event
      window.dispatchEvent(new CustomEvent('loading-start', { detail: loadingState }))
      
      const result = await asyncFn(...args)
      
      // Emit loading complete event
      window.dispatchEvent(new CustomEvent('loading-complete', { detail: { operation } }))
      
      return result
    } catch (error) {
      // Emit loading error event
      window.dispatchEvent(new CustomEvent('loading-error', { 
        detail: { operation, error } 
      }))
      throw error
    }
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
