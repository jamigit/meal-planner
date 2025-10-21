/**
 * @fileoverview Advanced form handling utilities
 * 
 * Provides comprehensive form management including dirty state tracking,
 * double submission prevention, auto-save drafts, and form validation.
 */

import React from 'react'

/**
 * Form handling configuration
 */
export const FORM_CONFIG = {
  // Auto-save configuration
  AUTO_SAVE_DELAY: 2000, // 2 seconds
  AUTO_SAVE_MAX_ATTEMPTS: 3,
  AUTO_SAVE_RETRY_DELAY: 1000, // 1 second
  
  // Draft storage
  DRAFT_STORAGE_KEY: 'form_drafts',
  DRAFT_EXPIRY: 7 * 24 * 60 * 60 * 1000, // 7 days
  
  // Submission protection
  SUBMISSION_COOLDOWN: 1000, // 1 second
  MAX_SUBMISSION_ATTEMPTS: 3,
  
  // Validation
  VALIDATION_DEBOUNCE: 300, // 300ms
  SHOW_VALIDATION_ON_BLUR: true,
  SHOW_VALIDATION_ON_CHANGE: false
}

/**
 * Form state manager
 */
export class FormStateManager {
  constructor() {
    this.forms = new Map()
    this.drafts = new Map()
    this.submissionLocks = new Map()
    this.listeners = new Set()
    
    this.loadDrafts()
  }

  /**
   * Registers a form
   * @param {string} formId - Unique form identifier
   * @param {Object} config - Form configuration
   */
  registerForm(formId, config) {
    const formState = {
      id: formId,
      initialData: { ...config.initialData },
      currentData: { ...config.initialData },
      isDirty: false,
      isValid: true,
      errors: {},
      isSubmitting: false,
      lastSaved: null,
      autoSaveEnabled: config.autoSave !== false,
      validationSchema: config.validationSchema,
      onSubmit: config.onSubmit,
      onAutoSave: config.onAutoSave,
      onDirtyChange: config.onDirtyChange,
      onValidationChange: config.onValidationChange,
      createdAt: Date.now()
    }

    this.forms.set(formId, formState)
    this.notify('form_registered', formState)
    
    return formState
  }

  /**
   * Updates form data
   * @param {string} formId - Form identifier
   * @param {string} field - Field name
   * @param {any} value - Field value
   */
  updateField(formId, field, value) {
    const form = this.forms.get(formId)
    if (!form) return

    const wasDirty = form.isDirty
    form.currentData[field] = value
    form.isDirty = this.isFormDirty(form)

    // Trigger validation if schema exists
    if (form.validationSchema) {
      this.validateForm(formId)
    }

    // Notify listeners
    this.notify('field_updated', { formId, field, value, isDirty: form.isDirty })

    // Trigger dirty change callback
    if (form.isDirty !== wasDirty && form.onDirtyChange) {
      form.onDirtyChange(form.isDirty)
    }

    // Auto-save if enabled
    if (form.autoSaveEnabled && form.isDirty) {
      this.scheduleAutoSave(formId)
    }
  }

  /**
   * Validates form data
   * @param {string} formId - Form identifier
   */
  validateForm(formId) {
    const form = this.forms.get(formId)
    if (!form || !form.validationSchema) return

    const errors = {}
    let isValid = true

    for (const [field, rules] of Object.entries(form.validationSchema)) {
      const value = form.currentData[field]
      const fieldErrors = this.validateField(value, rules, field)
      
      if (fieldErrors.length > 0) {
        errors[field] = fieldErrors
        isValid = false
      }
    }

    form.errors = errors
    form.isValid = isValid

    this.notify('validation_changed', { formId, errors, isValid })
    
    if (form.onValidationChange) {
      form.onValidationChange(errors, isValid)
    }
  }

