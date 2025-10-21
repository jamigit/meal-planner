/**
 * @fileoverview Security utilities for input sanitization, CSRF protection, and secure auth
 * 
 * Provides comprehensive security measures including XSS prevention,
 * CSRF protection, secure token handling, and input validation.
 */

/**
 * Security configuration
 */
export const SECURITY_CONFIG = {
  // XSS Prevention
  ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'p', 'br'],
  ALLOWED_ATTRIBUTES: ['class', 'id'],
  MAX_INPUT_LENGTH: 10000,
  
  // CSRF Protection
  CSRF_TOKEN_LENGTH: 32,
  CSRF_TOKEN_EXPIRY: 24 * 60 * 60 * 1000, // 24 hours
  
  // Auth Security
  TOKEN_REFRESH_THRESHOLD: 5 * 60 * 1000, // 5 minutes before expiry
  MAX_LOGIN_ATTEMPTS: 5,
  LOCKOUT_DURATION: 15 * 60 * 1000, // 15 minutes
  
  // File Upload Security
  MAX_FILE_SIZE: 5 * 1024 * 1024, // 5MB
  ALLOWED_FILE_TYPES: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
  SCAN_FILE_CONTENT: true
}

/**
 * XSS Prevention Utilities
 */
export class XSSPrevention {
  /**
   * Sanitizes HTML content to prevent XSS attacks
   * @param {string} html - HTML content to sanitize
   * @returns {string} Sanitized HTML
   */
  static sanitizeHTML(html) {
    if (typeof html !== 'string') return ''
    
    // Remove script tags and event handlers
    let sanitized = html
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
      .replace(/<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi, '')
      .replace(/<embed\b[^<]*(?:(?!<\/embed>)<[^<]*)*<\/embed>/gi, '')
      .replace(/on\w+\s*=/gi, '') // Remove event handlers
      .replace(/javascript:/gi, '') // Remove javascript: protocol
      .replace(/vbscript:/gi, '') // Remove vbscript: protocol
      .replace(/data:/gi, '') // Remove data: protocol
    
    // Allow only specific tags
    const allowedTags = SECURITY_CONFIG.ALLOWED_TAGS.join('|')
    const tagRegex = new RegExp(`<(?!\/?(?:${allowedTags})(?:\s|>))[^>]*>`, 'gi')
    sanitized = sanitized.replace(tagRegex, '')
    
    return sanitized.trim()
  }

  /**
   * Escapes HTML special characters
   * @param {string} text - Text to escape
   * @returns {string} Escaped text
   */
  static escapeHTML(text) {
    if (typeof text !== 'string') return ''
    
    const escapeMap = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#x27;',
      '/': '&#x2F;'
    }
    
    return text.replace(/[&<>"'/]/g, char => escapeMap[char])
  }

  /**
   * Sanitizes user input for safe display
   * @param {string} input - User input to sanitize
   * @param {boolean} allowHTML - Whether to allow HTML tags
   * @returns {string} Sanitized input
   */
  static sanitizeInput(input, allowHTML = false) {
    if (typeof input !== 'string') return ''
    
    // Limit input length
    if (input.length > SECURITY_CONFIG.MAX_INPUT_LENGTH) {
      input = input.substring(0, SECURITY_CONFIG.MAX_INPUT_LENGTH)
    }
    
    if (allowHTML) {
      return this.sanitizeHTML(input)
    } else {
      return this.escapeHTML(input)
    }
  }

  /**
   * Validates and sanitizes URL
   * @param {string} url - URL to validate
   * @returns {string|null} Sanitized URL or null if invalid
   */
  static sanitizeURL(url) {
    if (typeof url !== 'string' || !url.trim()) return null
    
    const trimmedUrl = url.trim()
    
    // Check for dangerous protocols
    const dangerousProtocols = ['javascript:', 'vbscript:', 'data:', 'file:']
    const lowerUrl = trimmedUrl.toLowerCase()
    
    for (const protocol of dangerousProtocols) {
      if (lowerUrl.startsWith(protocol)) {
        return null
      }
    }
    
    // Only allow http/https protocols
    if (!lowerUrl.startsWith('http://') && !lowerUrl.startsWith('https://')) {
      return null
    }
    
    try {
      const urlObj = new URL(trimmedUrl)
      return urlObj.toString()
    } catch {
      return null
    }
  }
}

/**
 * CSRF Protection Utilities
 */
export class CSRFProtection {
  constructor() {
    this.tokens = new Map()
  }

