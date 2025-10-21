/**
 * @fileoverview Enhanced data validation utilities
 * 
 * Provides comprehensive validation for forms, API data, and user input
 * with real-time validation, error messages, and schema validation.
 */

/**
 * Validation result structure
 * @typedef {Object} ValidationResult
 * @property {boolean} isValid - Whether the validation passed
 * @property {string[]} errors - Array of error messages
 * @property {Object} data - Cleaned/validated data
 */

/**
 * Field validation rules
 * @typedef {Object} ValidationRule
 * @property {boolean} required - Whether the field is required
 * @property {number} minLength - Minimum length for strings
 * @property {number} maxLength - Maximum length for strings
 * @property {number} min - Minimum value for numbers
 * @property {number} max - Maximum value for numbers
 * @property {RegExp} pattern - Regex pattern for validation
 * @property {Function} custom - Custom validation function
 * @property {string} message - Custom error message
 */

/**
 * Validation rules for different field types
 */
export const VALIDATION_RULES = {
  // Recipe validation rules
  recipe: {
    name: {
      required: true,
      minLength: 1,
      maxLength: 200,
      pattern: /^[a-zA-Z0-9\s\-'&.,()]+$/,
      message: 'Recipe name must be 1-200 characters and contain only letters, numbers, spaces, and common punctuation'
    },
    url: {
      required: false,
      custom: (value) => {
        if (!value || value === '') return null
        const trimmedValue = value.trim()
        if (!trimmedValue) return null
        if (!/^https?:\/\/.+/.test(trimmedValue)) {
          return 'URL must start with http:// or https://'
        }
        return null
      }
    },
    prep_time: {
      required: false,
      min: -10,
      max: 1440, // 24 hours in minutes
      message: 'Prep time must be between -10 and 1440 minutes'
    },
    cook_time: {
      required: false,
      min: -10,
      max: 1440,
      message: 'Cook time must be between -10 and 1440 minutes'
    },
    servings: {
      required: false,
      min: 1,
      max: 50,
      message: 'Servings must be between 1 and 50'
    },
    ingredients: {
      required: false,
      custom: (value) => {
        if (!Array.isArray(value)) return 'Ingredients must be an array'
        if (value.length > 50) return 'Maximum 50 ingredients allowed'
        return value.every(ingredient => 
          typeof ingredient === 'string' && 
          ingredient.trim().length > 0 && 
          ingredient.length <= 200
        ) ? null : 'Each ingredient must be a non-empty string under 200 characters'
      }
    },
    instructions: {
      required: false,
      custom: (value) => {
        if (!Array.isArray(value)) return 'Instructions must be an array'
        if (value.length > 20) return 'Maximum 20 instruction steps allowed'
        return value.every(instruction => 
          typeof instruction === 'string' && 
          instruction.trim().length > 0 && 
          instruction.length <= 1000
        ) ? null : 'Each instruction must be a non-empty string under 1000 characters'
      }
    },
    tags: {
      required: false,
      custom: (value) => {
        if (!Array.isArray(value)) return 'Tags must be an array'
        if (value.length > 20) return 'Maximum 20 tags allowed'
        return value.every(tag => 
          typeof tag === 'string' && 
          tag.trim().length > 0 && 
          tag.length <= 50 &&
          /^[a-zA-Z0-9\s\-_]+$/.test(tag)
        ) ? null : 'Each tag must be 1-50 characters with only letters, numbers, spaces, hyphens, and underscores'
      }
    }
  },

  // Weekly plan validation rules
  weeklyPlan: {
    name: {
      required: false,
      maxLength: 100,
      pattern: /^[a-zA-Z0-9\s\-'&.,()]+$/,
      message: 'Plan name must be under 100 characters and contain only letters, numbers, spaces, and common punctuation'
    },
    notes: {
      required: false,
      maxLength: 1000,
      message: 'Notes must be under 1000 characters'
    },
    meals: {
      required: false,
      custom: (value) => {
        if (!Array.isArray(value)) return 'Meals must be an array'
        if (value.length > 7) return 'Maximum 7 meals per week allowed'
        return value.every(meal => 
          meal && 
          typeof meal === 'object' && 
          meal.id && 
          typeof meal.id === 'string' &&
          meal.name &&
          typeof meal.name === 'string'
        ) ? null : 'Each meal must be an object with valid id and name'
      }
    }
  },

  // User input validation rules
  userInput: {
    email: {
      required: true,
      pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
      message: 'Please enter a valid email address'
    },
    password: {
      required: true,
      minLength: 8,
      maxLength: 128,
      pattern: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
      message: 'Password must be 8-128 characters with at least one lowercase letter, one uppercase letter, one number, and one special character'
    },
    searchQuery: {
      required: false,
      maxLength: 100,
      pattern: /^[a-zA-Z0-9\s\-_.,]+$/,
      message: 'Search query must be under 100 characters and contain only letters, numbers, spaces, and common punctuation'
    }
  }
}

/**
 * Validates a single field against its rules
 * @param {any} value - Value to validate
 * @param {ValidationRule} rules - Validation rules
 * @param {string} fieldName - Name of the field for error messages
 * @returns {string[]} Array of error messages (empty if valid)
 */
export function validateField(value, rules, fieldName) {
  const errors = []

  // Required field check
  if (rules.required && (value === null || value === undefined || value === '')) {
    errors.push(`${fieldName} is required`)
    return errors
  }

  // Skip other validations if field is empty and not required
  if (!rules.required && (value === null || value === undefined || value === '')) {
    return errors
  }

  // String length validations
  if (typeof value === 'string') {
    if (rules.minLength && value.length < rules.minLength) {
      errors.push(`${fieldName} must be at least ${rules.minLength} characters`)
    }
    if (rules.maxLength && value.length > rules.maxLength) {
      errors.push(`${fieldName} must be no more than ${rules.maxLength} characters`)
    }
  }

  // Number validations
  if (typeof value === 'number') {
    if (rules.min !== undefined && value < rules.min) {
      errors.push(`${fieldName} must be at least ${rules.min}`)
    }
    if (rules.max !== undefined && value > rules.max) {
      errors.push(`${fieldName} must be no more than ${rules.max}`)
    }
  }

  // Pattern validation
  if (rules.pattern && typeof value === 'string' && !rules.pattern.test(value)) {
    errors.push(rules.message || `${fieldName} format is invalid`)
  }

  // Custom validation
  if (rules.custom) {
    const customError = rules.custom(value)
    if (customError) {
      errors.push(customError)
    }
  }

  return errors
}

/**
 * Validates an entire object against schema rules
 * @param {Object} data - Data to validate
 * @param {Object} schema - Schema with validation rules
 * @returns {ValidationResult}
 */
export function validateObject(data, schema) {
  const errors = []
  const cleanedData = {}

  for (const [fieldName, rules] of Object.entries(schema)) {
    const value = data[fieldName]
    const fieldErrors = validateField(value, rules, fieldName)
    
    if (fieldErrors.length > 0) {
      errors.push(...fieldErrors)
    } else {
      // Clean the data
      cleanedData[fieldName] = cleanValue(value, rules)
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    data: cleanedData
  }
}

/**
 * Cleans a value based on validation rules
 * @param {any} value - Value to clean
 * @param {ValidationRule} rules - Validation rules
 * @returns {any} Cleaned value
 */
function cleanValue(value, rules) {
  if (value === null || value === undefined) {
    return rules.required ? value : null
  }

  if (typeof value === 'string') {
    return value.trim()
  }

  if (typeof value === 'number') {
    return isNaN(value) ? null : value
  }

  if (Array.isArray(value)) {
    return value.filter(item => item !== null && item !== undefined)
  }

  return value
}

/**
 * Real-time form validation hook
 * @param {Object} initialData - Initial form data
 * @param {Object} schema - Validation schema
 * @returns {Object} Form validation state and methods
 */
export function useFormValidation(initialData, schema) {
  const [data, setData] = React.useState(initialData)
  const [errors, setErrors] = React.useState({})
  const [touched, setTouched] = React.useState({})
  const [isValid, setIsValid] = React.useState(false)

  // Validate entire form
  const validateForm = React.useCallback(() => {
    const result = validateObject(data, schema)
    setErrors(result.errors.reduce((acc, error) => {
      // Extract field name from error message
      const fieldName = error.split(' ')[0].toLowerCase()
      acc[fieldName] = error
      return acc
    }, {}))
    setIsValid(result.isValid)
    return result
  }, [data, schema])

  // Validate single field
  const validateField = React.useCallback((fieldName, value) => {
    const rules = schema[fieldName]
    if (!rules) return

    const fieldErrors = validateField(value, rules, fieldName)
    setErrors(prev => ({
      ...prev,
      [fieldName]: fieldErrors.length > 0 ? fieldErrors[0] : null
    }))
  }, [schema])

  // Update field value and validate
  const updateField = React.useCallback((fieldName, value) => {
    setData(prev => ({ ...prev, [fieldName]: value }))
    validateField(fieldName, value)
  }, [validateField])

  // Mark field as touched
  const touchField = React.useCallback((fieldName) => {
    setTouched(prev => ({ ...prev, [fieldName]: true }))
  }, [])

  // Reset form
  const resetForm = React.useCallback(() => {
    setData(initialData)
    setErrors({})
    setTouched({})
    setIsValid(false)
  }, [initialData])

  // Validate on data change
  React.useEffect(() => {
    validateForm()
  }, [validateForm])

  return {
    data,
    errors,
    touched,
    isValid,
    updateField,
    touchField,
    resetForm,
    validateForm
  }
}

/**
 * Sanitizes user input to prevent XSS
 * @param {string} input - User input to sanitize
 * @returns {string} Sanitized input
 */
export function sanitizeInput(input) {
  if (typeof input !== 'string') return input
  
  return input
    .replace(/[<>]/g, '') // Remove < and >
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+=/gi, '') // Remove event handlers
    .trim()
}

/**
 * Validates and sanitizes recipe data
 * @param {Object} recipe - Recipe data to validate
 * @returns {ValidationResult}
 */
export function validateRecipe(recipe) {
  return validateObject(recipe, VALIDATION_RULES.recipe)
}

/**
 * Validates and sanitizes weekly plan data
 * @param {Object} plan - Weekly plan data to validate
 * @returns {ValidationResult}
 */
export function validateWeeklyPlan(plan) {
  return validateObject(plan, VALIDATION_RULES.weeklyPlan)
}

/**
 * Validates user input (search queries, etc.)
 * @param {string} input - User input to validate
 * @param {string} type - Type of input (searchQuery, etc.)
 * @returns {ValidationResult}
 */
export function validateUserInput(input, type = 'searchQuery') {
  const rules = VALIDATION_RULES.userInput[type]
  if (!rules) {
    return { isValid: true, errors: [], data: input }
  }

  const errors = validateField(input, rules, type)
  return {
    isValid: errors.length === 0,
    errors,
    data: sanitizeInput(input)
  }
}
