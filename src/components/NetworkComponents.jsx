/**
 * @fileoverview Network resilience UI components
 * 
 * Provides React components for displaying network status,
 * offline indicators, retry progress, and connection management.
 */

import React from 'react'
import { 
  useNetworkState, 
  useNetworkResilientOperation,
  useOfflineCache,
  networkStateManager 
} from '../utils/networkResilience.js'

/**
 * Network status indicator component
 * @param {Object} props - Component props
 * @returns {JSX.Element}
 */
export function NetworkStatusIndicator({ 
  className = '',
  showDetails = false,
  position = 'top-right' // 'top-right', 'top-left', 'bottom-right', 'bottom-left'
}) {
  const { isOnline, isConnected, queueSize, uptime } = useNetworkState()

  const getStatusColor = () => {
    if (!isOnline) return 'bg-red-500'
    if (!isConnected) return 'bg-yellow-500'
    return 'bg-green-500'
  }

  const getStatusText = () => {
    if (!isOnline) return 'Offline'
    if (!isConnected) return 'Connecting...'
    return 'Online'
  }

  const getPositionClass = () => {
    const positions = {
      'top-right': 'top-4 right-4',
      'top-left': 'top-4 left-4',
      'bottom-right': 'bottom-4 right-4',
      'bottom-left': 'bottom-4 left-4'
    }
    return positions[position] || positions['top-right']
  }

  return (
    <div className={`fixed ${getPositionClass()} z-50 ${className}`}>
      <div className={`flex items-center space-x-2 px-3 py-2 rounded-lg shadow-lg ${getStatusColor()} text-white`}>
        <div className={`w-2 h-2 rounded-full ${isOnline && isConnected ? 'bg-white' : 'bg-gray-300'}`} />
        <span className="text-sm font-medium">{getStatusText()}</span>
        
        {showDetails && (
          <div className="text-xs opacity-75">
            {queueSize > 0 && `(${queueSize} queued)`}
          </div>
        )}
      </div>
    </div>
  )
}

/**
 * Offline banner component
 * @param {Object} props - Component props
 * @returns {JSX.Element}
 */
