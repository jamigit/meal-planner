/**
 * @fileoverview Validation service integration
 * 
 * Integrates validation with existing services to provide
 * consistent validation across the application.
 */

import { validateRecipe, validateWeeklyPlan, validateUserInput, sanitizeInput } from '../utils/dataValidation.js'
import { createErrorResponse, ERROR_CODES, ERROR_TYPES } from '../utils/errorHandling.js'

/**
 * Validation service that wraps existing services with validation
 */
export class ValidationService {
  constructor(service, serviceName) {
    this.service = service
    this.serviceName = serviceName
  }

  /**
   * Validates and sanitizes data before service operations
   * @param {Object} data - Data to validate
   * @param {string} operation - Operation type (add, update, etc.)
   * @returns {Object} Validation result
   */
  validateData(data, operation = 'add') {
    let validationResult

    switch (this.serviceName) {
      case 'recipeService':
        validationResult = validateRecipe(data)
        break
      case 'weeklyPlanService':
        validationResult = validateWeeklyPlan(data)
        break
      default:
        return { isValid: true, data, errors: [] }
    }

    if (!validationResult.isValid) {
      return createErrorResponse(
        `Validation failed: ${validationResult.errors.join(', ')}`,
        ERROR_CODES.INVALID_INPUT,
        ERROR_TYPES.VALIDATION,
        { errors: validationResult.errors, operation }
      )
    }

    return {
      success: true,
      data: validationResult.data,
      error: null
    }
  }

  /**
   * Wraps service methods with validation
   * @param {string} methodName - Name of the service method
   * @param {string} operation - Operation type
   * @returns {Function} Wrapped method with validation
   */
  wrapWithValidation(methodName, operation = 'add') {
    const originalMethod = this.service[methodName]
    if (!originalMethod) {
      throw new Error(`Method ${methodName} not found on service ${this.serviceName}`)
    }

    return async (...args) => {
      try {
        // For add/update operations, validate the first argument (data)
        if (['add', 'update', 'bulkInsert'].includes(methodName) && args.length > 0) {
          const validationResult = this.validateData(args[0], methodName)
          
          if (!validationResult.success) {
            return validationResult
          }

          // Replace the first argument with validated data
          args[0] = validationResult.data
        }

        // Call the original method with validated data
        const result = await originalMethod.call(this.service, ...args)
        
        return {
          success: true,
          data: result,
          error: null
        }
      } catch (error) {
        return createErrorResponse(
          error.message,
          ERROR_CODES.CLIENT,
          ERROR_TYPES.CLIENT,
          { method: methodName, operation }
        )
      }
    }
  }

  /**
   * Wraps all service methods with validation
   * @returns {Object} Service with validated methods
   */
  wrapAllMethods() {
    const wrappedService = {}
    
    // Get all methods from the service
    const methods = Object.getOwnPropertyNames(Object.getPrototypeOf(this.service))
      .filter(name => name !== 'constructor' && typeof this.service[name] === 'function')
    
    // Wrap each method
    methods.forEach(methodName => {
      const operation = ['add', 'update', 'bulkInsert'].includes(methodName) ? methodName : 'read'
      wrappedService[methodName] = this.wrapWithValidation(methodName, operation)
    })
    
    return wrappedService
  }
}

/**
 * Creates a validated service wrapper
 * @param {Object} service - The service to wrap
 * @param {string} serviceName - Name of the service
 * @returns {Object} Service with validation
 */
export function createValidatedService(service, serviceName) {
  const validationService = new ValidationService(service, serviceName)
  return validationService.wrapAllMethods()
}

/**
 * Real-time search validation
 * @param {string} query - Search query
 * @returns {Object} Validation result
 */
export function validateSearchQuery(query) {
  const result = validateUserInput(query, 'searchQuery')
  
  if (!result.isValid) {
    return createErrorResponse(
      result.errors.join(', '),
      ERROR_CODES.INVALID_INPUT,
      ERROR_TYPES.VALIDATION,
      { query, errors: result.errors }
    )
  }

  return {
    success: true,
    data: result.data,
    error: null
  }
}

/**
 * Form submission validation
 * @param {Object} formData - Form data to validate
 * @param {string} formType - Type of form (recipe, weeklyPlan, etc.)
 * @returns {Object} Validation result
 */
export function validateFormSubmission(formData, formType) {
  let validationResult

  switch (formType) {
    case 'recipe':
      validationResult = validateRecipe(formData)
      break
    case 'weeklyPlan':
      validationResult = validateWeeklyPlan(formData)
      break
    default:
      return {
        success: true,
        data: formData,
        error: null
      }
  }

  if (!validationResult.isValid) {
    return createErrorResponse(
      `Form validation failed: ${validationResult.errors.join(', ')}`,
      ERROR_CODES.INVALID_INPUT,
      ERROR_TYPES.VALIDATION,
      { 
        formType, 
        errors: validationResult.errors,
        fieldErrors: validationResult.errors.reduce((acc, error) => {
          // Extract field name from error message
          const fieldName = error.split(' ')[0].toLowerCase()
          acc[fieldName] = error
          return acc
        }, {})
      }
    )
  }

  return {
    success: true,
    data: validationResult.data,
    error: null
  }
}

/**
 * Input sanitization for user-generated content
 * @param {any} input - Input to sanitize
 * @returns {any} Sanitized input
 */
export function sanitizeUserInput(input) {
  if (typeof input === 'string') {
    return sanitizeInput(input)
  }
  
  if (Array.isArray(input)) {
    return input.map(item => sanitizeUserInput(item))
  }
  
  if (typeof input === 'object' && input !== null) {
    const sanitized = {}
    for (const [key, value] of Object.entries(input)) {
      sanitized[key] = sanitizeUserInput(value)
    }
    return sanitized
  }
  
  return input
}

/**
 * Validates file uploads
 * @param {File} file - File to validate
 * @param {Object} options - Validation options
 * @returns {Object} Validation result
 */
export function validateFileUpload(file, options = {}) {
  const {
    maxSize = 5 * 1024 * 1024, // 5MB default
    allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
    allowedExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp']
  } = options

  const errors = []

  // Check file size
  if (file.size > maxSize) {
    errors.push(`File size must be less than ${Math.round(maxSize / 1024 / 1024)}MB`)
  }

  // Check file type
  if (!allowedTypes.includes(file.type)) {
    errors.push(`File type must be one of: ${allowedTypes.join(', ')}`)
  }

  // Check file extension
  const extension = '.' + file.name.split('.').pop().toLowerCase()
  if (!allowedExtensions.includes(extension)) {
    errors.push(`File extension must be one of: ${allowedExtensions.join(', ')}`)
  }

  if (errors.length > 0) {
    return createErrorResponse(
      `File validation failed: ${errors.join(', ')}`,
      ERROR_CODES.INVALID_INPUT,
      ERROR_TYPES.VALIDATION,
      { file: file.name, errors }
    )
  }

  return {
    success: true,
    data: file,
    error: null
  }
}

/**
 * Validates API responses
 * @param {any} response - API response to validate
 * @param {Object} schema - Expected schema
 * @returns {Object} Validation result
 */
export function validateApiResponse(response, schema) {
  // This would integrate with a schema validation library like Zod or Yup
  // For now, we'll do basic validation
  
  if (!response) {
    return createErrorResponse(
      'Empty response received',
      ERROR_CODES.CLIENT,
      ERROR_TYPES.VALIDATION
    )
  }

  // Basic structure validation
  if (typeof response === 'object' && response.success === false) {
    return response // Already an error response
  }

  return {
    success: true,
    data: response,
    error: null
  }
}
