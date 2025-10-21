/**
 * @fileoverview Optimistic update UI components
 * 
 * Provides React components for displaying optimistic update states,
 * progress indicators, and rollback notifications.
 */

import React from 'react'
import { 
  useOptimisticUpdates, 
  optimisticUpdateManager,
  OptimisticUpdateIndicator,
  OptimisticUpdateToasts,
  OptimisticUpdateHistory 
} from '../utils/optimisticUpdates.jsx'

/**
 * Optimistic update wrapper component
 * @param {Object} props - Component props
 * @returns {JSX.Element}
 */
export function OptimisticWrapper({ 
  children, 
  entityType, 
  entityId, 
  className = '',
  showIndicator = true,
  showToasts = true 
}) {
  const { isOptimistic, pendingUpdates } = useOptimisticUpdates(entityType, entityId)

  return (
    <div className={`optimistic-wrapper ${className} ${isOptimistic ? 'optimistic-state' : ''}`}>
      {children}
      
      {showIndicator && isOptimistic && (
        <OptimisticUpdateIndicator 
          entityType={entityType} 
          entityId={entityId}
          className="mt-2"
        />
      )}
      
      {showToasts && (
        <OptimisticUpdateToasts />
      )}
    </div>
  )
}

/**
 * Optimistic button component that shows loading state during updates
 * @param {Object} props - Component props
 * @returns {JSX.Element}
 */
export function OptimisticButton({ 
  children, 
  onClick, 
  entityType, 
  entityId,
  disabled = false,
  className = '',
  loadingText = 'Saving...',
  successText = 'Saved!',
  errorText = 'Failed',
  showStatus = true,
  ...props 
}) {
  const { isOptimistic, pendingUpdates } = useOptimisticUpdates(entityType, entityId)
  const [status, setStatus] = React.useState(null) // 'success', 'error', null

  React.useEffect(() => {
    const unsubscribe = optimisticUpdateManager.subscribe((event, data) => {
      if (data && data.entityType === entityType && data.entityId === entityId) {
        if (event === 'update_success') {
          setStatus('success')
          setTimeout(() => setStatus(null), 2000)
        } else if (event === 'update_failed') {
          setStatus('error')
          setTimeout(() => setStatus(null), 3000)
        }
      }
    })

    return unsubscribe
  }, [entityType, entityId])

  const getButtonText = () => {
    if (status === 'success') return successText
    if (status === 'error') return errorText
    if (isOptimistic) return loadingText
    return children
  }

  const getButtonClass = () => {
    let baseClass = className
    if (isOptimistic) baseClass += ' opacity-75 cursor-not-allowed'
    if (status === 'success') baseClass += ' bg-green-600 hover:bg-green-700'
    if (status === 'error') baseClass += ' bg-red-600 hover:bg-red-700'
    return baseClass
  }

  return (
    <button
      onClick={onClick}
      disabled={disabled || isOptimistic}
      className={getButtonClass()}
      {...props}
    >
      <div className="flex items-center space-x-2">
        {isOptimistic && (
          <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
        )}
        <span>{getButtonText()}</span>
        {showStatus && status && (
          <span className="text-xs">
            {status === 'success' ? '✓' : status === 'error' ? '✗' : ''}
          </span>
        )}
      </div>
    </button>
  )
}

/**
 * Optimistic input component that shows optimistic state
 * @param {Object} props - Component props
 * @returns {JSX.Element}
 */
export function OptimisticInput({ 
  value, 
  onChange, 
  entityType, 
  entityId,
  className = '',
  optimisticClassName = '',
  ...props 
}) {
  const { isOptimistic } = useOptimisticUpdates(entityType, entityId)

  const getInputClass = () => {
    let baseClass = className
    if (isOptimistic) {
      baseClass += ` ${optimisticClassName}`
    }
    return baseClass
  }

  return (
    <div className="relative">
      <input
        value={value}
        onChange={onChange}
        className={getInputClass()}
        {...props}
      />
      {isOptimistic && (
        <div className="absolute right-2 top-1/2 transform -translate-y-1/2">
          <div className="animate-pulse w-2 h-2 bg-blue-500 rounded-full" />
        </div>
      )}
    </div>
  )
}

/**
 * Optimistic list item component
 * @param {Object} props - Component props
 * @returns {JSX.Element}
 */
export function OptimisticListItem({ 
  children, 
  item, 
  entityType, 
  className = '',
  optimisticClassName = '',
  showIndicator = true,
  ...props 
}) {
  const { isOptimistic, pendingUpdates } = useOptimisticUpdates(entityType, item.id)

  const getItemClass = () => {
    let baseClass = className
    if (isOptimistic) {
      baseClass += ` ${optimisticClassName}`
    }
    return baseClass
  }

  return (
    <div className={getItemClass()} {...props}>
      {children}
      
      {showIndicator && isOptimistic && (
        <div className="flex items-center space-x-2 mt-1">
          <div className="animate-spin rounded-full h-3 w-3 border-2 border-blue-500 border-t-transparent" />
          <span className="text-xs text-blue-600">
            {pendingUpdates.find(u => u.entityId === item.id)?.status === 'retrying' 
              ? 'Retrying...' 
              : 'Saving...'}
          </span>
        </div>
      )}
    </div>
  )
}

/**
 * Optimistic form component
 * @param {Object} props - Component props
 * @returns {JSX.Element}
 */