  /**
   * Validates a single field
   * @param {any} value - Field value
   * @param {Object} rules - Validation rules
   * @param {string} fieldName - Field name
   * @returns {Array} Validation errors
   */
  validateField(value, rules, fieldName) {
    const errors = []

    // Required check
    if (rules.required && (value === null || value === undefined || value === '')) {
      errors.push(`${fieldName} is required`)
    }

    // Skip other validations if field is empty and not required
    if (!rules.required && (value === null || value === undefined || value === '')) {
      return errors
    }

    // Type-specific validation
    if (rules.type === 'email' && value) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(value)) {
        errors.push(`${fieldName} must be a valid email address`)
      }
    }

    if (rules.type === 'url' && value) {
      try {
        new URL(value)
      } catch {
        errors.push(`${fieldName} must be a valid URL`)
      }
    }

    // Length validation
    if (rules.minLength && String(value).length < rules.minLength) {
      errors.push(`${fieldName} must be at least ${rules.minLength} characters`)
    }

    if (rules.maxLength && String(value).length > rules.maxLength) {
      errors.push(`${fieldName} must be no more than ${rules.maxLength} characters`)
    }

    // Numeric validation
    if (rules.min !== undefined && Number(value) < rules.min) {
      errors.push(`${fieldName} must be at least ${rules.min}`)
    }

    if (rules.max !== undefined && Number(value) > rules.max) {
      errors.push(`${fieldName} must be no more than ${rules.max}`)
    }

    // Pattern validation
    if (rules.pattern && !rules.pattern.test(String(value))) {
      errors.push(`${fieldName} format is invalid`)
    }

    // Custom validation
    if (rules.custom && typeof rules.custom === 'function') {
      const customError = rules.custom(value)
      if (customError) {
        errors.push(customError)
      }
    }

    return errors
  }

  /**
   * Checks if form is dirty
   * @param {Object} form - Form state
   * @returns {boolean} Whether form is dirty
   */
  isFormDirty(form) {
    return JSON.stringify(form.currentData) !== JSON.stringify(form.initialData)
  }

  /**
   * Submits form
   * @param {string} formId - Form identifier
   * @returns {Promise} Submission result
   */
  async submitForm(formId) {
    const form = this.forms.get(formId)
    if (!form) throw new Error('Form not found')

    // Check submission lock
    if (this.submissionLocks.has(formId)) {
      throw new Error('Form is already being submitted')
    }

    // Validate form
    this.validateForm(formId)
    if (!form.isValid) {
      throw new Error('Form validation failed')
    }

    // Set submission lock
    this.submissionLocks.set(formId, Date.now())
    form.isSubmitting = true

    this.notify('submission_started', { formId })

    try {
      const result = await form.onSubmit(form.currentData)
      
      // Update initial data to current data (form is now clean)
      form.initialData = { ...form.currentData }
      form.isDirty = false
      form.lastSaved = Date.now()

      this.notify('submission_success', { formId, result })
      
      return result
    } catch (error) {
      this.notify('submission_failed', { formId, error })
      throw error
    } finally {
      form.isSubmitting = false
      this.submissionLocks.delete(formId)
    }
  }

  /**
   * Schedules auto-save
   * @param {string} formId - Form identifier
   */
  scheduleAutoSave(formId) {
    const form = this.forms.get(formId)
    if (!form || !form.autoSaveEnabled) return

    // Clear existing timeout
    if (form.autoSaveTimeout) {
      clearTimeout(form.autoSaveTimeout)
    }

    // Schedule new auto-save
    form.autoSaveTimeout = setTimeout(() => {
      this.performAutoSave(formId)
    }, FORM_CONFIG.AUTO_SAVE_DELAY)
  }

  /**
   * Performs auto-save
   * @param {string} formId - Form identifier
   */
  async performAutoSave(formId) {
    const form = this.forms.get(formId)
    if (!form || !form.autoSaveEnabled || !form.isDirty) return

    if (!form.onAutoSave) {
      // Save to local storage as draft
      this.saveDraft(formId, form.currentData)
      return
    }

    try {
      await form.onAutoSave(form.currentData)
      form.lastSaved = Date.now()
      this.notify('auto_save_success', { formId })
    } catch (error) {
      console.error('Auto-save failed:', error)
      this.notify('auto_save_failed', { formId, error })
      
      // Fallback to local storage
      this.saveDraft(formId, form.currentData)
    }
  }

  /**
   * Saves form draft
   * @param {string} formId - Form identifier
   * @param {Object} data - Form data
   */
  saveDraft(formId, data) {
    const draft = {
      formId,
      data,
      timestamp: Date.now(),
      expiry: Date.now() + FORM_CONFIG.DRAFT_EXPIRY
    }

    this.drafts.set(formId, draft)
    this.saveDraftsToStorage()
    
    this.notify('draft_saved', { formId, data })
  }

  /**
   * Loads form draft
   * @param {string} formId - Form identifier
   * @returns {Object|null} Draft data or null
   */
  loadDraft(formId) {
    const draft = this.drafts.get(formId)
    
    if (!draft || Date.now() > draft.expiry) {
      return null
    }

    return draft.data
  }

  /**
   * Clears form draft
   * @param {string} formId - Form identifier
   */
  clearDraft(formId) {
    this.drafts.delete(formId)
    this.saveDraftsToStorage()
    
    this.notify('draft_cleared', { formId })
  }

  /**
   * Loads drafts from storage
   */
  loadDrafts() {
    try {
      const stored = localStorage.getItem(FORM_CONFIG.DRAFT_STORAGE_KEY)
      if (stored) {
        const drafts = JSON.parse(stored)
        this.drafts = new Map(Object.entries(drafts))
      }
    } catch (error) {
      console.error('Failed to load drafts:', error)
    }
  }

  /**
   * Saves drafts to storage
   */
  saveDraftsToStorage() {
    try {
      const drafts = Object.fromEntries(this.drafts)
      localStorage.setItem(FORM_CONFIG.DRAFT_STORAGE_KEY, JSON.stringify(drafts))
    } catch (error) {
      console.error('Failed to save drafts:', error)
    }
  }

  /**
   * Resets form to initial state
   * @param {string} formId - Form identifier
   */
  resetForm(formId) {
    const form = this.forms.get(formId)
    if (!form) return

    form.currentData = { ...form.initialData }
    form.isDirty = false
    form.errors = {}
    form.isValid = true

    // Clear auto-save timeout
    if (form.autoSaveTimeout) {
      clearTimeout(form.autoSaveTimeout)
      form.autoSaveTimeout = null
    }

    this.notify('form_reset', { formId })
  }

  /**
   * Gets form state
   * @param {string} formId - Form identifier
   * @returns {Object|null} Form state or null
   */
  getFormState(formId) {
    return this.forms.get(formId) || null
  }

  /**
   * Registers a listener
   * @param {Function} listener - Event listener
   * @returns {Function} Unsubscribe function
   */
  subscribe(listener) {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }

  /**
   * Notifies all listeners
   * @param {string} event - Event type
   * @param {any} data - Event data
   */
  notify(event, data) {
    this.listeners.forEach(listener => {
      try {
        listener(event, data)
      } catch (error) {
        console.error('Error in form state listener:', error)
      }
    })
  }

  /**
   * Destroys form manager
   */
  destroy() {
    // Clear all timeouts
    this.forms.forEach(form => {
      if (form.autoSaveTimeout) {
        clearTimeout(form.autoSaveTimeout)
      }
    })

    this.forms.clear()
    this.drafts.clear()
    this.submissionLocks.clear()
    this.listeners.clear()
  }
}