export function OfflineBanner({ 
  className = '',
  showRetryButton = true,
  onRetry = null 
}) {
  const { isOnline, isConnected, checkConnectivity } = useNetworkState()
  const [isChecking, setIsChecking] = React.useState(false)

  const handleRetry = async () => {
    setIsChecking(true)
    try {
      await checkConnectivity()
      onRetry?.()
    } finally {
      setIsChecking(false)
    }
  }

  if (isOnline && isConnected) {
    return null
  }

  return (
    <div className={`offline-banner bg-red-600 text-white p-4 ${className}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          <div>
            <h3 className="text-sm font-medium">
              {!isOnline ? 'You\'re offline' : 'Connection issues'}
            </h3>
            <p className="text-xs opacity-90">
              {!isOnline 
                ? 'Check your internet connection and try again.' 
                : 'Unable to reach the server. Retrying automatically...'
              }
            </p>
          </div>
        </div>
        
        {showRetryButton && (
          <button
            onClick={handleRetry}
            disabled={isChecking}
            className="px-3 py-1 bg-white bg-opacity-20 rounded text-xs font-medium hover:bg-opacity-30 disabled:opacity-50"
          >
            {isChecking ? 'Checking...' : 'Retry'}
          </button>
        )}
      </div>
    </div>
  )
}

/**
 * Retry progress component
 * @param {Object} props - Component props
 * @returns {JSX.Element}
 */
export function RetryProgress({ 
  operation,
  className = '',
  showDetails = false 
}) {
  const [retryState, setRetryState] = React.useState({
    isRetrying: false,
    retryCount: 0,
    lastError: null
  })

  React.useEffect(() => {
    const unsubscribe = networkStateManager.subscribe((event, data) => {
      if (event === 'operation_retry' && data.operation === operation) {
        setRetryState({
          isRetrying: true,
          retryCount: data.attempt,
          lastError: data.error
        })
      } else if (event === 'operation_success' && data.operation === operation) {
        setRetryState({
          isRetrying: false,
          retryCount: 0,
          lastError: null
        })
      }
    })

    return unsubscribe
  }, [operation])

  if (!retryState.isRetrying) {
    return null
  }

  return (
    <div className={`retry-progress ${className}`}>
      <div className="flex items-center space-x-2">
        <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-500 border-t-transparent" />
        <span className="text-sm text-blue-600">
          Retrying {operation} (attempt {retryState.retryCount})
        </span>
      </div>
      
      {showDetails && retryState.lastError && (
        <div className="mt-1 text-xs text-gray-600">
          Error: {retryState.lastError.message}
        </div>
      )}
    </div>
  )
}

/**
 * Network resilience wrapper component
 * @param {Object} props - Component props
 * @returns {JSX.Element}
 */
export function NetworkResilientWrapper({ 
  children, 
  operation,
  fallback = null,
  showRetryProgress = true,
  className = '' 
}) {
  const { isOnline, isConnected } = useNetworkState()
  const [hasError, setHasError] = React.useState(false)

  React.useEffect(() => {
    const unsubscribe = networkStateManager.subscribe((event, data) => {
      if (event === 'operation_retry_failed' && data.request.operation === operation) {
        setHasError(true)
      } else if (event === 'operation_success' && data.operation === operation) {
        setHasError(false)
      }
    })

    return unsubscribe
  }, [operation])

  // Show fallback if offline and no cached data
  if (!isOnline && !isConnected) {
    return fallback || (
      <div className={`network-resilient-fallback ${className}`}>
        <div className="text-center p-4 text-gray-500">
          <svg className="w-8 h-8 mx-auto mb-2" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M3.707 2.293a1 1 0 00-1.414 1.414l14 14a1 1 0 001.414-1.414l-1.473-1.473A10.014 10.014 0 0019.542 10C18.268 5.943 14.478 3 10 3a9.958 9.958 0 00-4.512 1.074l-1.78-1.781zm4.261 4.26l1.514 1.515a2.003 2.003 0 012.45 2.45l1.514 1.514a4 4 0 00-5.478-5.478z" clipRule="evenodd" />
            <path d="M12.454 16.697L9.75 13.992a4 4 0 01-3.742-3.741L2.335 6.578A9.98 9.98 0 00.458 10c1.274 4.057 5.065 7 9.542 7 .847 0 1.669-.105 2.454-.303z" />
          </svg>
          <p>Content unavailable offline</p>
        </div>
      </div>
    )
  }

  return (
    <div className={`network-resilient-wrapper ${className}`}>
      {children}
      
      {showRetryProgress && (
        <RetryProgress operation={operation} className="mt-2" />
      )}
      
      {hasError && (
        <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-sm text-red-700">
          Failed to load content. Will retry automatically when connection is restored.
        </div>
      )}
    </div>
  )
}

/**
 * Offline cache status component
 * @param {Object} props - Component props
 * @returns {JSX.Element}
 */
export function OfflineCacheStatus({ 
  className = '',
  showDetails = false 
}) {
  const { cacheStats, clearCache } = useOfflineCache()

  if (cacheStats.size === 0) {
    return null
  }

  return (
    <div className={`offline-cache-status ${className}`}>
      <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
        <div className="flex items-center space-x-2">
          <svg className="w-4 h-4 text-gray-500" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
          </svg>
          <span className="text-sm text-gray-600">
            {cacheStats.size} items cached
          </span>
        </div>
        
        {showDetails && (
          <button
            onClick={clearCache}
            className="text-xs text-gray-500 hover:text-gray-700"
          >
            Clear
          </button>
        )}
      </div>
    </div>
  )
}

/**
 * Network resilience dashboard component
 * @param {Object} props - Component props
 * @returns {JSX.Element}
 */
export function NetworkResilienceDashboard({ 
  className = '',
  showCacheStatus = true,
  showQueueStatus = true 
}) {
  const { isOnline, isConnected, queueSize, uptime } = useNetworkState()
  const { cacheStats } = useOfflineCache()

  return (
    <div className={`network-dashboard ${className}`}>
      <h3 className="text-lg font-semibold mb-4">Network Status</h3>
      
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="p-3 bg-gray-50 rounded">
          <div className="text-sm text-gray-600">Connection</div>
          <div className={`text-lg font-semibold ${
            isOnline && isConnected ? 'text-green-600' : 'text-red-600'
          }`}>
            {isOnline && isConnected ? 'Online' : 'Offline'}
          </div>
        </div>
        
        <div className="p-3 bg-gray-50 rounded">
          <div className="text-sm text-gray-600">Queue Size</div>
          <div className="text-lg font-semibold text-blue-600">
            {queueSize}
          </div>
        </div>
      </div>
      
      {showCacheStatus && (
        <div className="mb-4">
          <h4 className="text-sm font-medium text-gray-700 mb-2">Offline Cache</h4>
          <div className="p-3 bg-gray-50 rounded">
            <div className="text-sm text-gray-600">
              {cacheStats.size} / {cacheStats.maxSize} items
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
              <div 
                className="bg-blue-600 h-2 rounded-full"
                style={{ width: `${(cacheStats.size / cacheStats.maxSize) * 100}%` }}
              />
            </div>
          </div>
        </div>
      )}
      
      {showQueueStatus && queueSize > 0 && (
        <div className="mb-4">
          <h4 className="text-sm font-medium text-gray-700 mb-2">Pending Requests</h4>
          <div className="p-3 bg-yellow-50 border border-yellow-200 rounded">
            <div className="text-sm text-yellow-800">
              {queueSize} requests waiting to be retried
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

/**
 * Network resilience provider component
 * @param {Object} props - Component props
 * @returns {JSX.Element}
 */
export function NetworkResilienceProvider({ 
  children, 
  showStatusIndicator = true,
  showOfflineBanner = true,
  statusPosition = 'top-right',
  className = '' 
}) {
  return (
    <div className={`network-resilience-provider ${className}`}>
      {children}
      
      {showStatusIndicator && (
        <NetworkStatusIndicator position={statusPosition} />
      )}
      
      {showOfflineBanner && (
        <OfflineBanner />
      )}
    </div>
  )
}
