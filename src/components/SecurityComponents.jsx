/**
 * @fileoverview Security-aware React components
 * 
 * Provides React components with built-in security features including
 * XSS prevention, CSRF protection, and secure form handling.
 */

import React from 'react'
import { XSSPrevention, csrfProtection, secureAuth, FileUploadSecurity } from '../utils/security.js'

/**
 * Secure text display component that prevents XSS
 * @param {Object} props - Component props
 * @returns {JSX.Element}
 */
export function SecureText({ 
  children, 
  allowHTML = false, 
  maxLength = null,
  className = '',
  ...props 
}) {
  const sanitizedContent = React.useMemo(() => {
    if (typeof children !== 'string') return children
    
    let content = children
    
    // Limit length if specified
    if (maxLength && content.length > maxLength) {
      content = content.substring(0, maxLength) + '...'
    }
    
    return allowHTML 
      ? XSSPrevention.sanitizeHTML(content)
      : XSSPrevention.escapeHTML(content)
  }, [children, allowHTML, maxLength])

  if (allowHTML) {
    return (
      <span 
        className={className}
        dangerouslySetInnerHTML={{ __html: sanitizedContent }}
        {...props}
      />
    )
  }

  return (
    <span className={className} {...props}>
      {sanitizedContent}
    </span>
  )
}

/**
 * Secure input component with XSS prevention
 * @param {Object} props - Component props
 * @returns {JSX.Element}
 */
export function SecureInput({ 
  value, 
  onChange, 
  onBlur,
  maxLength = 1000,
  sanitizeOnBlur = true,
  className = '',
  ...props 
}) {
  const [internalValue, setInternalValue] = React.useState(value || '')

  React.useEffect(() => {
    setInternalValue(value || '')
  }, [value])

  const handleChange = React.useCallback((e) => {
    const newValue = e.target.value
    
    // Limit length
    if (newValue.length > maxLength) {
      return
    }
    
    setInternalValue(newValue)
    onChange?.(e)
  }, [onChange, maxLength])

  const handleBlur = React.useCallback((e) => {
    if (sanitizeOnBlur) {
      const sanitizedValue = XSSPrevention.sanitizeInput(internalValue)
      setInternalValue(sanitizedValue)
      
      // Create synthetic event with sanitized value
      const syntheticEvent = {
        ...e,
        target: {
          ...e.target,
          value: sanitizedValue
        }
      }
      
      onBlur?.(syntheticEvent)
    } else {
      onBlur?.(e)
    }
  }, [internalValue, sanitizeOnBlur, onBlur])

  return (
    <input
      value={internalValue}
      onChange={handleChange}
      onBlur={handleBlur}
      className={className}
      {...props}
    />
  )
}

/**
 * Secure textarea component with XSS prevention
 * @param {Object} props - Component props
 * @returns {JSX.Element}
 */
export function SecureTextarea({ 
  value, 
  onChange, 
  onBlur,
  maxLength = 5000,
  sanitizeOnBlur = true,
  className = '',
  ...props 
}) {
  const [internalValue, setInternalValue] = React.useState(value || '')

  React.useEffect(() => {
    setInternalValue(value || '')
  }, [value])

  const handleChange = React.useCallback((e) => {
    const newValue = e.target.value
    
    // Limit length
    if (newValue.length > maxLength) {
      return
    }
    
    setInternalValue(newValue)
    onChange?.(e)
  }, [onChange, maxLength])

  const handleBlur = React.useCallback((e) => {
    if (sanitizeOnBlur) {
      const sanitizedValue = XSSPrevention.sanitizeInput(internalValue)
      setInternalValue(sanitizedValue)
      
      // Create synthetic event with sanitized value
      const syntheticEvent = {
        ...e,
        target: {
          ...e.target,
          value: sanitizedValue
        }
      }
      
      onBlur?.(syntheticEvent)
    } else {
      onBlur?.(e)
    }
  }, [internalValue, sanitizeOnBlur, onBlur])

  return (
    <textarea
      value={internalValue}
      onChange={handleChange}
      onBlur={handleBlur}
      className={className}
      {...props}
    />
  )
}

/**
 * Secure form component with CSRF protection
 * @param {Object} props - Component props
 * @returns {JSX.Element}
 */
export function SecureForm({ 
  children, 
  onSubmit, 
  method = 'POST',
  className = '',
  ...props 
}) {
  const [csrfToken, setCsrfToken] = React.useState('')

  React.useEffect(() => {
    // Generate CSRF token for form
    const token = csrfProtection.generateToken()
    setCsrfToken(token)
  }, [])

  const handleSubmit = React.useCallback((e) => {
    e.preventDefault()
    
    // Validate CSRF token
    if (!csrfProtection.validateToken(csrfToken)) {
      console.error('Invalid CSRF token')
      return
    }
    
    // Extract form data
    const formData = new FormData(e.target)
    const data = Object.fromEntries(formData.entries())
    
    onSubmit?.(data, e)
  }, [onSubmit, csrfToken])

  return (
    <form 
      onSubmit={handleSubmit}
      method={method}
      className={className}
      {...props}
    >
      <input type="hidden" name="_csrf" value={csrfToken} />
      {children}
    </form>
  )
}

/**
 * Secure file upload component
 * @param {Object} props - Component props
 * @returns {JSX.Element}
 */
