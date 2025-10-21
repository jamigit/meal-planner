/**
 * @fileoverview Accessibility utilities for screen reader support, keyboard navigation, and semantic HTML
 * 
 * Provides comprehensive accessibility features including ARIA attributes,
 * keyboard navigation, focus management, and screen reader support.
 */

import React from 'react'

/**
 * Accessibility configuration
 */
export const A11Y_CONFIG = {
  // Focus management
  FOCUS_VISIBLE_CLASS: 'focus-visible',
  FOCUS_RING_CLASS: 'focus-ring',
  SKIP_LINK_CLASS: 'skip-link',
  
  // Screen reader
  SCREEN_READER_ONLY_CLASS: 'sr-only',
  SCREEN_READER_ANNOUNCE_CLASS: 'sr-announce',
  
  // Keyboard navigation
  TAB_INDEX_FOCUSABLE: 0,
  TAB_INDEX_NOT_FOCUSABLE: -1,
  
  // ARIA live regions
  LIVE_REGION_POLITE: 'polite',
  LIVE_REGION_ASSERTIVE: 'assertive',
  
  // Animation preferences
  REDUCE_MOTION_CLASS: 'reduce-motion',
  
  // High contrast
  HIGH_CONTRAST_CLASS: 'high-contrast'
}

/**
 * Accessibility utilities
 */
