/**
 * Color Migration Utilities
 * Helper functions to replace hardcoded colors with design tokens
 */

// Common color mappings from hardcoded values to design tokens
export const colorMigrationMap = {
  // Gray colors
  'bg-gray-50': 'bg-state-disabled',
  'bg-gray-100': 'bg-border-secondary',
  'bg-gray-200': 'bg-border-tertiary',
  'text-gray-400': 'text-text-tertiary',
  'text-gray-500': 'text-text-secondary',
  'text-gray-600': 'text-text-secondary',
  'text-gray-700': 'text-text-primary',
  'text-gray-800': 'text-text-primary',
  'text-gray-900': 'text-text-primary',
  'border-gray-100': 'border-border-secondary',
  'border-gray-200': 'border-border-secondary',
  'border-gray-300': 'border-border-tertiary',
  
  // Green colors (success/secondary)
  'bg-green-600': 'bg-semantic-success',
  'bg-green-700': 'bg-semantic-success-light',
  'text-green-600': 'text-semantic-success',
  'text-green-700': 'text-semantic-success',
  'text-green-800': 'text-semantic-success-light',
  'border-green-200': 'border-semantic-success/20',
  
  // Red colors (error)
  'bg-red-600': 'bg-semantic-error',
  'text-red-600': 'text-semantic-error',
  'text-red-700': 'text-semantic-error',
  'border-red-600': 'border-semantic-error',
  
  // Blue colors (info)
  'bg-blue-600': 'bg-semantic-info',
  'text-blue-600': 'text-semantic-info',
  'text-blue-800': 'text-semantic-info',
  'text-blue-900': 'text-semantic-info',
  'border-blue-200': 'border-semantic-info/20',
  'bg-blue-50': 'bg-semantic-info/5',
  
  // Black/white
  'text-black': 'text-text-primary',
  'text-white': 'text-text-inverse',
  'bg-white': 'bg-white',
  'bg-black': 'bg-text-primary',
  'border-black': 'border-border-primary',
  
  // Stone colors
  'bg-stone-800': 'bg-text-primary',
  'bg-stone-900': 'bg-surface-dark',
  'text-stone-800': 'text-text-primary',
  'text-stone-900': 'text-text-primary'
}

// Semantic button classes using design tokens
export const buttonClasses = {
  primary: 'bg-text-primary text-text-inverse hover:bg-text-primary/90',
  secondary: 'bg-semantic-success text-text-inverse hover:bg-semantic-success-light',
  tertiary: 'bg-white text-text-primary border-2 border-border-primary hover:bg-state-hover',
  success: 'bg-semantic-success text-text-inverse hover:bg-semantic-success-light',
  warning: 'bg-semantic-warning text-text-inverse hover:bg-semantic-warning-light',
  error: 'bg-semantic-error text-text-inverse hover:bg-semantic-error-light',
  ghost: 'bg-transparent text-text-primary hover:bg-state-hover',
  outline: 'bg-white text-text-primary border-2 border-border-primary hover:bg-state-hover'
}

// Tag color classes using design tokens
export const tagClasses = {
  cuisine: 'bg-semantic-success/10 text-semantic-success border border-semantic-success/20',
  ingredients: 'bg-border-secondary text-text-primary border border-border-tertiary',
  convenience: 'bg-border-tertiary text-text-primary border border-border-tertiary',
  legacy: 'bg-border-secondary text-text-primary border border-border-secondary'
}

// State classes for interactive elements
export const interactiveStates = {
  selected: 'bg-semantic-success text-text-inverse',
  hover: 'hover:bg-state-hover',
  'hover-dark': 'hover:bg-state-hover-dark',
  active: 'active:bg-state-active',
  disabled: 'bg-state-disabled text-text-tertiary cursor-not-allowed',
  focus: 'focus:ring-2 focus:ring-state-focus focus:ring-offset-2'
}

// Helper function to get semantic classes for recipe selection states
export function getRecipeSelectionClasses(isSelected, canSelect) {
  if (isSelected) {
    return 'bg-semantic-success text-text-inverse'
  } else if (canSelect) {
    return 'border-border-secondary hover:border-border-tertiary bg-white'
  } else {
    return 'border-border-secondary bg-state-disabled cursor-not-allowed'
  }
}

// Helper function to get tag filter classes
export function getTagFilterClasses(isActive, category = 'default') {
  const baseClasses = 'px-3 py-1 rounded-full text-sm border transition-colors'
  
  if (isActive) {
    return `${baseClasses} ${tagClasses[category] || tagClasses.legacy}`
  } else {
    return `${baseClasses} bg-state-disabled text-text-primary border-border-secondary hover:bg-state-hover`
  }
}

// Helper function to get modal/overlay classes
export function getModalClasses() {
  return {
    overlay: 'fixed inset-0 bg-surface-overlay',
    modal: 'bg-white rounded-modal shadow-modal',
    header: 'border-b border-border-secondary',
    footer: 'border-t border-border-secondary bg-state-disabled/20'
  }
}
