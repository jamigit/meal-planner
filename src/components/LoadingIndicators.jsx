/**
 * @fileoverview Global loading indicator component
 * 
 * Displays loading states across the application with different
 * types of loading indicators and progress tracking.
 */

import React from 'react'
import { useGlobalLoading } from './LoadingComponents.jsx'

/**
 * Global loading indicator that shows when any service operation is running
 */
export function GlobalLoadingIndicator() {
  const { globalLoading } = useGlobalLoading()

  if (!globalLoading.isLoading) {
    return null
  }

  return (
    <div className="fixed top-4 right-4 z-50">
      <div className="bg-white shadow-lg rounded-lg p-4 border border-gray-200">
        <div className="flex items-center space-x-3">
          <div className="animate-spin rounded-full h-5 w-5 border-2 border-gray-300 border-t-blue-600" />
          <div className="text-sm text-gray-700">
            {globalLoading.operations.length === 1 
              ? globalLoading.operations[0].operation
              : `${globalLoading.count} operations running`
            }
          </div>
        </div>
        
        {globalLoading.operations.length > 1 && (
          <div className="mt-2 text-xs text-gray-500">
            {globalLoading.operations.map((op, index) => (
              <div key={index} className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse" />
                <span>{op.operation}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

/**
 * Page-level loading indicator for initial data loading
 */
export function PageLoadingIndicator({ 
  isLoading, 
  message = 'Loading...', 
  children,
  skeleton = false 
}) {
  if (!isLoading) {
    return children
  }

  if (skeleton) {
    return (
      <div className="space-y-4">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-5/6"></div>
        </div>
        {children}
      </div>
    )
  }

  return (
    <div className="flex items-center justify-center py-12">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-gray-300 border-t-blue-600 mx-auto mb-4" />
        <p className="text-gray-600">{message}</p>
      </div>
    </div>
  )
}

/**
 * Inline loading indicator for buttons and forms
 */
export function InlineLoadingIndicator({ 
  isLoading, 
  children, 
  loadingText = 'Loading...',
  size = 'sm' 
}) {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-5 w-5',
    lg: 'h-6 w-6'
  }

  return (
    <div className="flex items-center space-x-2">
      {isLoading && (
        <div className={`animate-spin rounded-full border-2 border-gray-300 border-t-blue-600 ${sizeClasses[size]}`} />
      )}
      <span>{isLoading ? loadingText : children}</span>
    </div>
  )
}

/**
 * Progress bar component
 */
export function ProgressBar({ 
  progress, 
  message = null, 
  showPercentage = true,
  className = '' 
}) {
  const percentage = Math.max(0, Math.min(100, progress))

  return (
    <div className={`progress-bar ${className}`}>
      {message && (
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm text-gray-700">{message}</span>
          {showPercentage && (
            <span className="text-sm text-gray-500">{percentage}%</span>
          )}
        </div>
      )}
      
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div 
          className="bg-blue-600 h-2 rounded-full transition-all duration-300 ease-out"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  )
}

/**
 * Loading overlay for blocking operations
 */
export function LoadingOverlay({ 
  isLoading, 
  message = 'Please wait...',
  children 
}) {
  if (!isLoading) {
    return children
  }

  return (
    <div className="relative">
      {children}
      <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center z-10">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-gray-300 border-t-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">{message}</p>
        </div>
      </div>
    </div>
  )
}

/**
 * Skeleton loader for specific content types
 */
export function SkeletonLoader({ 
  type = 'generic',
  count = 1,
  className = '' 
}) {
  const skeletons = {
    generic: (
      <div className="animate-pulse space-y-3">
        <div className="h-4 bg-gray-200 rounded w-3/4"></div>
        <div className="h-4 bg-gray-200 rounded w-1/2"></div>
        <div className="h-4 bg-gray-200 rounded w-5/6"></div>
      </div>
    ),
    
    card: (
      <div className="animate-pulse">
        <div className="h-48 bg-gray-200 rounded mb-4"></div>
        <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
        <div className="h-4 bg-gray-200 rounded w-1/2"></div>
      </div>
    ),
    
    list: (
      <div className="animate-pulse space-y-2">
        {Array.from({ length: count }).map((_, i) => (
          <div key={i} className="flex items-center space-x-3">
            <div className="h-4 w-4 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded flex-1"></div>
          </div>
        ))}
      </div>
    ),
    
    table: (
      <div className="animate-pulse">
        <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
        <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
        <div className="h-4 bg-gray-200 rounded w-1/2"></div>
      </div>
    )
  }

  return (
    <div className={`skeleton-loader ${className}`}>
      {skeletons[type] || skeletons.generic}
    </div>
  )
}
