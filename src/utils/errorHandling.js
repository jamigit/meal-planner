/**
 * @fileoverview Centralized error handling utilities
 * 
 * Provides consistent error handling patterns across the application,
 * including error types, logging, and user-friendly error messages.
 */

/**
 * Standard error response structure
 * @typedef {Object} ErrorResponse
 * @property {boolean} success - Always false for errors
 * @property {null} data - Always null for errors
 * @property {ErrorInfo} error - Error information
 */

/**
 * Error information structure
 * @typedef {Object} ErrorInfo
 * @property {string} message - User-friendly error message
 * @property {string} code - Error code for programmatic handling
 * @property {string} type - Error type (network, validation, auth, etc.)
 * @property {any} details - Additional error details (optional)
 * @property {string} timestamp - When the error occurred
 */

/**
 * Error types enum
 */
export const ERROR_TYPES = {
  NETWORK: 'network',
  VALIDATION: 'validation',
  AUTHENTICATION: 'authentication',
  AUTHORIZATION: 'authorization',
  NOT_FOUND: 'not_found',
  SERVER: 'server',
  CLIENT: 'client',
  UNKNOWN: 'unknown'
}

/**
 * Error codes enum
 */
export const ERROR_CODES = {
  // Network errors
  NETWORK_ERROR: 'NETWORK_ERROR',
  TIMEOUT: 'TIMEOUT',
  OFFLINE: 'OFFLINE',
  
  // Validation errors
  INVALID_INPUT: 'INVALID_INPUT',
  MISSING_REQUIRED_FIELD: 'MISSING_REQUIRED_FIELD',
  INVALID_FORMAT: 'INVALID_FORMAT',
  
  // Authentication errors
  UNAUTHENTICATED: 'UNAUTHENTICATED',
  TOKEN_EXPIRED: 'TOKEN_EXPIRED',
  INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',
  
  // Authorization errors
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  
  // Not found errors
  RECIPE_NOT_FOUND: 'RECIPE_NOT_FOUND',
  PLAN_NOT_FOUND: 'PLAN_NOT_FOUND',
  USER_NOT_FOUND: 'USER_NOT_FOUND',
  
  // Server errors
  INTERNAL_SERVER_ERROR: 'INTERNAL_SERVER_ERROR',
  SERVICE_UNAVAILABLE: 'SERVICE_UNAVAILABLE',
  
  // Client errors
  INVALID_OPERATION: 'INVALID_OPERATION',
  CONCURRENT_MODIFICATION: 'CONCURRENT_MODIFICATION'
}

/**
 * Creates a standardized error response
 * @param {string} message - User-friendly error message
 * @param {string} code - Error code
 * @param {string} type - Error type
 * @param {any} details - Additional error details
 * @returns {ErrorResponse}
 */
export function createErrorResponse(message, code, type = ERROR_TYPES.UNKNOWN, details = null) {
  return {
    success: false,
    data: null,
    error: {
      message,
      code,
      type,
      details,
      timestamp: new Date().toISOString()
    }
  }
}

/**
 * Creates a standardized success response
 * @param {any} data - Response data
 * @returns {Object}
 */
export function createSuccessResponse(data) {
  return {
    success: true,
    data,
    error: null
  }
}

/**
 * Converts various error types to standardized error response
 * @param {Error|string|Object} error - The error to convert
 * @param {string} fallbackMessage - Fallback message if error parsing fails
 * @returns {ErrorResponse}
 */
export function normalizeError(error, fallbackMessage = 'An unexpected error occurred') {
  // Handle Error objects
  if (error instanceof Error) {
    return createErrorResponse(
      getUserFriendlyMessage(error.message),
      getErrorCode(error),
      getErrorType(error),
      { originalError: error.message, stack: error.stack }
    )
  }
  
  // Handle string errors
  if (typeof error === 'string') {
    return createErrorResponse(
      getUserFriendlyMessage(error),
      ERROR_CODES.CLIENT,
      ERROR_TYPES.CLIENT
    )
  }
  
  // Handle object errors
  if (typeof error === 'object' && error !== null) {
    return createErrorResponse(
      error.message || fallbackMessage,
      error.code || ERROR_CODES.CLIENT,
      error.type || ERROR_TYPES.UNKNOWN,
      error.details
    )
  }
  
  // Fallback for unknown error types
  return createErrorResponse(
    fallbackMessage,
    ERROR_CODES.CLIENT,
    ERROR_TYPES.UNKNOWN,
    { originalError: error }
  )
}

/**
 * Gets user-friendly error message from technical error
 * @param {string} technicalMessage - Technical error message
 * @returns {string}
 */