  /**
   * Generates a CSRF token
   * @returns {string} CSRF token
   */
  generateToken() {
    const token = this.generateRandomString(SECURITY_CONFIG.CSRF_TOKEN_LENGTH)
    const expiry = Date.now() + SECURITY_CONFIG.CSRF_TOKEN_EXPIRY
    
    this.tokens.set(token, {
      created: Date.now(),
      expiry,
      used: false
    })
    
    return token
  }

  /**
   * Validates a CSRF token
   * @param {string} token - Token to validate
   * @returns {boolean} Whether token is valid
   */
  validateToken(token) {
    if (!token || typeof token !== 'string') return false
    
    const tokenData = this.tokens.get(token)
    if (!tokenData) return false
    
    // Check if token has expired
    if (Date.now() > tokenData.expiry) {
      this.tokens.delete(token)
      return false
    }
    
    // Mark token as used
    tokenData.used = true
    
    return true
  }

  /**
   * Generates a random string
   * @param {number} length - Length of string to generate
   * @returns {string} Random string
   */
  generateRandomString(length) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
    let result = ''
    
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    
    return result
  }

  /**
   * Cleans up expired tokens
   */
  cleanupExpiredTokens() {
    const now = Date.now()
    for (const [token, data] of this.tokens) {
      if (now > data.expiry) {
        this.tokens.delete(token)
      }
    }
  }
}

// Global CSRF protection instance
export const csrfProtection = new CSRFProtection()

/**
 * Secure Authentication Utilities
 */
export class SecureAuth {
  constructor() {
    this.loginAttempts = new Map()
    this.lockedAccounts = new Map()
  }

  /**
   * Records a login attempt
   * @param {string} identifier - User identifier (email, username, etc.)
   * @param {boolean} success - Whether login was successful
   */
  recordLoginAttempt(identifier, success) {
    const now = Date.now()
    
    if (success) {
      // Reset attempts on successful login
      this.loginAttempts.delete(identifier)
      this.lockedAccounts.delete(identifier)
      return
    }
    
    // Record failed attempt
    const attempts = this.loginAttempts.get(identifier) || []
    attempts.push(now)
    
    // Keep only recent attempts (within lockout duration)
    const recentAttempts = attempts.filter(
      attempt => now - attempt < SECURITY_CONFIG.LOCKOUT_DURATION
    )
    
    this.loginAttempts.set(identifier, recentAttempts)
    
    // Check if account should be locked
    if (recentAttempts.length >= SECURITY_CONFIG.MAX_LOGIN_ATTEMPTS) {
      this.lockedAccounts.set(identifier, now + SECURITY_CONFIG.LOCKOUT_DURATION)
    }
  }

  /**
   * Checks if account is locked
   * @param {string} identifier - User identifier
   * @returns {boolean} Whether account is locked
   */
  isAccountLocked(identifier) {
    const lockExpiry = this.lockedAccounts.get(identifier)
    if (!lockExpiry) return false
    
    if (Date.now() > lockExpiry) {
      this.lockedAccounts.delete(identifier)
      return false
    }
    
    return true
  }

  /**
   * Gets remaining lockout time
   * @param {string} identifier - User identifier
   * @returns {number} Remaining lockout time in milliseconds
   */
  getRemainingLockoutTime(identifier) {
    const lockExpiry = this.lockedAccounts.get(identifier)
    if (!lockExpiry) return 0
    
    return Math.max(0, lockExpiry - Date.now())
  }

