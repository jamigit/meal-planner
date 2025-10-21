/**
 * @fileoverview Accessibility-focused React components
 * 
 * Provides React components with built-in accessibility features including
 * ARIA attributes, keyboard navigation, focus management, and screen reader support.
 */

import React from 'react'
import { 
  useAccessibility, 
  useFocusManagement, 
  useAriaLiveRegion,
  AccessibilityUtils,
  A11Y_CONFIG 
} from '../utils/accessibility.js'

/**
 * Skip link component for keyboard navigation
 * @param {Object} props - Component props
 * @returns {JSX.Element}
 */
export function SkipLink({ 
  href = '#main-content',
  children = 'Skip to main content',
  className = '',
  ...props 
}) {
  return (
    <a
      href={href}
      className={`${A11Y_CONFIG.SKIP_LINK_CLASS} ${className}`}
      {...props}
    >
      {children}
    </a>
  )
}

/**
 * Screen reader only text component
 * @param {Object} props - Component props
 * @returns {JSX.Element}
 */
export function ScreenReaderOnly({ 
  children, 
  className = '',
  ...props 
}) {
  return (
    <span className={`${A11Y_CONFIG.SCREEN_READER_ONLY_CLASS} ${className}`} {...props}>
      {children}
    </span>
  )
}

/**
 * Accessible button component
 * @param {Object} props - Component props
 * @returns {JSX.Element}
 */
export function AccessibleButton({ 
  children,
  onClick,
  disabled = false,
  pressed = false,
  expanded = false,
  controls = null,
  describedBy = null,
  label = null,
  className = '',
  ...props 
}) {
  const { getAriaAttributes, getKeyboardHandlers } = useAccessibility()

  const ariaAttributes = getAriaAttributes('button', {
    label,
    describedBy,
    disabled,
    pressed: pressed ? 'true' : undefined,
    expanded: expanded ? 'true' : undefined,
    controls
  })

  const keyboardHandlers = getKeyboardHandlers({
    onActivate: onClick
  })

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`${A11Y_CONFIG.FOCUS_RING_CLASS} ${className}`}
      {...ariaAttributes}
      {...keyboardHandlers}
      {...props}
    >
      {children}
    </button>
  )
}

/**
 * Accessible input component
 * @param {Object} props - Component props
 * @returns {JSX.Element}
 */
export function AccessibleInput({ 
  label,
  error,
  helpText,
  required = false,
  invalid = false,
  describedBy = null,
  className = '',
  ...props 
}) {
  const { generateId } = useAccessibility()
  const [inputId] = React.useState(() => generateId('input'))
  const [errorId] = React.useState(() => generateId('error'))
  const [helpId] = React.useState(() => generateId('help'))

  const describedByIds = [describedBy, error ? errorId : null, helpText ? helpId : null]
    .filter(Boolean)
    .join(' ')

  return (
    <div className={`accessible-input ${className}`}>
      <label htmlFor={inputId} className="block text-sm font-medium text-gray-700 mb-1">
        {label}
        {required && <span className="text-red-500 ml-1" aria-label="required">*</span>}
      </label>
      
      <input
        id={inputId}
        aria-describedby={describedByIds || undefined}
        aria-invalid={invalid ? 'true' : undefined}
        aria-required={required ? 'true' : undefined}
        className={`block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm ${A11Y_CONFIG.FOCUS_RING_CLASS} ${
          invalid ? 'border-red-500' : ''
        }`}
        {...props}
      />
      
      {error && (
        <div id={errorId} className="mt-1 text-sm text-red-600" role="alert">
          {error}
        </div>
      )}
      
      {helpText && (
        <div id={helpId} className="mt-1 text-sm text-gray-600">
          {helpText}
        </div>
      )}
    </div>
  )
}

/**
 * Accessible modal component
 * @param {Object} props - Component props
 * @returns {JSX.Element}
 */