// Global form state manager
export const formStateManager = new FormStateManager()

/**
 * React hook for form management
 * @param {string} formId - Form identifier
 * @param {Object} config - Form configuration
 * @returns {Object} Form utilities
 */
export function useForm(formId, config) {
  const [formState, setFormState] = React.useState(null)
  const [isSubmitting, setIsSubmitting] = React.useState(false)

  React.useEffect(() => {
    // Register form
    const state = formStateManager.registerForm(formId, config)
    setFormState(state)

    // Load draft if exists
    const draft = formStateManager.loadDraft(formId)
    if (draft) {
      Object.entries(draft).forEach(([field, value]) => {
        formStateManager.updateField(formId, field, value)
      })
    }

    // Subscribe to form changes
    const unsubscribe = formStateManager.subscribe((event, data) => {
      if (data.formId === formId) {
        const currentState = formStateManager.getFormState(formId)
        setFormState(currentState)

        if (event === 'submission_started') {
          setIsSubmitting(true)
        } else if (event === 'submission_success' || event === 'submission_failed') {
          setIsSubmitting(false)
        }
      }
    })

    return () => {
      unsubscribe()
      // Clear auto-save timeout
      const state = formStateManager.getFormState(formId)
      if (state?.autoSaveTimeout) {
        clearTimeout(state.autoSaveTimeout)
      }
    }
  }, [formId])

  const updateField = React.useCallback((field, value) => {
    formStateManager.updateField(formId, field, value)
  }, [formId])

  const submitForm = React.useCallback(async () => {
    return await formStateManager.submitForm(formId)
  }, [formId])

  const resetForm = React.useCallback(() => {
    formStateManager.resetForm(formId)
  }, [formId])

  const clearDraft = React.useCallback(() => {
    formStateManager.clearDraft(formId)
  }, [formId])

  return {
    formState,
    isSubmitting,
    updateField,
    submitForm,
    resetForm,
    clearDraft,
    isDirty: formState?.isDirty || false,
    isValid: formState?.isValid || true,
    errors: formState?.errors || {},
    data: formState?.currentData || {}
  }
}

/**
 * React hook for form field
 * @param {string} formId - Form identifier
 * @param {string} field - Field name
 * @param {Object} options - Field options
 * @returns {Object} Field utilities
 */
export function useFormField(formId, field, options = {}) {
  const [value, setValue] = React.useState('')
  const [errors, setErrors] = React.useState([])
  const [isTouched, setIsTouched] = React.useState(false)

  React.useEffect(() => {
    const unsubscribe = formStateManager.subscribe((event, data) => {
      if (data.formId === formId) {
        const formState = formStateManager.getFormState(formId)
        if (formState) {
          setValue(formState.currentData[field] || '')
          setErrors(formState.errors[field] || [])
        }
      }
    })

    return unsubscribe
  }, [formId, field])

  const handleChange = React.useCallback((newValue) => {
    setValue(newValue)
    formStateManager.updateField(formId, field, newValue)
  }, [formId, field])

  const handleBlur = React.useCallback(() => {
    setIsTouched(true)
    if (options.onBlur) {
      options.onBlur(value)
    }
  }, [value, options])

  const handleFocus = React.useCallback(() => {
    if (options.onFocus) {
      options.onFocus(value)
    }
  }, [value, options])

  return {
    value,
    errors,
    isTouched,
    handleChange,
    handleBlur,
    handleFocus,
    hasError: errors.length > 0,
    showError: isTouched && errors.length > 0
  }
}