export class AccessibilityUtils {
  /**
   * Generates unique ID for accessibility
   * @param {string} prefix - ID prefix
   * @returns {string} Unique ID
   */
  static generateId(prefix = 'a11y') {
    return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  /**
   * Checks if user prefers reduced motion
   * @returns {boolean} Whether user prefers reduced motion
   */
  static prefersReducedMotion() {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches
  }

  /**
   * Checks if user prefers high contrast
   * @returns {boolean} Whether user prefers high contrast
   */
  static prefersHighContrast() {
    return window.matchMedia('(prefers-contrast: high)').matches
  }

  /**
   * Checks if user prefers dark color scheme
   * @returns {boolean} Whether user prefers dark color scheme
   */
  static prefersDarkColorScheme() {
    return window.matchMedia('(prefers-color-scheme: dark)').matches
  }

  /**
   * Gets accessible name for element
   * @param {HTMLElement} element - DOM element
   * @returns {string} Accessible name
   */
  static getAccessibleName(element) {
    // Check aria-label first
    if (element.getAttribute('aria-label')) {
      return element.getAttribute('aria-label')
    }

    // Check aria-labelledby
    const labelledBy = element.getAttribute('aria-labelledby')
    if (labelledBy) {
      const labelElement = document.getElementById(labelledBy)
      if (labelElement) {
        return labelElement.textContent || labelElement.innerText
      }
    }

    // Check associated label
    const id = element.getAttribute('id')
    if (id) {
      const label = document.querySelector(`label[for="${id}"]`)
      if (label) {
        return label.textContent || label.innerText
      }
    }

    // Check title attribute
    if (element.getAttribute('title')) {
      return element.getAttribute('title')
    }

    // Check alt text for images
    if (element.tagName === 'IMG' && element.getAttribute('alt')) {
      return element.getAttribute('alt')
    }

    // Fall back to text content
    return element.textContent || element.innerText || ''
  }

  /**
   * Gets accessible description for element
   * @param {HTMLElement} element - DOM element
   * @returns {string} Accessible description
   */
  static getAccessibleDescription(element) {
    // Check aria-describedby
    const describedBy = element.getAttribute('aria-describedby')
    if (describedBy) {
      const descElement = document.getElementById(describedBy)
      if (descElement) {
        return descElement.textContent || descElement.innerText
      }
    }

    return ''
  }

  /**
   * Checks if element is focusable
   * @param {HTMLElement} element - DOM element
   * @returns {boolean} Whether element is focusable
   */
  static isFocusable(element) {
    if (!element || element.disabled) return false

    const tabIndex = element.getAttribute('tabindex')
    if (tabIndex !== null) {
      return parseInt(tabIndex, 10) >= 0
    }

    const focusableTags = ['A', 'BUTTON', 'INPUT', 'SELECT', 'TEXTAREA', 'IFRAME']
    if (focusableTags.includes(element.tagName)) {
      return true
    }

    return false
  }

  /**
   * Gets next focusable element
   * @param {HTMLElement} currentElement - Current focused element
   * @param {string} direction - Focus direction ('next' or 'previous')
   * @returns {HTMLElement|null} Next focusable element
   */
  static getNextFocusableElement(currentElement, direction = 'next') {
    const focusableElements = Array.from(
      document.querySelectorAll('a, button, input, select, textarea, [tabindex]:not([tabindex="-1"])')
    ).filter(el => this.isFocusable(el))

    const currentIndex = focusableElements.indexOf(currentElement)
    
    if (direction === 'next') {
      return focusableElements[currentIndex + 1] || focusableElements[0]
    } else {
      return focusableElements[currentIndex - 1] || focusableElements[focusableElements.length - 1]
    }
  }

  /**
   * Traps focus within container
   * @param {HTMLElement} container - Container element
   * @param {HTMLElement} firstFocusable - First focusable element
   * @param {HTMLElement} lastFocusable - Last focusable element
   */
  static trapFocus(container, firstFocusable, lastFocusable) {
    const handleKeyDown = (e) => {
      if (e.key === 'Tab') {
        if (e.shiftKey) {
          // Shift + Tab
          if (document.activeElement === firstFocusable) {
            e.preventDefault()
            lastFocusable.focus()
          }
        } else {
          // Tab
          if (document.activeElement === lastFocusable) {
            e.preventDefault()
            firstFocusable.focus()
          }
        }
      }
    }

    container.addEventListener('keydown', handleKeyDown)
    
    return () => {
      container.removeEventListener('keydown', handleKeyDown)
    }
  }

  /**
   * Announces message to screen readers
   * @param {string} message - Message to announce
   * @param {string} priority - Priority level ('polite' or 'assertive')
   */
  static announceToScreenReader(message, priority = 'polite') {
    const announcement = document.createElement('div')
    announcement.setAttribute('aria-live', priority)
    announcement.setAttribute('aria-atomic', 'true')
    announcement.className = A11Y_CONFIG.SCREEN_READER_ANNOUNCE_CLASS
    announcement.textContent = message

    document.body.appendChild(announcement)

    // Remove after announcement
    setTimeout(() => {
      document.body.removeChild(announcement)
    }, 1000)
  }

  /**
   * Gets ARIA attributes for common patterns
   * @param {string} pattern - ARIA pattern name
   * @param {Object} options - Pattern options
   * @returns {Object} ARIA attributes
   */
  static getAriaAttributes(pattern, options = {}) {
    const baseAttributes = {
      'aria-label': options.label,
      'aria-labelledby': options.labelledBy,
      'aria-describedby': options.describedBy,
      'aria-hidden': options.hidden ? 'true' : undefined,
      'aria-disabled': options.disabled ? 'true' : undefined,
      'aria-expanded': options.expanded,
      'aria-selected': options.selected,
      'aria-checked': options.checked,
      'aria-pressed': options.pressed,
      'aria-current': options.current,
      'aria-live': options.live,
      'aria-atomic': options.atomic ? 'true' : undefined,
      'aria-busy': options.busy ? 'true' : undefined,
      'aria-invalid': options.invalid ? 'true' : undefined,
      'aria-required': options.required ? 'true' : undefined,
      'aria-readonly': options.readonly ? 'true' : undefined,
      'aria-multiselectable': options.multiselectable ? 'true' : undefined,
      'aria-orientation': options.orientation,
      'aria-sort': options.sort,
      'aria-level': options.level,
      'aria-setsize': options.setsize,
      'aria-posinset': options.posinset,
      'aria-activedescendant': options.activedescendant,
      'aria-controls': options.controls,
      'aria-owns': options.owns,
      'aria-flowto': options.flowto,
      'aria-flowfrom': options.flowfrom
    }

    // Remove undefined values
    return Object.fromEntries(
      Object.entries(baseAttributes).filter(([_, value]) => value !== undefined)
    )
  }

  /**
   * Gets keyboard event handlers
   * @param {Object} handlers - Event handlers
   * @returns {Object} Keyboard event handlers
   */
  static getKeyboardHandlers(handlers = {}) {
    return {
      onKeyDown: (e) => {
        // Handle common keyboard patterns
        switch (e.key) {
          case 'Enter':
          case ' ':
            if (handlers.onActivate) {
              e.preventDefault()
              handlers.onActivate(e)
            }
            break
          case 'Escape':
            if (handlers.onEscape) {
              e.preventDefault()
              handlers.onEscape(e)
            }
            break
          case 'ArrowUp':
            if (handlers.onArrowUp) {
              e.preventDefault()
              handlers.onArrowUp(e)
            }
            break
          case 'ArrowDown':
            if (handlers.onArrowDown) {
              e.preventDefault()
              handlers.onArrowDown(e)
            }
            break
          case 'ArrowLeft':
            if (handlers.onArrowLeft) {
              e.preventDefault()
              handlers.onArrowLeft(e)
            }
            break
          case 'ArrowRight':
            if (handlers.onArrowRight) {
              e.preventDefault()
              handlers.onArrowRight(e)
            }
            break
          case 'Home':
            if (handlers.onHome) {
              e.preventDefault()
              handlers.onHome(e)
            }
            break
          case 'End':
            if (handlers.onEnd) {
              e.preventDefault()
              handlers.onEnd(e)
            }
            break
        }

        // Call custom handler if provided
        if (handlers.onKeyDown) {
          handlers.onKeyDown(e)
        }
      }
    }
  }

  /**
   * Validates accessibility of element
   * @param {HTMLElement} element - DOM element
   * @returns {Array} Accessibility issues
   */
  static validateAccessibility(element) {
    const issues = []

    // Check for missing alt text on images
    if (element.tagName === 'IMG' && !element.getAttribute('alt')) {
      issues.push('Image missing alt text')
    }

    // Check for missing labels on form controls
    const formControls = ['INPUT', 'SELECT', 'TEXTAREA']
    if (formControls.includes(element.tagName)) {
      const id = element.getAttribute('id')
      const ariaLabel = element.getAttribute('aria-label')
      const ariaLabelledBy = element.getAttribute('aria-labelledby')
      
      if (!id && !ariaLabel && !ariaLabelledBy) {
        const label = document.querySelector(`label[for="${id}"]`)
        if (!label) {
          issues.push('Form control missing label')
        }
      }
    }

    // Check for missing heading hierarchy
    if (element.tagName.match(/^H[1-6]$/)) {
      const level = parseInt(element.tagName.charAt(1))
      const previousHeading = element.previousElementSibling
      if (previousHeading && previousHeading.tagName.match(/^H[1-6]$/)) {
        const prevLevel = parseInt(previousHeading.tagName.charAt(1))
        if (level > prevLevel + 1) {
          issues.push('Heading level skipped')
        }
      }
    }

    // Check for missing focus indicators
    if (this.isFocusable(element)) {
      const computedStyle = window.getComputedStyle(element)
      const outline = computedStyle.outline
      const boxShadow = computedStyle.boxShadow
      
      if (outline === 'none' && !boxShadow.includes('inset')) {
        issues.push('Focusable element missing focus indicator')
      }
    }

    return issues
  }
}

/**
 * React hook for accessibility features
 * @param {Object} options - Accessibility options
 * @returns {Object} Accessibility utilities
 */
export function useAccessibility(options = {}) {
  const [prefersReducedMotion, setPrefersReducedMotion] = React.useState(
    AccessibilityUtils.prefersReducedMotion()
  )
  const [prefersHighContrast, setPrefersHighContrast] = React.useState(
    AccessibilityUtils.prefersHighContrast()
  )
  const [prefersDarkColorScheme, setPrefersDarkColorScheme] = React.useState(
    AccessibilityUtils.prefersDarkColorScheme()
  )

  React.useEffect(() => {
    // Listen for preference changes
    const reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    const highContrastQuery = window.matchMedia('(prefers-contrast: high)')
    const darkColorSchemeQuery = window.matchMedia('(prefers-color-scheme: dark)')

    const handleReducedMotionChange = (e) => setPrefersReducedMotion(e.matches)
    const handleHighContrastChange = (e) => setPrefersHighContrast(e.matches)
    const handleDarkColorSchemeChange = (e) => setPrefersDarkColorScheme(e.matches)

    reducedMotionQuery.addEventListener('change', handleReducedMotionChange)
    highContrastQuery.addEventListener('change', handleHighContrastChange)
    darkColorSchemeQuery.addEventListener('change', handleDarkColorSchemeChange)

    return () => {
      reducedMotionQuery.removeEventListener('change', handleReducedMotionChange)
      highContrastQuery.removeEventListener('change', handleHighContrastChange)
      darkColorSchemeQuery.removeEventListener('change', handleDarkColorSchemeChange)
    }
  }, [])

  const announce = React.useCallback((message, priority = 'polite') => {
    AccessibilityUtils.announceToScreenReader(message, priority)
  }, [])

  const generateId = React.useCallback((prefix) => {
    return AccessibilityUtils.generateId(prefix)
  }, [])

  const getAriaAttributes = React.useCallback((pattern, options) => {
    return AccessibilityUtils.getAriaAttributes(pattern, options)
  }, [])

  const getKeyboardHandlers = React.useCallback((handlers) => {
    return AccessibilityUtils.getKeyboardHandlers(handlers)
  }, [])

  return {
    prefersReducedMotion,
    prefersHighContrast,
    prefersDarkColorScheme,
    announce,
    generateId,
    getAriaAttributes,
    getKeyboardHandlers
  }
}

/**
 * React hook for focus management
 * @param {Object} options - Focus management options
 * @returns {Object} Focus management utilities
 */
export function useFocusManagement(options = {}) {
  const [focusedElement, setFocusedElement] = React.useState(null)
  const [focusHistory, setFocusHistory] = React.useState([])

  const focusElement = React.useCallback((element) => {
    if (element && typeof element.focus === 'function') {
      element.focus()
      setFocusedElement(element)
      
      // Add to focus history
      setFocusHistory(prev => [...prev.slice(-9), element]) // Keep last 10 elements
    }
  }, [])

  const focusPrevious = React.useCallback(() => {
    if (focusHistory.length > 1) {
      const previousElement = focusHistory[focusHistory.length - 2]
      focusElement(previousElement)
    }
  }, [focusHistory, focusElement])

  const trapFocus = React.useCallback((container) => {
    const focusableElements = Array.from(
      container.querySelectorAll('a, button, input, select, textarea, [tabindex]:not([tabindex="-1"])')
    ).filter(el => AccessibilityUtils.isFocusable(el))

    if (focusableElements.length === 0) return

    const firstElement = focusableElements[0]
    const lastElement = focusableElements[focusableElements.length - 1]

    return AccessibilityUtils.trapFocus(container, firstElement, lastElement)
  }, [])

  const restoreFocus = React.useCallback(() => {
    if (focusedElement && typeof focusedElement.focus === 'function') {
      focusedElement.focus()
    }
  }, [focusedElement])

  return {
    focusedElement,
    focusElement,
    focusPrevious,
    trapFocus,
    restoreFocus
  }
}

/**
 * React hook for ARIA live regions
 * @param {Object} options - Live region options
 * @returns {Object} Live region utilities
 */
export function useAriaLiveRegion(options = {}) {
  const [messages, setMessages] = React.useState([])
  const regionRef = React.useRef(null)

  const announce = React.useCallback((message, priority = 'polite') => {
    const id = AccessibilityUtils.generateId('live-region')
    const newMessage = { id, message, priority, timestamp: Date.now() }
    
    setMessages(prev => [...prev, newMessage])

    // Remove message after announcement
    setTimeout(() => {
      setMessages(prev => prev.filter(msg => msg.id !== id))
    }, 1000)
  }, [])

  React.useEffect(() => {
    if (regionRef.current) {
      regionRef.current.innerHTML = messages.map(msg => 
        `<div aria-live="${msg.priority}" aria-atomic="true">${msg.message}</div>`
      ).join('')
    }
  }, [messages])

  return {
    announce,
    regionRef
  }
}
