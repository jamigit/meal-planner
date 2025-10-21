/**
 * @fileoverview Error boundary component for React error handling
 * 
 * Provides a React error boundary that catches JavaScript errors anywhere
 * in the component tree and displays a fallback UI.
 */

import React from 'react'
import { normalizeError, logError } from '../utils/errorHandling.js'

/**
 * Error boundary component
 */
export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { 
      hasError: false, 
      error: null, 
      errorInfo: null,
      retryCount: 0
    }
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return { hasError: true }
  }

  componentDidCatch(error, errorInfo) {
    // Log the error
    const errorResponse = normalizeError(error, this.props.fallbackMessage || 'Something went wrong')
    logError(errorResponse, 'React Error Boundary')
    
    this.setState({
      error,
      errorInfo
    })

    // Call error reporting service if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo)
    }
  }

  handleRetry = () => {
    this.setState(prevState => ({
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: prevState.retryCount + 1
    }))
  }

  handleReload = () => {
    window.location.reload()
  }

  render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback(this.state.error, this.handleRetry)
      }

      // Default fallback UI
      return (
        <div className="error-boundary min-h-screen flex items-center justify-center bg-gray-50">
          <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-6">
            <div className="flex items-center mb-4">
              <div className="flex-shrink-0">
                <svg className="h-8 w-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-lg font-medium text-gray-900">
                  {this.props.title || 'Something went wrong'}
                </h3>
              </div>
            </div>
            
            <div className="mb-4">
              <p className="text-sm text-gray-600">
                {this.props.fallbackMessage || 'An unexpected error occurred. Please try again.'}
              </p>
              
              {this.props.showDetails && this.state.error && (
                <details className="mt-2">
                  <summary className="text-sm text-gray-500 cursor-pointer">
                    Error details
                  </summary>
                  <pre className="mt-2 text-xs text-gray-400 bg-gray-100 p-2 rounded overflow-auto">
                    {this.state.error.toString()}
                    {this.state.errorInfo.componentStack}
                  </pre>
                </details>
              )}
            </div>
            
            <div className="flex space-x-3">
              <button
                onClick={this.handleRetry}
                className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                Try again
              </button>
              
              <button
                onClick={this.handleReload}
                className="flex-1 bg-gray-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
              >
                Reload page
              </button>
            </div>
            
            {this.state.retryCount > 0 && (
              <p className="mt-2 text-xs text-gray-500">
                Retry attempt: {this.state.retryCount}
              </p>
            )}
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

/**
 * Higher-order component that wraps a component with error boundary
 * @param {React.Component} Component - Component to wrap
 * @param {Object} errorBoundaryProps - Props for error boundary
 * @returns {React.Component}
 */
export function withErrorBoundary(Component, errorBoundaryProps = {}) {
  const WrappedComponent = (props) => (
    <ErrorBoundary {...errorBoundaryProps}>
      <Component {...props} />
    </ErrorBoundary>
  )
  
  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`
  
  return WrappedComponent
}

/**
 * Hook for error boundary functionality in functional components
 * @returns {Object} Error state and handlers
 */
export function useErrorBoundary() {
  const [error, setError] = React.useState(null)

  const resetError = React.useCallback(() => {
    setError(null)
  }, [])

  const captureError = React.useCallback((error) => {
    const errorResponse = normalizeError(error)
    logError(errorResponse, 'useErrorBoundary')
    setError(errorResponse.error)
  }, [])

  React.useEffect(() => {
    if (error) {
      throw error
    }
  }, [error])

  return {
    captureError,
    resetError
  }
}

/**
 * Simple error display component
 * @param {Object} props - Component props
 * @returns {JSX.Element}
 */
export function ErrorDisplay({ 
  error, 
  title = 'Error', 
  onRetry = null, 
  showDetails = false,
  className = '' 
}) {
  if (!error) return null

  return (
    <div className={`error-display bg-red-50 border border-red-200 rounded-md p-4 ${className}`}>
      <div className="flex">
        <div className="flex-shrink-0">
          <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
        </div>
        <div className="ml-3">
          <h3 className="text-sm font-medium text-red-800">
            {title}
          </h3>
          <div className="mt-2 text-sm text-red-700">
            <p>{error.message}</p>
            
            {showDetails && error.details && (
              <details className="mt-2">
                <summary className="cursor-pointer">Show details</summary>
                <pre className="mt-2 text-xs bg-red-100 p-2 rounded overflow-auto">
                  {JSON.stringify(error.details, null, 2)}
                </pre>
              </details>
            )}
          </div>
          
          {onRetry && (
            <div className="mt-4">
              <button
                onClick={onRetry}
                className="bg-red-100 text-red-800 px-3 py-1 rounded text-sm font-medium hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
              >
                Try again
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
