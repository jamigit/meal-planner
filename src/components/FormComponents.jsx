/**
 * @fileoverview Advanced form handling React components
 * 
 * Provides React components for comprehensive form management including
 * dirty state tracking, auto-save, draft management, and validation.
 */

import React from 'react'
import { useForm, useFormField, formStateManager } from '../utils/formHandling.js'

/**
 * Advanced form component with comprehensive state management
 * @param {Object} props - Component props
 * @returns {JSX.Element}
 */
export function AdvancedForm({ 
  formId,
  initialData = {},
  validationSchema = {},
  onSubmit,
  onAutoSave,
  onDirtyChange,
  onValidationChange,
  autoSave = true,
  showDirtyIndicator = true,
  showAutoSaveStatus = true,
  preventDoubleSubmit = true,
  className = '',
  children 
}) {
  const {
    formState,
    isSubmitting,
    updateField,
    submitForm,
    resetForm,
    clearDraft,
    isDirty,
    isValid,
    errors,
    data
  } = useForm(formId, {
    initialData,
    validationSchema,
    onSubmit,
    onAutoSave,
    onDirtyChange,
    onValidationChange,
    autoSave
  })

  const handleSubmit = React.useCallback(async (e) => {
    e.preventDefault()
    
    if (preventDoubleSubmit && isSubmitting) {
      return
    }

    try {
      await submitForm()
    } catch (error) {
      console.error('Form submission failed:', error)
    }
  }, [submitForm, isSubmitting, preventDoubleSubmit])

  const handleReset = React.useCallback(() => {
    if (window.confirm('Are you sure you want to reset the form? All changes will be lost.')) {
      resetForm()
    }
  }, [resetForm])

  return (
    <div className={`advanced-form ${className}`}>
      {showDirtyIndicator && isDirty && (
        <div className="mb-4 p-2 bg-yellow-50 border border-yellow-200 rounded text-sm text-yellow-800">
          <div className="flex items-center space-x-2">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <span>You have unsaved changes</span>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {children}
        
        <div className="flex items-center justify-between pt-4 border-t">
          <div className="flex items-center space-x-4">
            <button
              type="submit"
              disabled={!isValid || isSubmitting}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Saving...' : 'Save'}
            </button>
            
            {isDirty && (
              <button
                type="button"
                onClick={handleReset}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
              >
                Reset
              </button>
            )}
          </div>

          {showAutoSaveStatus && autoSave && (
            <AutoSaveStatus formId={formId} />
          )}
        </div>
      </form>
    </div>
  )
}

/**
 * Form field component with validation and error handling
 * @param {Object} props - Component props
 * @returns {JSX.Element}
 */
export function FormField({ 
  formId,
  name,
  label,
  type = 'text',
  placeholder,
  required = false,
  validation = {},
  className = '',
  ...props 
}) {
  const {
    value,
    errors,
    isTouched,
    handleChange,
    handleBlur,
    handleFocus,
    hasError,
    showError
  } = useFormField(formId, name, {
    onBlur: validation.onBlur,
    onFocus: validation.onFocus
  })

  const fieldId = `${formId}_${name}`

  return (
    <div className={`form-field ${className}`}>
      {label && (
        <label htmlFor={fieldId} className="block text-sm font-medium text-gray-700 mb-1">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      
      <input
        id={fieldId}
        type={type}
        value={value}
        onChange={(e) => handleChange(e.target.value)}
        onBlur={handleBlur}
        onFocus={handleFocus}
        placeholder={placeholder}
        className={`block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm ${
          hasError ? 'border-red-500' : ''
        }`}
        {...props}
      />
      
      {showError && (
        <div className="mt-1 text-sm text-red-600">
          {errors.map((error, index) => (
            <div key={index}>{error}</div>
          ))}
        </div>
      )}
    </div>
  )
}

/**
 * Form textarea component
 * @param {Object} props - Component props
 * @returns {JSX.Element}
 */
export function FormTextarea({ 
  formId,
  name,
  label,
  placeholder,
  rows = 3,
  required = false,
  validation = {},
  className = '',
  ...props 
}) {
  const {
    value,
    errors,
    isTouched,
    handleChange,
    handleBlur,
    handleFocus,
    hasError,
    showError
  } = useFormField(formId, name, {
    onBlur: validation.onBlur,
    onFocus: validation.onFocus
  })

  const fieldId = `${formId}_${name}`

  return (
    <div className={`form-field ${className}`}>
      {label && (
        <label htmlFor={fieldId} className="block text-sm font-medium text-gray-700 mb-1">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      
      <textarea
        id={fieldId}
        value={value}
        onChange={(e) => handleChange(e.target.value)}
        onBlur={handleBlur}
        onFocus={handleFocus}
        placeholder={placeholder}
        rows={rows}
        className={`block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm ${
          hasError ? 'border-red-500' : ''
        }`}
        {...props}
      />
      
      {showError && (
        <div className="mt-1 text-sm text-red-600">
          {errors.map((error, index) => (
            <div key={index}>{error}</div>
          ))}
        </div>
      )}
    </div>
  )
}

/**
 * Form select component
 * @param {Object} props - Component props
 * @returns {JSX.Element}
 */
export function FormSelect({ 
  formId,
  name,
  label,
  options = [],
  placeholder = 'Select an option',
  required = false,
  validation = {},
  className = '',
  ...props 
}) {
  const {
    value,
    errors,
    isTouched,
    handleChange,
    handleBlur,
    handleFocus,
    hasError,
    showError
  } = useFormField(formId, name, {
    onBlur: validation.onBlur,
    onFocus: validation.onFocus
  })

  const fieldId = `${formId}_${name}`

  return (
    <div className={`form-field ${className}`}>
      {label && (
        <label htmlFor={fieldId} className="block text-sm font-medium text-gray-700 mb-1">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      
      <select
        id={fieldId}
        value={value}
        onChange={(e) => handleChange(e.target.value)}
        onBlur={handleBlur}
        onFocus={handleFocus}
        className={`block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm ${
          hasError ? 'border-red-500' : ''
        }`}
        {...props}
      >
        <option value="">{placeholder}</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      
      {showError && (
        <div className="mt-1 text-sm text-red-600">
          {errors.map((error, index) => (
            <div key={index}>{error}</div>
          ))}
        </div>
      )}
    </div>
  )
}

/**
 * Auto-save status component
 * @param {Object} props - Component props
 * @returns {JSX.Element}
 */
export function AutoSaveStatus({ formId, className = '' }) {
  const [status, setStatus] = React.useState('idle') // 'idle', 'saving', 'saved', 'error'
  const [lastSaved, setLastSaved] = React.useState(null)

  React.useEffect(() => {
    const unsubscribe = formStateManager.subscribe((event, data) => {
      if (data.formId === formId) {
        switch (event) {
          case 'auto_save_success':
            setStatus('saved')
            setLastSaved(new Date())
            setTimeout(() => setStatus('idle'), 2000)
            break
          case 'auto_save_failed':
            setStatus('error')
            setTimeout(() => setStatus('idle'), 3000)
            break
          case 'field_updated':
            if (data.isDirty) {
              setStatus('saving')
            }
            break
        }
      }
    })

    return unsubscribe
  }, [formId])

  if (status === 'idle') {
    return null
  }

  const getStatusText = () => {
    switch (status) {
      case 'saving':
        return 'Saving...'
      case 'saved':
        return 'Saved'
      case 'error':
        return 'Save failed'
      default:
        return ''
    }
  }

  const getStatusColor = () => {
    switch (status) {
      case 'saving':
        return 'text-blue-600'
      case 'saved':
        return 'text-green-600'
      case 'error':
        return 'text-red-600'
      default:
        return 'text-gray-600'
    }
  }

  return (
    <div className={`auto-save-status flex items-center space-x-2 text-sm ${getStatusColor()} ${className}`}>
      {status === 'saving' && (
        <div className="animate-spin rounded-full h-3 w-3 border-2 border-current border-t-transparent" />
      )}
      {status === 'saved' && (
        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
        </svg>
      )}
      {status === 'error' && (
        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
        </svg>
      )}
      <span>{getStatusText()}</span>
      {lastSaved && status === 'saved' && (
        <span className="text-xs opacity-75">
          ({lastSaved.toLocaleTimeString()})
        </span>
      )}
    </div>
  )
}

/**
 * Draft management component
 * @param {Object} props - Component props
 * @returns {JSX.Element}
 */
export function DraftManager({ formId, className = '' }) {
  const [hasDraft, setHasDraft] = React.useState(false)
  const [draftData, setDraftData] = React.useState(null)

  React.useEffect(() => {
    const unsubscribe = formStateManager.subscribe((event, data) => {
      if (data.formId === formId) {
        switch (event) {
          case 'draft_saved':
            setHasDraft(true)
            setDraftData(data.data)
            break
          case 'draft_cleared':
            setHasDraft(false)
            setDraftData(null)
            break
        }
      }
    })

    // Check for existing draft
    const draft = formStateManager.loadDraft(formId)
    if (draft) {
      setHasDraft(true)
      setDraftData(draft)
    }

    return unsubscribe
  }, [formId])

  const handleLoadDraft = () => {
    if (draftData) {
      Object.entries(draftData).forEach(([field, value]) => {
        formStateManager.updateField(formId, field, value)
      })
    }
  }

  const handleClearDraft = () => {
    if (window.confirm('Are you sure you want to clear the saved draft?')) {
      formStateManager.clearDraft(formId)
    }
  }

  if (!hasDraft) {
    return null
  }

  return (
    <div className={`draft-manager p-3 bg-blue-50 border border-blue-200 rounded ${className}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <svg className="w-4 h-4 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
          </svg>
          <span className="text-sm text-blue-800">Draft saved</span>
        </div>
        
        <div className="flex items-center space-x-2">
          <button
            onClick={handleLoadDraft}
            className="text-xs text-blue-600 hover:text-blue-800 font-medium"
          >
            Load Draft
          </button>
          <button
            onClick={handleClearDraft}
            className="text-xs text-gray-500 hover:text-gray-700"
          >
            Clear
          </button>
        </div>
      </div>
    </div>
  )
}

/**
 * Form validation summary component
 * @param {Object} props - Component props
 * @returns {JSX.Element}
 */
export function FormValidationSummary({ formId, className = '' }) {
  const [errors, setErrors] = React.useState({})

  React.useEffect(() => {
    const unsubscribe = formStateManager.subscribe((event, data) => {
      if (data.formId === formId && event === 'validation_changed') {
        setErrors(data.errors)
      }
    })

    return unsubscribe
  }, [formId])

  const errorCount = Object.values(errors).flat().length

  if (errorCount === 0) {
    return null
  }

  return (
    <div className={`validation-summary p-3 bg-red-50 border border-red-200 rounded ${className}`}>
      <div className="flex items-center space-x-2 mb-2">
        <svg className="w-4 h-4 text-red-600" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
        </svg>
        <span className="text-sm font-medium text-red-800">
          {errorCount} validation error{errorCount !== 1 ? 's' : ''}
        </span>
      </div>
      
      <ul className="text-sm text-red-700 space-y-1">
        {Object.entries(errors).map(([field, fieldErrors]) =>
          fieldErrors.map((error, index) => (
            <li key={`${field}-${index}`} className="flex items-start space-x-2">
              <span className="text-red-500">•</span>
              <span>{error}</span>
            </li>
          ))
        )}
      </ul>
    </div>
  )
}

/**
 * Form provider component
 * @param {Object} props - Component props
 * @returns {JSX.Element}
 */
export function FormProvider({ children, className = '' }) {
  return (
    <div className={`form-provider ${className}`}>
      {children}
    </div>
  )
}
