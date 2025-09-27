/**
 * Design System Utilities
 * Centralized design tokens and utility functions for consistent styling
 */

// Typography classes using design tokens
export const typography = {
  display: {
    1: 'text-display-1 font-heading',
    2: 'text-display-2 font-heading',
    3: 'text-display-3 font-heading'
  },
  heading: {
    xl: 'text-heading-xl font-heading font-black',
    lg: 'text-heading-lg font-heading font-black',
    md: 'text-heading-md font-heading font-black',
    sm: 'text-heading-sm font-heading font-black'
  },
  button: {
    lg: 'text-button-lg font-heading font-black uppercase',
    md: 'text-button-md font-heading font-black uppercase',
    sm: 'text-button-sm font-heading font-black uppercase'
  },
  ui: {
    lg: 'text-ui-lg',
    md: 'text-ui-md',
    sm: 'text-ui-sm'
  }
}

// Color classes using design tokens
export const colors = {
  text: {
    primary: 'text-text-primary',
    secondary: 'text-text-secondary',
    tertiary: 'text-text-tertiary',
    inverse: 'text-text-inverse',
    onDark: 'text-text-on-dark',
    onLight: 'text-text-on-light'
  },
  bg: {
    surface: 'bg-surface-light',
    card: 'bg-surface-card',
    dark: 'bg-surface-dark',
    overlay: 'bg-surface-overlay'
  },
  border: {
    primary: 'border-border-primary',
    secondary: 'border-border-secondary',
    tertiary: 'border-border-tertiary',
    dark: 'border-border-dark'
  },
  semantic: {
    success: 'text-semantic-success',
    'success-bg': 'bg-semantic-success',
    warning: 'text-semantic-warning',
    'warning-bg': 'bg-semantic-warning',
    error: 'text-semantic-error',
    'error-bg': 'bg-semantic-error'
  }
}

// Spacing classes using design tokens
export const spacing = {
  button: {
    sm: 'px-3 py-1.5',
    md: 'px-4 py-2',
    lg: 'px-6 py-3'
  },
  input: 'px-3 py-2',
  card: 'p-6'
}

// Shadow classes using design tokens
export const shadows = {
  card: 'shadow-card',
  'card-hover': 'shadow-card-hover',
  button: 'shadow-button',
  modal: 'shadow-modal'
}

// Border radius classes
export const borderRadius = {
  button: 'rounded-lg',
  card: 'rounded-lg',
  input: 'rounded-lg',
  tag: 'rounded-full',
  modal: 'rounded-xl'
}

// Interactive state classes
export const states = {
  hover: 'hover:bg-state-hover',
  'hover-dark': 'hover:bg-state-hover-dark',
  active: 'active:bg-state-active',
  focus: 'focus:ring-2 focus:ring-state-focus focus:ring-offset-2',
  disabled: 'disabled:bg-state-disabled disabled:cursor-not-allowed disabled:opacity-50'
}

// Utility function to join classes
export function joinClasses(...classes) {
  return classes.filter(Boolean).join(' ')
}

// Common component base classes
export const baseClasses = {
  button: [
    'inline-flex items-center justify-center',
    borderRadius.button,
    'transition-colors duration-200',
    states.focus,
    states.disabled
  ].join(' '),
  
  input: [
    'block w-full',
    borderRadius.input,
    spacing.input,
    'transition-colors duration-200',
    'border-2',
    states.focus,
    'placeholder:text-text-tertiary'
  ].join(' '),
  
  card: [
    borderRadius.card,
    shadows.card,
    spacing.card
  ].join(' ')
}

// Button variant configurations
export const buttonVariants = {
  primary: {
    light: 'bg-stone-800 text-white hover:bg-stone-900 focus:ring-stone-800',
    dark: 'bg-white text-stone-900 hover:bg-stone-100 focus:ring-white'
  },
  secondary: {
    light: 'bg-semantic-success text-white hover:bg-semantic-success-light focus:ring-semantic-success',
    dark: 'bg-semantic-success text-white hover:bg-semantic-success-light focus:ring-semantic-success'
  },
  tertiary: {
    light: 'bg-white text-text-primary border-border-primary hover:bg-state-hover focus:ring-text-primary',
    dark: 'bg-surface-dark text-text-onDark border-border-dark hover:bg-state-hover-dark focus:ring-text-onDark'
  },
  ghost: {
    light: 'bg-transparent text-text-primary hover:bg-state-hover focus:ring-text-primary',
    dark: 'bg-transparent text-text-onDark hover:bg-state-hover-dark focus:ring-text-onDark'
  },
  outline: {
    light: 'bg-white text-text-primary border-2 border-border-primary hover:bg-state-hover focus:ring-text-primary',
    dark: 'bg-transparent text-text-onDark border-2 border-text-onDark hover:bg-state-hover-dark focus:ring-text-onDark'
  }
}

// Card variant configurations
export const cardVariants = {
  light: 'bg-surface-card text-text-primary',
  surface: 'bg-surface-light text-text-primary',
  dark: 'bg-surface-dark text-text-onDark border-2 border-border-dark'
}
