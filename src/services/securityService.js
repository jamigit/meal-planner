/**
 * @fileoverview Security service for integrating security features with existing services
 * 
 * Provides security middleware and utilities for service operations,
 * authentication, and data handling.
 */

import { 
  XSSPrevention, 
  csrfProtection, 
  secureAuth, 
  FileUploadSecurity,
  InputValidationSecurity 
} from '../utils/security.js'
import { wrapServiceMethod } from './serviceWrapper.js'

/**
 * Security service for integrating security features
 */
export class SecurityService {
  constructor() {
    this.securityConfig = {
      enableXSSProtection: true,
      enableCSRFProtection: true,
      enableInputValidation: true,
      enableFileScanning: true,
      logSecurityEvents: true
    }
  }

  /**
   * Wraps a service method with security features
   * @param {Function} serviceMethod - Service method to wrap
   * @param {string} operation - Operation name
   * @param {Object} options - Security options
   * @returns {Function} Secured service method
   */
  wrapWithSecurity(serviceMethod, operation, options = {}) {
    const {
      requireAuth = false,
      validateInput = true,
      sanitizeOutput = true,
      enableCSRF = true
    } = options

    return async (...args) => {
      try {
        // CSRF protection
        if (enableCSRF && this.securityConfig.enableCSRFProtection) {
          const csrfToken = this.extractCSRFToken(args)
          if (csrfToken && !csrfProtection.validateToken(csrfToken)) {
            throw new Error('Invalid CSRF token')
          }
        }

        // Authentication check
        if (requireAuth) {
          const isAuthenticated = await this.checkAuthentication()
          if (!isAuthenticated) {
            throw new Error('Authentication required')
          }
        }

        // Input validation and sanitization
        if (validateInput && this.securityConfig.enableInputValidation) {
          args = await this.validateAndSanitizeInputs(args, operation)
        }

        // Execute service method
        const result = await serviceMethod(...args)

        // Output sanitization
        if (sanitizeOutput && this.securityConfig.enableXSSProtection) {
          return this.sanitizeOutput(result)
        }

        return result
      } catch (error) {
        this.logSecurityEvent('security_error', operation, error)
        throw error
      }
    }
  }

  /**
   * Validates and sanitizes input data
   * @param {Array} args - Service method arguments
   * @param {string} operation - Operation name
   * @returns {Array} Sanitized arguments
   */
  async validateAndSanitizeInputs(args, operation) {
    const sanitizedArgs = []

    for (let i = 0; i < args.length; i++) {
      const arg = args[i]
      
      if (typeof arg === 'object' && arg !== null) {
        // Sanitize object properties
        sanitizedArgs.push(this.sanitizeObject(arg))
      } else if (typeof arg === 'string') {
        // Sanitize string input
        sanitizedArgs.push(XSSPrevention.sanitizeInput(arg))
      } else {
        // Pass through other types
        sanitizedArgs.push(arg)
      }
    }

    return sanitizedArgs
  }

  /**
   * Sanitizes object properties
   * @param {Object} obj - Object to sanitize
   * @returns {Object} Sanitized object
   */
  sanitizeObject(obj) {
    if (Array.isArray(obj)) {
      return obj.map(item => 
        typeof item === 'object' && item !== null 
          ? this.sanitizeObject(item) 
          : typeof item === 'string' 
            ? XSSPrevention.sanitizeInput(item)
            : item
      )
    }

    const sanitized = {}
    for (const [key, value] of Object.entries(obj)) {
      if (typeof value === 'string') {
        sanitized[key] = XSSPrevention.sanitizeInput(value)
      } else if (typeof value === 'object' && value !== null) {
        sanitized[key] = this.sanitizeObject(value)
      } else {
        sanitized[key] = value
      }
    }

    return sanitized
  }

  /**
   * Sanitizes service output
   * @param {any} output - Service output to sanitize
   * @returns {any} Sanitized output
   */
  sanitizeOutput(output) {
    if (typeof output === 'string') {
      return XSSPrevention.sanitizeInput(output)
    } else if (typeof output === 'object' && output !== null) {
      return this.sanitizeObject(output)
    }
    return output
  }

  /**
   * Extracts CSRF token from arguments
   * @param {Array} args - Service method arguments
   * @returns {string|null} CSRF token
   */
  extractCSRFToken(args) {
    // Look for CSRF token in various places
    for (const arg of args) {
      if (typeof arg === 'object' && arg !== null) {
        if (arg._csrf) return arg._csrf
        if (arg.csrfToken) return arg.csrfToken
        if (arg.headers && arg.headers['x-csrf-token']) {
          return arg.headers['x-csrf-token']
        }
      }
    }
    return null
  }

  /**
   * Checks authentication status
   * @returns {Promise<boolean>} Whether user is authenticated
   */
  async checkAuthentication() {
    try {
      const token = secureAuth.getTokenSecurely()
      return !!token
    } catch (error) {
      return false
    }
  }

  /**
   * Logs security events
   * @param {string} event - Event type
   * @param {string} operation - Operation name
   * @param {Error} error - Error object
   */
  logSecurityEvent(event, operation, error) {
    if (!this.securityConfig.logSecurityEvents) return

    const logData = {
      timestamp: new Date().toISOString(),
      event,
      operation,
      error: error?.message,
      userAgent: navigator.userAgent,
      url: window.location.href
    }

    console.warn('Security Event:', logData)
    
    // In production, send to security monitoring service
    if (process.env.NODE_ENV === 'production') {
      // Example: send to security monitoring service
      // securityMonitoringService.log(logData)
    }
  }

