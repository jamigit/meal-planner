# Network Resilience

## Offline Detection

### Network State Management
**File**: `src/utils/networkResilience.js`

```javascript
const NETWORK_CONFIG = {
  ENABLE_PING: false, // Disabled for static builds
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000,
  MAX_RETRY_DELAY: 10000
}

// Check connectivity
export function checkConnectivity() {
  if (!NETWORK_CONFIG.ENABLE_PING) {
    return navigator.onLine
  }
  
  // Ping-based connectivity check
  return fetch('/api/ping', { method: 'HEAD' })
    .then(() => true)
    .catch(() => false)
}
```

### Offline State Tracking
```javascript
// Network state manager
class NetworkStateManager {
  constructor() {
    this.isOnline = navigator.onLine
    this.listeners = new Set()
    this.setupEventListeners()
  }

  setupEventListeners() {
    window.addEventListener('online', () => this.setOnline(true))
    window.addEventListener('offline', () => this.setOnline(false))
  }

  setOnline(isOnline) {
    this.isOnline = isOnline
    this.notifyListeners('network_change', { isOnline })
  }
}
```

## Retry Logic

### Exponential Backoff
```javascript
export async function retryWithBackoff(fn, options = {}) {
  const {
    maxRetries = 3,
    baseDelay = 1000,
    maxDelay = 10000,
    backoffFactor = 2
  } = options

  let lastError
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn()
    } catch (error) {
      lastError = error
      
      if (attempt === maxRetries) {
        throw lastError
      }
      
      const delay = Math.min(
        baseDelay * Math.pow(backoffFactor, attempt),
        maxDelay
      )
      
      await new Promise(resolve => setTimeout(resolve, delay))
    }
  }
}
```

### Request Retry Pattern
```javascript
// Service wrapper with retry logic
export function withRetry(serviceMethod) {
  return async function(...args) {
    return retryWithBackoff(async () => {
      return await serviceMethod.apply(this, args)
    }, {
      maxRetries: 3,
      baseDelay: 1000
    })
  }
}
```

## Request Queuing

### Offline Queue
```javascript
class OfflineQueue {
  constructor() {
    this.queue = []
    this.isProcessing = false
  }

  async add(operation) {
    this.queue.push({
      id: Date.now(),
      operation,
      timestamp: new Date().toISOString()
    })
    
    if (navigator.onLine) {
      await this.processQueue()
    }
  }

  async processQueue() {
    if (this.isProcessing || this.queue.length === 0) return
    
    this.isProcessing = true
    
    while (this.queue.length > 0) {
      const item = this.queue.shift()
      try {
        await item.operation()
      } catch (error) {
        console.error('Queue operation failed:', error)
        // Re-queue failed operations
        this.queue.unshift(item)
        break
      }
    }
    
    this.isProcessing = false
  }
}
```

## Service Layer Resilience

### Network-Aware Services
```javascript
// Example: Network-resilient recipe service
class NetworkResilientRecipeService {
  constructor(baseService) {
    this.baseService = baseService
    this.offlineQueue = new OfflineQueue()
  }

  async add(recipe) {
    if (navigator.onLine) {
      try {
        return await this.baseService.add(recipe)
      } catch (error) {
        if (this.isNetworkError(error)) {
          // Queue for retry when online
          return this.offlineQueue.add(() => this.baseService.add(recipe))
        }
        throw error
      }
    } else {
      // Queue for when back online
      return this.offlineQueue.add(() => this.baseService.add(recipe))
    }
  }

  isNetworkError(error) {
    return error.name === 'NetworkError' || 
           error.message.includes('fetch')
  }
}
```

## Error Handling

### Network Error Classification
```javascript
export function classifyError(error) {
  if (error.name === 'NetworkError') {
    return 'NETWORK_ERROR'
  }
  
  if (error.message.includes('timeout')) {
    return 'TIMEOUT_ERROR'
  }
  
  if (error.status >= 500) {
    return 'SERVER_ERROR'
  }
  
  if (error.status >= 400) {
    return 'CLIENT_ERROR'
  }
  
  return 'UNKNOWN_ERROR'
}
```

