import React from 'react'

/**
 * Consistent content sections component
 * Provides standardized spacing and styling for page sections
 */
export default function PageSection({ 
  children, 
  variant = 'default',
  className = '' 
}) {
  const variants = {
    default: 'mb-6',
    card: 'card mb-6',
    elevated: 'card-elevated mb-6'
  }
  
  return (
    <div className={`${variants[variant]} ${className}`}>
      {children}
    </div>
  )
}
