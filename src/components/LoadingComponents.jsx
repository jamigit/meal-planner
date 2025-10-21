/**
 * @fileoverview React components for loading states
 * 
 * Provides React components for displaying loading indicators,
 * skeleton loaders, and loading contexts.
 */

import React from 'react'
import { createInitialLoadingState, LOADING_TYPES } from '../utils/loadingStates.js'

/**
 * Loading indicator component
 * @param {Object} props - Component props
 * @returns {JSX.Element}
 */
export function LoadingIndicator({ 
  isLoading, 
  type = LOADING_TYPES.INITIAL, 
  message, 
  progress, 
  size = 'medium',
  className = '' 
}) {
  if (!isLoading) return null
  
  const sizeClasses = {
    small: 'w-4 h-4',
    medium: 'w-6 h-6',
    large: 'w-8 h-8'
  }
  
  const isBlocking = type !== LOADING_TYPES.BACKGROUND
  
  return (
    <div className={`loading-indicator ${className} ${isBlocking ? 'blocking' : 'non-blocking'}`}>
      <div className="flex items-center space-x-2">
        <div className={`animate-spin rounded-full border-2 border-gray-300 border-t-blue-600 ${sizeClasses[size]}`} />
        {message && (
          <span className="text-sm text-gray-600">
            {message}
          </span>
        )}
      </div>
      
      {progress > 0 && (
        <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
          <div 
            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}
    </div>
  )
}

/**
 * Skeleton loader component for content areas
 * @param {Object} props - Component props
 * @returns {JSX.Element}
 */
export function SkeletonLoader({ 
  lines = 3, 
  height = 'h-4', 
  className = '',
  animate = true 
}) {
  return (
    <div className={`skeleton-loader ${className}`}>
      {Array.from({ length: lines }).map((_, index) => (
        <div
          key={index}
          className={`bg-gray-200 rounded ${height} mb-2 ${
            animate ? 'animate-pulse' : ''
          }`}
          style={{
            width: index === lines - 1 ? '75%' : '100%'
          }}
        />
      ))}
    </div>
  )
}

/**
 * Global loading state context
 */
export const LoadingContext = React.createContext({
  globalLoading: createInitialLoadingState(),
  setGlobalLoading: () => {},
  clearGlobalLoading: () => {}
})

/**
 * Global loading state provider
 * @param {Object} props - Component props
 * @returns {JSX.Element}
 */
export function LoadingProvider({ children }) {
  const [globalLoading, setGlobalLoading] = React.useState(createInitialLoadingState())
  
  const clearGlobalLoading = React.useCallback(() => {
    setGlobalLoading(createInitialLoadingState())
  }, [])
  
  const value = React.useMemo(() => ({
    globalLoading,
    setGlobalLoading,
    clearGlobalLoading
  }), [globalLoading, clearGlobalLoading])
  
  return (
    <LoadingContext.Provider value={value}>
      {children}
    </LoadingContext.Provider>
  )
}

/**
 * Hook to access global loading state
 * @returns {Object} Global loading state and controls
 */
export function useGlobalLoading() {
  const context = React.useContext(LoadingContext)
  if (!context) {
    throw new Error('useGlobalLoading must be used within LoadingProvider')
  }
  return context
}