function getUserFriendlyMessage(technicalMessage) {
  const messageMap = {
    'Failed to fetch': 'Unable to connect to the server. Please check your internet connection.',
    'Network request failed': 'Network error. Please try again.',
    'Request timeout': 'The request took too long. Please try again.',
    'User not authenticated': 'Please sign in to continue.',
    'Not authenticated': 'Please sign in to continue.',
    'Unauthorized': 'You do not have permission to perform this action.',
    'Forbidden': 'Access denied.',
    'Not Found': 'The requested item was not found.',
    'Internal Server Error': 'Server error. Please try again later.',
    'Service Unavailable': 'Service temporarily unavailable. Please try again later.'
  }
  
  return messageMap[technicalMessage] || technicalMessage || 'An unexpected error occurred'
}

/**
 * Determines error code from error message or type
 * @param {Error} error - The error object
 * @returns {string}
 */
function getErrorCode(error) {
  const message = error.message.toLowerCase()
  
  if (message.includes('network') || message.includes('fetch')) {
    return ERROR_CODES.NETWORK_ERROR
  }
  if (message.includes('timeout')) {
    return ERROR_CODES.TIMEOUT
  }
  if (message.includes('unauthorized') || message.includes('not authenticated')) {
    return ERROR_CODES.UNAUTHENTICATED
  }
  if (message.includes('forbidden')) {
    return ERROR_CODES.FORBIDDEN
  }
  if (message.includes('not found')) {
    return ERROR_CODES.RECIPE_NOT_FOUND
  }
  if (message.includes('validation') || message.includes('invalid')) {
    return ERROR_CODES.INVALID_INPUT
  }
  
  return ERROR_CODES.CLIENT
}

/**
 * Determines error type from error message or type
 * @param {Error} error - The error object
 * @returns {string}
 */
function getErrorType(error) {
  const message = error.message.toLowerCase()
  
  if (message.includes('network') || message.includes('fetch') || message.includes('timeout')) {
    return ERROR_TYPES.NETWORK
  }
  if (message.includes('unauthorized') || message.includes('not authenticated')) {
    return ERROR_TYPES.AUTHENTICATION
  }
  if (message.includes('forbidden')) {
    return ERROR_TYPES.AUTHORIZATION
  }
  if (message.includes('not found')) {
    return ERROR_TYPES.NOT_FOUND
  }
  if (message.includes('validation') || message.includes('invalid')) {
    return ERROR_TYPES.VALIDATION
  }
  if (message.includes('server') || message.includes('internal')) {
    return ERROR_TYPES.SERVER
  }
  
  return ERROR_TYPES.CLIENT
}

/**
 * Logs error with appropriate level
 * @param {ErrorResponse} errorResponse - Standardized error response
 * @param {string} context - Context where error occurred
 */
export function logError(errorResponse, context = 'Unknown') {
  const { error } = errorResponse
  
  const logData = {
    context,
    message: error.message,
    code: error.code,
    type: error.type,
    timestamp: error.timestamp,
    details: error.details
  }
  
  // Log based on error type
  switch (error.type) {
    case ERROR_TYPES.NETWORK:
    case ERROR_TYPES.SERVER:
      console.warn(`[${context}] ${error.message}`, logData)
      break
    case ERROR_TYPES.AUTHENTICATION:
    case ERROR_TYPES.AUTHORIZATION:
      console.warn(`[${context}] ${error.message}`, logData)
      break
    case ERROR_TYPES.VALIDATION:
      console.info(`[${context}] ${error.message}`, logData)
      break
    default:
      console.error(`[${context}] ${error.message}`, logData)
  }
  
  // In production, send to error tracking service
  if (process.env.NODE_ENV === 'production') {
    // TODO: Integrate with Sentry, Rollbar, or similar service
    // trackError(errorResponse, context)
  }
}

/**
 * Wraps async functions with standardized error handling
 * @param {Function} asyncFn - Async function to wrap
 * @param {string} context - Context for error logging
 * @returns {Function} Wrapped function that returns standardized response
 */
export function withErrorHandling(asyncFn, context = 'Unknown') {
  return async (...args) => {
    try {
      const result = await asyncFn(...args)
      return createSuccessResponse(result)
    } catch (error) {
      const errorResponse = normalizeError(error)
      logError(errorResponse, context)
      return errorResponse
    }
  }
}

/**
 * Higher-order component for error boundaries
 * @param {React.Component} Component - Component to wrap
 * @param {string} fallbackMessage - Message to show on error
 * @returns {React.Component}
 */
export function withErrorBoundary(Component, fallbackMessage = 'Something went wrong') {
  // This function should be moved to a .jsx file or implemented differently
  // For now, we'll just return the component as-is
  console.warn('withErrorBoundary should be implemented in a .jsx file')
  return Component
}