  /**
   * Validates file upload
   * @param {File} file - File to validate
   * @returns {Promise<Object>} Validation result
   */
  async validateFileUpload(file) {
    const validation = FileUploadSecurity.validateFile(file)
    
    if (!validation.isValid) {
      this.logSecurityEvent('file_upload_rejected', 'file_validation', 
        new Error(validation.errors.join(', ')))
      return validation
    }

    if (this.securityConfig.enableFileScanning) {
      const scanResult = await FileUploadSecurity.scanFileContent(file)
      if (!scanResult.isSafe) {
        this.logSecurityEvent('file_upload_malicious', 'file_scan', 
          new Error('Malicious content detected'))
        return {
          isValid: false,
          errors: ['File contains potentially malicious content']
        }
      }
    }

    return validation
  }

  /**
   * Records login attempt
   * @param {string} identifier - User identifier
   * @param {boolean} success - Whether login was successful
   */
  recordLoginAttempt(identifier, success) {
    secureAuth.recordLoginAttempt(identifier, success)
    
    this.logSecurityEvent(
      success ? 'login_success' : 'login_failure',
      'authentication',
      new Error(success ? 'Login successful' : 'Login failed')
    )
  }

  /**
   * Checks if account is locked
   * @param {string} identifier - User identifier
   * @returns {boolean} Whether account is locked
   */
  isAccountLocked(identifier) {
    return secureAuth.isAccountLocked(identifier)
  }

  /**
   * Validates password strength
   * @param {string} password - Password to validate
   * @returns {Object} Validation result
   */
  validatePassword(password) {
    return secureAuth.validatePasswordStrength(password)
  }

  /**
   * Securely stores authentication token
   * @param {string} token - Token to store
   */
  storeAuthToken(token) {
    secureAuth.storeTokenSecurely(token)
  }

  /**
   * Retrieves authentication token
   * @returns {string|null} Token or null
   */
  getAuthToken() {
    return secureAuth.getTokenSecurely()
  }

  /**
   * Removes authentication token
   */
  removeAuthToken() {
    secureAuth.removeTokenSecurely()
  }

  /**
   * Generates CSRF token
   * @returns {string} CSRF token
   */
  generateCSRFToken() {
    return csrfProtection.generateToken()
  }

  /**
   * Validates CSRF token
   * @param {string} token - Token to validate
   * @returns {boolean} Whether token is valid
   */
  validateCSRFToken(token) {
    return csrfProtection.validateToken(token)
  }

  /**
   * Updates security configuration
   * @param {Object} config - New configuration
   */
  updateSecurityConfig(config) {
    this.securityConfig = { ...this.securityConfig, ...config }
  }
}

// Global security service instance
export const securityService = new SecurityService()

/**
 * Higher-order function for securing service methods
 * @param {Function} serviceMethod - Service method to secure
 * @param {string} operation - Operation name
 * @param {Object} options - Security options
 * @returns {Function} Secured service method
 */
export function withSecurity(serviceMethod, operation, options = {}) {
  return securityService.wrapWithSecurity(serviceMethod, operation, options)
}

/**
 * Wraps an entire service with security features
 * @param {Object} service - Service to wrap
 * @param {string} serviceName - Name of the service
 * @param {Object} methodOptions - Security options per method
 * @returns {Object} Secured service
 */
export function wrapServiceWithSecurity(service, serviceName, methodOptions = {}) {
  const securedService = {}
  
  // Get all methods from the service
  const methods = Object.getOwnPropertyNames(Object.getPrototypeOf(service))
    .filter(name => name !== 'constructor' && typeof service[name] === 'function')
  
  // Wrap each method with security
  methods.forEach(methodName => {
    const options = methodOptions[methodName] || {}
    securedService[methodName] = withSecurity(
      service[methodName],
      `${serviceName}.${methodName}`,
      options
    )
  })
  
  return securedService
}

/**
 * Security middleware for React components
 * @param {React.Component} Component - Component to wrap
 * @param {Object} options - Security options
 * @returns {React.Component} Secured component
 */
export function withSecurityMiddleware(Component, options = {}) {
  const {
    requireAuth = false,
    enableCSRF = true,
    sanitizeProps = true
  } = options

  return function SecuredComponent(props) {
    const [isAuthenticated, setIsAuthenticated] = React.useState(false)
    const [csrfToken, setCsrfToken] = React.useState('')

    React.useEffect(() => {
      // Check authentication
      if (requireAuth) {
        const checkAuth = async () => {
          const authenticated = await securityService.checkAuthentication()
          setIsAuthenticated(authenticated)
        }
        checkAuth()
      }

      // Generate CSRF token
      if (enableCSRF) {
        const token = securityService.generateCSRFToken()
        setCsrfToken(token)
      }
    }, [requireAuth, enableCSRF])

    // Sanitize props
    const sanitizedProps = React.useMemo(() => {
      if (!sanitizeProps) return props
      
      const sanitized = {}
      for (const [key, value] of Object.entries(props)) {
        if (typeof value === 'string') {
          sanitized[key] = XSSPrevention.sanitizeInput(value)
        } else {
          sanitized[key] = value
        }
      }
      return sanitized
    }, [props, sanitizeProps])

    // Show loading or auth required message
    if (requireAuth && !isAuthenticated) {
      return (
        <div className="security-auth-required">
          <p>Authentication required to access this component.</p>
        </div>
      )
    }

    return (
      <Component 
        {...sanitizedProps} 
        csrfToken={csrfToken}
        isAuthenticated={isAuthenticated}
      />
    )
  }
}
