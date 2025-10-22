import React from 'react'

/**
 * Standardized page wrapper component
 * Provides consistent spacing and layout for all pages
 */
export default function PageContainer({ children, className = '' }) {
  return (
    <div className={`mt-16 md:mt-24 relative pb-[200px] ${className}`}>
      {children}
    </div>
  )
}