export function SecureFileUpload({ 
  onFileSelect, 
  onError,
  accept = 'image/*',
  maxSize = 5 * 1024 * 1024, // 5MB
  className = '',
  ...props 
}) {
  const [isUploading, setIsUploading] = React.useState(false)
  const [error, setError] = React.useState(null)

  const handleFileChange = React.useCallback(async (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsUploading(true)
    setError(null)

    try {
      // Validate file
      const validation = FileUploadSecurity.validateFile(file)
      if (!validation.isValid) {
        throw new Error(validation.errors.join(', '))
      }

      // Scan file content
      const scanResult = await FileUploadSecurity.scanFileContent(file)
      if (!scanResult.isSafe) {
        throw new Error('File contains potentially malicious content')
      }

      onFileSelect?.(file)
    } catch (err) {
      const errorMessage = err.message || 'File upload failed'
      setError(errorMessage)
      onError?.(errorMessage)
    } finally {
      setIsUploading(false)
    }
  }, [onFileSelect, onError])

  return (
    <div className={`secure-file-upload ${className}`}>
      <input
        type="file"
        onChange={handleFileChange}
        accept={accept}
        disabled={isUploading}
        {...props}
      />
      
      {isUploading && (
        <div className="upload-progress">
          <span>Scanning file...</span>
        </div>
      )}
      
      {error && (
        <div className="upload-error text-red-600 text-sm mt-1">
          {error}
        </div>
      )}
    </div>
  )
}

/**
 * Password strength indicator component
 * @param {Object} props - Component props
 * @returns {JSX.Element}
 */
export function PasswordStrengthIndicator({ 
  password, 
  className = '',
  showFeedback = true 
}) {
  const strength = React.useMemo(() => {
    return secureAuth.validatePasswordStrength(password)
  }, [password])

  const getStrengthColor = (score) => {
    if (score < 2) return 'text-red-600'
    if (score < 3) return 'text-yellow-600'
    if (score < 4) return 'text-blue-600'
    return 'text-green-600'
  }

  const getStrengthText = (score) => {
    if (score < 2) return 'Weak'
    if (score < 3) return 'Fair'
    if (score < 4) return 'Good'
    return 'Strong'
  }

  return (
    <div className={`password-strength ${className}`}>
      <div className="flex items-center space-x-2">
        <div className="flex space-x-1">
          {[1, 2, 3, 4].map((level) => (
            <div
              key={level}
              className={`w-3 h-3 rounded-full ${
                level <= strength.score 
                  ? 'bg-current' 
                  : 'bg-gray-300'
              }`}
            />
          ))}
        </div>
        <span className={`text-sm font-medium ${getStrengthColor(strength.score)}`}>
          {getStrengthText(strength.score)}
        </span>
      </div>
      
      {showFeedback && strength.feedback.length > 0 && (
        <div className="mt-2 text-sm text-gray-600">
          <ul className="list-disc list-inside space-y-1">
            {strength.feedback.map((feedback, index) => (
              <li key={index}>{feedback}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

/**
 * Login attempt tracker component
 * @param {Object} props - Component props
 * @returns {JSX.Element}
 */
export function LoginAttemptTracker({ 
  identifier, 
  onLockout,
  className = '' 
}) {
  const [isLocked, setIsLocked] = React.useState(false)
  const [remainingTime, setRemainingTime] = React.useState(0)

  React.useEffect(() => {
    const checkLockStatus = () => {
      const locked = secureAuth.isAccountLocked(identifier)
      setIsLocked(locked)
      
      if (locked) {
        const time = secureAuth.getRemainingLockoutTime(identifier)
        setRemainingTime(time)
        
        if (time <= 0) {
          setIsLocked(false)
        }
      }
    }

    checkLockStatus()
    
    const interval = setInterval(checkLockStatus, 1000)
    return () => clearInterval(interval)
  }, [identifier])

  React.useEffect(() => {
    if (isLocked) {
      onLockout?.(remainingTime)
    }
  }, [isLocked, remainingTime, onLockout])

  if (!isLocked) return null

  const minutes = Math.ceil(remainingTime / 60000)

  return (
    <div className={`login-lockout ${className}`}>
      <div className="bg-red-50 border border-red-200 rounded-md p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">
              Account Locked
            </h3>
            <div className="mt-2 text-sm text-red-700">
              <p>
                Too many failed login attempts. Please try again in {minutes} minute{minutes !== 1 ? 's' : ''}.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

/**
 * Security headers component for meta tags
 * @param {Object} props - Component props
 * @returns {JSX.Element}
 */
export function SecurityHeaders({ 
  contentSecurityPolicy = "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; connect-src 'self' https://*.supabase.co https://*.netlify.app https://*.netlify.com http://localhost:* ws://localhost:*; img-src 'self' data: https:; font-src 'self' data:;",
  xContentTypeOptions = 'nosniff',
  referrerPolicy = 'strict-origin-when-cross-origin'
}) {
  return (
    <>
      <meta httpEquiv="Content-Security-Policy" content={contentSecurityPolicy} />
      <meta httpEquiv="X-Content-Type-Options" content={xContentTypeOptions} />
      <meta name="referrer-policy" content={referrerPolicy} />
    </>
  )
}