export function OptimisticForm({ 
  children, 
  onSubmit, 
  entityType, 
  entityId,
  className = '',
  optimisticClassName = '',
  showProgress = true,
  ...props 
}) {
  const { isOptimistic, pendingUpdates } = useOptimisticUpdates(entityType, entityId)

  const getFormClass = () => {
    let baseClass = className
    if (isOptimistic) {
      baseClass += ` ${optimisticClassName}`
    }
    return baseClass
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!isOptimistic) {
      onSubmit(e)
    }
  }

  return (
    <form onSubmit={handleSubmit} className={getFormClass()} {...props}>
      {children}
      
      {showProgress && isOptimistic && (
        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
          <div className="flex items-center space-x-2">
            <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-500 border-t-transparent" />
            <span className="text-sm text-blue-700">
              {pendingUpdates.length > 0 && pendingUpdates[0].status === 'retrying'
                ? 'Retrying...'
                : 'Saving changes...'}
            </span>
          </div>
        </div>
      )}
    </form>
  )
}

/**
 * Optimistic data display component
 * @param {Object} props - Component props
 * @returns {JSX.Element}
 */
export function OptimisticDataDisplay({ 
  data, 
  entityType, 
  entityId,
  renderData,
  renderOptimistic,
  className = '',
  optimisticClassName = '',
  ...props 
}) {
  const { isOptimistic } = useOptimisticUpdates(entityType, entityId)

  const getDisplayClass = () => {
    let baseClass = className
    if (isOptimistic) {
      baseClass += ` ${optimisticClassName}`
    }
    return baseClass
  }

  return (
    <div className={getDisplayClass()} {...props}>
      {isOptimistic && renderOptimistic 
        ? renderOptimistic(data)
        : renderData(data)
      }
    </div>
  )
}

/**
 * Optimistic update status component
 * @param {Object} props - Component props
 * @returns {JSX.Element}
 */
export function OptimisticUpdateStatus({ 
  entityType, 
  entityId,
  className = '',
  showDetails = false 
}) {
  const { isOptimistic, pendingUpdates } = useOptimisticUpdates(entityType, entityId)

  if (!isOptimistic || pendingUpdates.length === 0) {
    return null
  }

  const latestUpdate = pendingUpdates[pendingUpdates.length - 1]

  return (
    <div className={`optimistic-status ${className}`}>
      <div className="flex items-center space-x-2">
        <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-500 border-t-transparent" />
        <span className="text-sm text-blue-600">
          {latestUpdate.status === 'retrying' ? 'Retrying...' : 'Saving...'}
        </span>
        {showDetails && (
          <span className="text-xs text-gray-500">
            ({pendingUpdates.length} pending)
          </span>
        )}
      </div>
    </div>
  )
}

/**
 * Optimistic update dashboard component
 * @param {Object} props - Component props
 * @returns {JSX.Element}
 */
export function OptimisticUpdateDashboard({ 
  className = '',
  showHistory = true,
  showGlobalStatus = true,
  maxHistoryItems = 20 
}) {
  const [globalStatus, setGlobalStatus] = React.useState({
    pendingUpdates: 0,
    recentUpdates: 0,
    failedUpdates: 0
  })

  React.useEffect(() => {
    const updateGlobalStatus = () => {
      const pending = optimisticUpdateManager.getPendingUpdates()
      const history = optimisticUpdateManager.getUpdateHistory(maxHistoryItems)
      
      setGlobalStatus({
        pendingUpdates: pending.length,
        recentUpdates: history.filter(u => u.status === 'success').length,
        failedUpdates: history.filter(u => u.status === 'failed').length
      })
    }

    updateGlobalStatus()
    
    const unsubscribe = optimisticUpdateManager.subscribe(() => {
      updateGlobalStatus()
    })

    return unsubscribe
  }, [maxHistoryItems])

  return (
    <div className={`optimistic-dashboard ${className}`}>
      {showGlobalStatus && (
        <div className="mb-4 p-4 bg-gray-50 rounded-lg">
          <h3 className="text-lg font-semibold mb-2">Update Status</h3>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-blue-600">
                {globalStatus.pendingUpdates}
              </div>
              <div className="text-sm text-gray-600">Pending</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-green-600">
                {globalStatus.recentUpdates}
              </div>
              <div className="text-sm text-gray-600">Recent Success</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-red-600">
                {globalStatus.failedUpdates}
              </div>
              <div className="text-sm text-gray-600">Failed</div>
            </div>
          </div>
        </div>
      )}
      
      {showHistory && (
        <OptimisticUpdateHistory 
          limit={maxHistoryItems}
          showDetails={true}
        />
      )}
    </div>
  )
}

/**
 * Optimistic update provider component
 * @param {Object} props - Component props
 * @returns {JSX.Element}
 */
export function OptimisticUpdateProvider({ 
  children, 
  enableToasts = true,
  enableHistory = false,
  maxHistoryItems = 50 
}) {
  return (
    <div className="optimistic-update-provider">
      {children}
      
      {enableToasts && <OptimisticUpdateToasts />}
      
      {enableHistory && (
        <div className="fixed bottom-4 left-4 z-40">
          <OptimisticUpdateDashboard 
            showGlobalStatus={false}
            showHistory={true}
            maxHistoryItems={maxHistoryItems}
            className="max-w-sm"
          />
        </div>
      )}
    </div>
  )
}