### Error Recovery Strategies
```javascript
export function getRecoveryStrategy(errorType) {
  const strategies = {
    NETWORK_ERROR: 'retry_with_backoff',
    TIMEOUT_ERROR: 'retry_with_backoff',
    SERVER_ERROR: 'retry_with_backoff',
    CLIENT_ERROR: 'show_user_error',
    UNKNOWN_ERROR: 'log_and_show_generic_error'
  }
  
  return strategies[errorType] || 'log_and_show_generic_error'
}
```

## User Experience

### Offline Indicators
```javascript
// Network status component
function NetworkStatusIndicator() {
  const [isOnline, setIsOnline] = useState(navigator.onLine)
  
  useEffect(() => {
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)
    
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    
    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])
  
  if (!isOnline) {
    return (
      <div className="bg-yellow-100 border-l-4 border-yellow-500 p-4">
        <p className="text-yellow-700">
          You're offline. Changes will sync when you're back online.
        </p>
      </div>
    )
  }
  
  return null
}
```

### Optimistic Updates
```javascript
// Optimistic update pattern
export function useOptimisticUpdate() {
  const [optimisticData, setOptimisticData] = useState(null)
  const [isPending, setIsPending] = useState(false)
  
  const performUpdate = async (updateFn, optimisticValue) => {
    // Apply optimistic update immediately
    setOptimisticData(optimisticValue)
    setIsPending(true)
    
    try {
      const result = await updateFn()
      setOptimisticData(null) // Clear optimistic data
      return result
    } catch (error) {
      // Revert optimistic update on error
      setOptimisticData(null)
      throw error
    } finally {
      setIsPending(false)
    }
  }
  
  return { optimisticData, isPending, performUpdate }
}
```

## Configuration

### Environment-Specific Settings
```javascript
// Development vs Production network settings
const NETWORK_SETTINGS = {
  development: {
    ENABLE_PING: false,
    RETRY_ATTEMPTS: 1,
    RETRY_DELAY: 500
  },
  production: {
    ENABLE_PING: true,
    RETRY_ATTEMPTS: 3,
    RETRY_DELAY: 1000
  }
}

const settings = NETWORK_SETTINGS[import.meta.env.MODE] || NETWORK_SETTINGS.production
```

### Static Build Considerations
```javascript
// Disable ping for static builds (no server)
if (import.meta.env.MODE === 'production' && !window.location.hostname.includes('localhost')) {
  NETWORK_CONFIG.ENABLE_PING = false
}
```

## Monitoring

### Network Metrics
```javascript
// Track network performance
class NetworkMonitor {
  constructor() {
    this.metrics = {
      requests: 0,
      failures: 0,
      retries: 0,
      offlineTime: 0
    }
  }
  
  trackRequest(success, retryCount = 0) {
    this.metrics.requests++
    if (!success) this.metrics.failures++
    if (retryCount > 0) this.metrics.retries += retryCount
  }
  
  trackOfflineTime(duration) {
    this.metrics.offlineTime += duration
  }
}
```

### Error Reporting
```javascript
// Report network errors for monitoring
export function reportNetworkError(error, context) {
  console.error('Network Error:', {
    error: error.message,
    context,
    timestamp: new Date().toISOString(),
    userAgent: navigator.userAgent,
    online: navigator.onLine
  })
  
  // Send to monitoring service in production
  if (import.meta.env.PROD) {
    // analytics.track('network_error', { error, context })
  }
}
```

## Best Practices

### Do's ✅
- Always check `navigator.onLine` before making requests
- Implement exponential backoff for retries
- Queue operations when offline
- Show clear offline indicators to users
- Use optimistic updates for better UX
- Monitor network performance

### Don'ts ❌
- Don't assume network is always available
- Don't retry indefinitely
- Don't hide offline state from users
- Don't lose user data when offline
- Don't make blocking requests on main thread
- Don't ignore network errors