export function AccessibleModal({ 
  isOpen,
  onClose,
  title,
  children,
  className = '',
  ...props 
}) {
  const { generateId } = useAccessibility()
  const { trapFocus, restoreFocus } = useFocusManagement()
  const { announce } = useAriaLiveRegion()
  
  const [modalId] = React.useState(() => generateId('modal'))
  const [titleId] = React.useState(() => generateId('modal-title'))
  const modalRef = React.useRef(null)
  const previousActiveElement = React.useRef(null)

  React.useEffect(() => {
    if (isOpen) {
      // Store currently focused element
      previousActiveElement.current = document.activeElement
      
      // Focus modal
      if (modalRef.current) {
        modalRef.current.focus()
      }
      
      // Announce modal opening
      announce(`Modal opened: ${title}`, 'assertive')
      
      // Trap focus
      const cleanup = trapFocus(modalRef.current)
      
      return cleanup
    } else {
      // Restore focus when modal closes
      if (previousActiveElement.current) {
        previousActiveElement.current.focus()
      }
      
      // Announce modal closing
      announce('Modal closed', 'polite')
    }
  }, [isOpen, title, trapFocus, restoreFocus, announce])

  React.useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose()
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleEscape)
      document.body.style.overflow = 'hidden'
    }

    return () => {
      document.removeEventListener('keydown', handleEscape)
      document.body.style.overflow = ''
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto"
      aria-modal="true"
      aria-labelledby={titleId}
      role="dialog"
    >
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        {/* Backdrop */}
        <div 
          className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
          aria-hidden="true"
          onClick={onClose}
        />
        
        {/* Modal */}
        <div
          ref={modalRef}
          tabIndex={-1}
          className={`inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full ${className}`}
          {...props}
        >
          <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <div className="sm:flex sm:items-start">
              <div className="mt-3 text-center sm:mt-0 sm:text-left w-full">
                <h3 id={titleId} className="text-lg leading-6 font-medium text-gray-900 mb-4">
                  {title}
                </h3>
                {children}
              </div>
            </div>
          </div>
          
          <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
            <button
              type="button"
              className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm"
              onClick={onClose}
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

/**
 * Accessible dropdown component
 * @param {Object} props - Component props
 * @returns {JSX.Element}
 */
export function AccessibleDropdown({ 
  label,
  options = [],
  value,
  onChange,
  placeholder = 'Select an option',
  disabled = false,
  required = false,
  className = '',
  ...props 
}) {
  const { generateId } = useAccessibility()
  const { getKeyboardHandlers } = useAccessibility()
  const [isOpen, setIsOpen] = React.useState(false)
  const [focusedIndex, setFocusedIndex] = React.useState(-1)
  
  const [buttonId] = React.useState(() => generateId('dropdown-button'))
  const [listId] = React.useState(() => generateId('dropdown-list'))
  const buttonRef = React.useRef(null)
  const listRef = React.useRef(null)

  const selectedOption = options.find(option => option.value === value)

  const keyboardHandlers = getKeyboardHandlers({
    onActivate: () => setIsOpen(!isOpen),
    onEscape: () => setIsOpen(false),
    onArrowDown: () => {
      if (!isOpen) {
        setIsOpen(true)
      } else {
        setFocusedIndex(prev => Math.min(prev + 1, options.length - 1))
      }
    },
    onArrowUp: () => {
      if (!isOpen) {
        setIsOpen(true)
      } else {
        setFocusedIndex(prev => Math.max(prev - 1, 0))
      }
    },
    onHome: () => setFocusedIndex(0),
    onEnd: () => setFocusedIndex(options.length - 1)
  })

  React.useEffect(() => {
    if (isOpen && listRef.current) {
      const focusedElement = listRef.current.querySelector(`[data-index="${focusedIndex}"]`)
      if (focusedElement) {
        focusedElement.focus()
      }
    }
  }, [isOpen, focusedIndex])

  React.useEffect(() => {
    const handleClickOutside = (e) => {
      if (buttonRef.current && !buttonRef.current.contains(e.target)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('click', handleClickOutside)
    }

    return () => {
      document.removeEventListener('click', handleClickOutside)
    }
  }, [isOpen])

  const handleOptionSelect = (option) => {
    onChange(option.value)
    setIsOpen(false)
    setFocusedIndex(-1)
    buttonRef.current?.focus()
  }

  return (
    <div className={`accessible-dropdown ${className}`}>
      <label htmlFor={buttonId} className="block text-sm font-medium text-gray-700 mb-1">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      
      <div className="relative">
        <button
          ref={buttonRef}
          id={buttonId}
          type="button"
          aria-haspopup="listbox"
          aria-expanded={isOpen}
          aria-labelledby={`${buttonId}-label`}
          aria-activedescendant={focusedIndex >= 0 ? `${listId}-option-${focusedIndex}` : undefined}
          disabled={disabled}
          className={`relative w-full bg-white border border-gray-300 rounded-md shadow-sm pl-3 pr-10 py-2 text-left cursor-default focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${
            disabled ? 'bg-gray-50 text-gray-500' : ''
          }`}
          {...keyboardHandlers}
          {...props}
        >
          <span className="block truncate">
            {selectedOption ? selectedOption.label : placeholder}
          </span>
          <span className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
            <svg className="h-5 w-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </span>
        </button>

        {isOpen && (
          <ul
            ref={listRef}
            id={listId}
            role="listbox"
            aria-labelledby={buttonId}
            className="absolute z-10 mt-1 w-full bg-white shadow-lg max-h-60 rounded-md py-1 text-base ring-1 ring-black ring-opacity-5 overflow-auto focus:outline-none sm:text-sm"
          >
            {options.map((option, index) => (
              <li
                key={option.value}
                data-index={index}
                role="option"
                aria-selected={option.value === value}
                className={`cursor-default select-none relative py-2 pl-3 pr-9 ${
                  option.value === value ? 'bg-blue-600 text-white' : 'text-gray-900'
                } ${
                  index === focusedIndex ? 'bg-blue-100' : ''
                }`}
                onClick={() => handleOptionSelect(option)}
                onMouseEnter={() => setFocusedIndex(index)}
              >
                <span className="block truncate">{option.label}</span>
                {option.value === value && (
                  <span className="absolute inset-y-0 right-0 flex items-center pr-4">
                    <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </span>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}

/**
 * Accessible table component
 * @param {Object} props - Component props
 * @returns {JSX.Element}
 */
export function AccessibleTable({ 
  caption,
  columns = [],
  data = [],
  sortable = false,
  onSort,
  className = '',
  ...props 
}) {
  const { generateId } = useAccessibility()
  const [tableId] = React.useState(() => generateId('table'))
  const [sortColumn, setSortColumn] = React.useState(null)
  const [sortDirection, setSortDirection] = React.useState('asc')

  const handleSort = (column) => {
    if (!sortable || !column.sortable) return

    const newDirection = sortColumn === column.key && sortDirection === 'asc' ? 'desc' : 'asc'
    setSortColumn(column.key)
    setSortDirection(newDirection)
    
    if (onSort) {
      onSort(column.key, newDirection)
    }
  }

  return (
    <div className={`accessible-table ${className}`}>
      <table
        id={tableId}
        role="table"
        aria-label={caption}
        className="min-w-full divide-y divide-gray-200"
        {...props}
      >
        {caption && (
          <caption className="sr-only">{caption}</caption>
        )}
        
        <thead className="bg-gray-50">
          <tr role="row">
            {columns.map((column) => (
              <th
                key={column.key}
                role="columnheader"
                scope="col"
                aria-sort={
                  sortable && column.sortable
                    ? sortColumn === column.key
                      ? sortDirection === 'asc' ? 'ascending' : 'descending'
                      : 'none'
                    : undefined
                }
                className={`px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider ${
                  sortable && column.sortable ? 'cursor-pointer hover:bg-gray-100' : ''
                }`}
                onClick={() => handleSort(column)}
                tabIndex={sortable && column.sortable ? 0 : undefined}
              >
                <div className="flex items-center space-x-1">
                  <span>{column.label}</span>
                  {sortable && column.sortable && (
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  )}
                </div>
              </th>
            ))}
          </tr>
        </thead>
        
        <tbody className="bg-white divide-y divide-gray-200">
          {data.map((row, rowIndex) => (
            <tr key={rowIndex} role="row">
              {columns.map((column) => (
                <td
                  key={column.key}
                  role="cell"
                  className="px-6 py-4 whitespace-nowrap text-sm text-gray-900"
                >
                  {column.render ? column.render(row[column.key], row) : row[column.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

/**
 * Accessible progress bar component
 * @param {Object} props - Component props
 * @returns {JSX.Element}
 */
export function AccessibleProgressBar({ 
  value = 0,
  max = 100,
  label = 'Progress',
  showValue = true,
  className = '',
  ...props 
}) {
  const { generateId } = useAccessibility()
  const [progressId] = React.useState(() => generateId('progress'))
  const [labelId] = React.useState(() => generateId('progress-label'))

  const percentage = Math.round((value / max) * 100)

  return (
    <div className={`accessible-progress ${className}`}>
      <div className="flex justify-between items-center mb-1">
        <label id={labelId} htmlFor={progressId} className="text-sm font-medium text-gray-700">
          {label}
        </label>
        {showValue && (
          <span className="text-sm text-gray-600" aria-live="polite">
            {percentage}%
          </span>
        )}
      </div>
      
      <div
        id={progressId}
        role="progressbar"
        aria-labelledby={labelId}
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={max}
        aria-valuetext={`${percentage}% complete`}
        className="w-full bg-gray-200 rounded-full h-2"
        {...props}
      >
        <div
          className="bg-blue-600 h-2 rounded-full transition-all duration-300"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  )
}

/**
 * Accessibility provider component
 * @param {Object} props - Component props
 * @returns {JSX.Element}
 */
export function AccessibilityProvider({ 
  children, 
  className = '',
  enableSkipLinks = true,
  enableLiveRegions = true 
}) {
  const { announce, regionRef } = useAriaLiveRegion()

  React.useEffect(() => {
    // Add accessibility classes to body
    document.body.classList.add(A11Y_CONFIG.FOCUS_RING_CLASS)
    
    // Check for reduced motion preference
    if (AccessibilityUtils.prefersReducedMotion()) {
      document.body.classList.add(A11Y_CONFIG.REDUCE_MOTION_CLASS)
    }
    
    // Check for high contrast preference
    if (AccessibilityUtils.prefersHighContrast()) {
      document.body.classList.add(A11Y_CONFIG.HIGH_CONTRAST_CLASS)
    }

    return () => {
      document.body.classList.remove(
        A11Y_CONFIG.FOCUS_RING_CLASS,
        A11Y_CONFIG.REDUCE_MOTION_CLASS,
        A11Y_CONFIG.HIGH_CONTRAST_CLASS
      )
    }
  }, [])

  return (
    <div className={`accessibility-provider ${className}`}>
      {enableSkipLinks && <SkipLink />}
      {children}
      {enableLiveRegions && <div ref={regionRef} className="sr-only" aria-live="polite" />}
    </div>
  )
}
