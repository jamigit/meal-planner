import React from 'react'
import { messageVariants } from '../../utils/designSystem'

/**
 * Standardized message/alert component
 * Provides consistent styling for success, warning, error, and info messages
 */
export default function Message({ 
  variant = 'info', 
  children, 
  onClose,
  className = '' 
}) {
  const variantClass = messageVariants[variant] || messageVariants.info
  
  return (
    <div className={`${variantClass} ${className} flex items-start justify-between`}>
      <div className="flex-1">
        {children}
      </div>
      {onClose && (
        <button
          onClick={onClose}
          className="ml-4 text-current opacity-70 hover:opacity-100"
          aria-label="Dismiss"
        >
          ✕
        </button>
      )}
    </div>
  )
}