  /**
   * Validates password strength
   * @param {string} password - Password to validate
   * @returns {Object} Validation result
   */
  validatePasswordStrength(password) {
    const result = {
      isValid: true,
      score: 0,
      feedback: []
    }
    
    if (!password || typeof password !== 'string') {
      result.isValid = false
      result.feedback.push('Password is required')
      return result
    }
    
    // Length check
    if (password.length < 8) {
      result.feedback.push('Password must be at least 8 characters long')
    } else {
      result.score += 1
    }
    
    // Character variety checks
    if (/[a-z]/.test(password)) result.score += 1
    else result.feedback.push('Password must contain lowercase letters')
    
    if (/[A-Z]/.test(password)) result.score += 1
    else result.feedback.push('Password must contain uppercase letters')
    
    if (/[0-9]/.test(password)) result.score += 1
    else result.feedback.push('Password must contain numbers')
    
    if (/[^a-zA-Z0-9]/.test(password)) result.score += 1
    else result.feedback.push('Password must contain special characters')
    
    // Common password check
    const commonPasswords = ['password', '123456', 'qwerty', 'abc123', 'password123']
    if (commonPasswords.includes(password.toLowerCase())) {
      result.feedback.push('Password is too common')
      result.score = Math.max(0, result.score - 2)
    }
    
    result.isValid = result.score >= 3 && result.feedback.length === 0
    
    return result
  }

  /**
   * Securely stores authentication token
   * @param {string} token - Token to store
   * @param {string} key - Storage key
   */
  storeTokenSecurely(token, key = 'auth_token') {
    try {
      // In production, use httpOnly cookies instead of localStorage
      if (process.env.NODE_ENV === 'production') {
        // Set httpOnly cookie (would need server-side implementation)
        document.cookie = `${key}=${token}; HttpOnly; Secure; SameSite=Strict; Max-Age=${24 * 60 * 60}`
      } else {
        // Development fallback to localStorage
        localStorage.setItem(key, token)
      }
    } catch (error) {
      console.error('Failed to store token securely:', error)
    }
  }

  /**
   * Retrieves authentication token
   * @param {string} key - Storage key
   * @returns {string|null} Token or null if not found
   */
  getTokenSecurely(key = 'auth_token') {
    try {
      // In production, token would be in httpOnly cookie
      if (process.env.NODE_ENV === 'production') {
        // Would need server-side implementation to read httpOnly cookies
        return null
      } else {
        // Development fallback
        return localStorage.getItem(key)
      }
    } catch (error) {
      console.error('Failed to retrieve token:', error)
      return null
    }
  }

  /**
   * Removes authentication token
   * @param {string} key - Storage key
   */
  removeTokenSecurely(key = 'auth_token') {
    try {
      if (process.env.NODE_ENV === 'production') {
        // Clear httpOnly cookie
        document.cookie = `${key}=; HttpOnly; Secure; SameSite=Strict; Max-Age=0`
      } else {
        // Development fallback
        localStorage.removeItem(key)
      }
    } catch (error) {
      console.error('Failed to remove token:', error)
    }
  }
}

// Global secure auth instance
export const secureAuth = new SecureAuth()

/**
 * File Upload Security
 */
export class FileUploadSecurity {
  /**
   * Validates file upload
   * @param {File} file - File to validate
   * @returns {Object} Validation result
   */
  static validateFile(file) {
    const result = {
      isValid: true,
      errors: []
    }
    
    if (!file || !(file instanceof File)) {
      result.isValid = false
      result.errors.push('Invalid file')
      return result
    }
    
    // Size check
    if (file.size > SECURITY_CONFIG.MAX_FILE_SIZE) {
      result.isValid = false
      result.errors.push(`File size must be less than ${Math.round(SECURITY_CONFIG.MAX_FILE_SIZE / 1024 / 1024)}MB`)
    }
    
    // Type check
    if (!SECURITY_CONFIG.ALLOWED_FILE_TYPES.includes(file.type)) {
      result.isValid = false
      result.errors.push(`File type ${file.type} is not allowed`)
    }
    
    // Extension check
    const extension = '.' + file.name.split('.').pop().toLowerCase()
    const allowedExtensions = SECURITY_CONFIG.ALLOWED_FILE_TYPES.map(type => 
      '.' + type.split('/')[1]
    )
    
    if (!allowedExtensions.includes(extension)) {
      result.isValid = false
      result.errors.push(`File extension ${extension} is not allowed`)
    }
    
    return result
  }

  /**
   * Scans file content for malicious content
   * @param {File} file - File to scan
   * @returns {Promise<Object>} Scan result
   */
  static async scanFileContent(file) {
    const result = {
      isSafe: true,
      warnings: []
    }
    
    if (!SECURITY_CONFIG.SCAN_FILE_CONTENT) {
      return result
    }
    
    try {
      const content = await this.readFileContent(file)
      
      // Check for suspicious patterns
      const suspiciousPatterns = [
        /<script/i,
        /javascript:/i,
        /vbscript:/i,
        /onload=/i,
        /onerror=/i
      ]
      
      for (const pattern of suspiciousPatterns) {
        if (pattern.test(content)) {
          result.isSafe = false
          result.warnings.push('File contains potentially malicious content')
          break
        }
      }
    } catch (error) {
      result.warnings.push('Could not scan file content')
    }
    
    return result
  }

  /**
   * Reads file content as text
   * @param {File} file - File to read
   * @returns {Promise<string>} File content
   */
  static readFileContent(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result)
      reader.onerror = reject
      reader.readAsText(file)
    })
  }
}

/**
 * Input Validation Security
 */
export class InputValidationSecurity {
  /**
   * Validates and sanitizes form input
   * @param {Object} formData - Form data to validate
   * @param {Object} schema - Validation schema
   * @returns {Object} Validation result
   */
  static validateFormInput(formData, schema) {
    const result = {
      isValid: true,
      data: {},
      errors: {}
    }
    
    for (const [field, rules] of Object.entries(schema)) {
      const value = formData[field]
      const fieldResult = this.validateField(value, rules, field)
      
      if (!fieldResult.isValid) {
        result.isValid = false
        result.errors[field] = fieldResult.errors
      } else {
        result.data[field] = fieldResult.value
      }
    }
    
    return result
  }

  /**
   * Validates a single field
   * @param {any} value - Value to validate
   * @param {Object} rules - Validation rules
   * @param {string} fieldName - Field name
   * @returns {Object} Field validation result
   */
  static validateField(value, rules, fieldName) {
    const result = {
      isValid: true,
      value: value,
      errors: []
    }
    
    // Required check
    if (rules.required && (value === null || value === undefined || value === '')) {
      result.isValid = false
      result.errors.push(`${fieldName} is required`)
      return result
    }
    
    // Skip other validations if field is empty and not required
    if (!rules.required && (value === null || value === undefined || value === '')) {
      return result
    }
    
    // Type-specific validation
    if (rules.type === 'string') {
      result.value = XSSPrevention.sanitizeInput(String(value), rules.allowHTML)
    } else if (rules.type === 'url') {
      result.value = XSSPrevention.sanitizeURL(String(value))
      if (!result.value && value) {
        result.isValid = false
        result.errors.push(`${fieldName} is not a valid URL`)
      }
    } else if (rules.type === 'email') {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(String(value))) {
        result.isValid = false
        result.errors.push(`${fieldName} is not a valid email`)
      } else {
        result.value = String(value).toLowerCase().trim()
      }
    }
    
    // Length validation
    if (rules.minLength && String(result.value).length < rules.minLength) {
      result.isValid = false
      result.errors.push(`${fieldName} must be at least ${rules.minLength} characters`)
    }
    
    if (rules.maxLength && String(result.value).length > rules.maxLength) {
      result.isValid = false
      result.errors.push(`${fieldName} must be no more than ${rules.maxLength} characters`)
    }
    
    return result
  }
}
