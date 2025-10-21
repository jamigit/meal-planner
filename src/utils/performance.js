/**
 * @fileoverview Performance optimization utilities
 * 
 * Provides comprehensive performance optimization features including
 * memoization, debouncing, throttling, virtualization, and lazy loading.
 */

import React from 'react'

/**
 * Performance optimization configuration
 */
export const PERFORMANCE_CONFIG = {
  // Debouncing
  DEFAULT_DEBOUNCE_DELAY: 300,
  SEARCH_DEBOUNCE_DELAY: 500,
  INPUT_DEBOUNCE_DELAY: 200,
  
  // Throttling
  DEFAULT_THROTTLE_DELAY: 100,
  SCROLL_THROTTLE_DELAY: 16, // ~60fps
  RESIZE_THROTTLE_DELAY: 100,
  
  // Virtualization
  DEFAULT_ITEM_HEIGHT: 50,
  OVERSCAN_COUNT: 5,
  BUFFER_SIZE: 10,
  
  // Lazy loading
  DEFAULT_INTERSECTION_THRESHOLD: 0.1,
  DEFAULT_ROOT_MARGIN: '50px',
  
  // Memoization
  DEFAULT_CACHE_SIZE: 100,
  DEFAULT_TTL: 5 * 60 * 1000, // 5 minutes
  
  // Bundle splitting
  CHUNK_SIZE_THRESHOLD: 100000, // 100KB
}

/**
 * Debounce utility
 * @param {Function} func - Function to debounce
 * @param {number} delay - Delay in milliseconds
 * @param {Object} options - Debounce options
 * @returns {Function} Debounced function
 */
export function debounce(func, delay = PERFORMANCE_CONFIG.DEFAULT_DEBOUNCE_DELAY, options = {}) {
  const { leading = false, trailing = true, maxWait } = options
  
  let timeoutId = null
  let lastCallTime = 0
  let lastInvokeTime = 0
  let lastArgs = null
  let lastThis = null
  let result = null

  function invokeFunc(time) {
    const args = lastArgs
    const thisArg = lastThis

    lastArgs = null
    lastThis = null
    lastInvokeTime = time
    result = func.apply(thisArg, args)
    return result
  }

  function leadingEdge(time) {
    lastInvokeTime = time
    timeoutId = setTimeout(timerExpired, delay)
    return leading ? invokeFunc(time) : result
  }

  function remainingWait(time) {
    const timeSinceLastCall = time - lastCallTime
    const timeSinceLastInvoke = time - lastInvokeTime
    const timeWaiting = delay - timeSinceLastCall

    return maxWait ? Math.min(timeWaiting, maxWait - timeSinceLastInvoke) : timeWaiting
  }

  function shouldInvoke(time) {
    const timeSinceLastCall = time - lastCallTime
    const timeSinceLastInvoke = time - lastInvokeTime

    return (
      lastCallTime === 0 ||
      timeSinceLastCall >= delay ||
      timeSinceLastCall < 0 ||
      (maxWait && timeSinceLastInvoke >= maxWait)
    )
  }

  function timerExpired() {
    const time = Date.now()
    if (shouldInvoke(time)) {
      return trailingEdge(time)
    }
    timeoutId = setTimeout(timerExpired, remainingWait(time))
  }

  function trailingEdge(time) {
    timeoutId = null

    if (trailing && lastArgs) {
      return invokeFunc(time)
    }
    lastArgs = null
    lastThis = null
    return result
  }

  function cancel() {
    if (timeoutId !== null) {
      clearTimeout(timeoutId)
    }
    lastInvokeTime = 0
    lastArgs = null
    lastThis = null
    lastCallTime = 0
    timeoutId = null
  }

  function flush() {
    return timeoutId === null ? result : trailingEdge(Date.now())
  }

  function pending() {
    return timeoutId !== null
  }

  function debounced(...args) {
    const time = Date.now()
    const isInvoking = shouldInvoke(time)

    lastArgs = args
    lastThis = this
    lastCallTime = time

    if (isInvoking) {
      if (timeoutId === null) {
        return leadingEdge(lastCallTime)
      }
      if (maxWait) {
        timeoutId = setTimeout(timerExpired, delay)
        return invokeFunc(lastCallTime)
      }
    }
    if (timeoutId === null) {
      timeoutId = setTimeout(timerExpired, delay)
    }
    return result
  }

  debounced.cancel = cancel
  debounced.flush = flush
  debounced.pending = pending

  return debounced
}

/**
 * Throttle utility
 * @param {Function} func - Function to throttle
 * @param {number} delay - Delay in milliseconds
 * @param {Object} options - Throttle options
 * @returns {Function} Throttled function
 */
export function throttle(func, delay = PERFORMANCE_CONFIG.DEFAULT_THROTTLE_DELAY, options = {}) {
  const { leading = true, trailing = true } = options
  
  return debounce(func, delay, {
    leading,
    trailing,
    maxWait: delay
  })
}

/**
 * Memoization utility with LRU cache
 * @param {Function} func - Function to memoize
 * @param {Object} options - Memoization options
 * @returns {Function} Memoized function
 */
export function memoize(func, options = {}) {
  const { 
    cacheSize = PERFORMANCE_CONFIG.DEFAULT_CACHE_SIZE,
    ttl = PERFORMANCE_CONFIG.DEFAULT_TTL,
    keyGenerator = (...args) => JSON.stringify(args)
  } = options

  const cache = new Map()
  const timestamps = new Map()

  function cleanup() {
    const now = Date.now()
    for (const [key, timestamp] of timestamps) {
      if (now - timestamp > ttl) {
        cache.delete(key)
        timestamps.delete(key)
      }
    }
  }

  function memoized(...args) {
    const key = keyGenerator(...args)
    const now = Date.now()

    // Check if cached value exists and is still valid
    if (cache.has(key)) {
      const timestamp = timestamps.get(key)
      if (now - timestamp < ttl) {
        return cache.get(key)
      } else {
        cache.delete(key)
        timestamps.delete(key)
      }
    }

    // Clean up expired entries periodically
    if (cache.size > cacheSize * 0.8) {
      cleanup()
    }

    // Remove oldest entries if cache is full
    if (cache.size >= cacheSize) {
      const firstKey = cache.keys().next().value
      cache.delete(firstKey)
      timestamps.delete(firstKey)
    }

    // Compute and cache result
    const result = func.apply(this, args)
    cache.set(key, result)
    timestamps.set(key, now)

    return result
  }

  memoized.cache = cache
  memoized.clear = () => {
    cache.clear()
    timestamps.clear()
  }

  return memoized
}

/**
 * React hook for debounced values
 * @param {any} value - Value to debounce
 * @param {number} delay - Delay in milliseconds
 * @returns {any} Debounced value
 */
export function useDebounce(value, delay = PERFORMANCE_CONFIG.DEFAULT_DEBOUNCE_DELAY) {
  const [debouncedValue, setDebouncedValue] = React.useState(value)

  React.useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    return () => {
      clearTimeout(handler)
    }
  }, [value, delay])

  return debouncedValue
}

/**
 * React hook for throttled values
 * @param {any} value - Value to throttle
 * @param {number} delay - Delay in milliseconds
 * @returns {any} Throttled value
 */
export function useThrottle(value, delay = PERFORMANCE_CONFIG.DEFAULT_THROTTLE_DELAY) {
  const [throttledValue, setThrottledValue] = React.useState(value)
  const lastExecuted = React.useRef(Date.now())

  React.useEffect(() => {
    const now = Date.now()
    const timeSinceLastExecution = now - lastExecuted.current

    if (timeSinceLastExecution >= delay) {
      setThrottledValue(value)
      lastExecuted.current = now
    } else {
      const timeoutId = setTimeout(() => {
        setThrottledValue(value)
        lastExecuted.current = Date.now()
      }, delay - timeSinceLastExecution)

      return () => clearTimeout(timeoutId)
    }
  }, [value, delay])

  return throttledValue
}

/**
 * React hook for memoized callbacks
 * @param {Function} callback - Callback function
 * @param {Array} dependencies - Dependencies array
 * @returns {Function} Memoized callback
 */
export function useMemoizedCallback(callback, dependencies) {
  return React.useCallback(callback, dependencies)
}

/**
 * React hook for memoized values
 * @param {Function} factory - Value factory function
 * @param {Array} dependencies - Dependencies array
 * @returns {any} Memoized value
 */
export function useMemoizedValue(factory, dependencies) {
  return React.useMemo(factory, dependencies)
}

/**
 * Virtual scrolling utility
 */
export class VirtualScroller {
  constructor(options = {}) {
    this.itemHeight = options.itemHeight || PERFORMANCE_CONFIG.DEFAULT_ITEM_HEIGHT
    this.containerHeight = options.containerHeight || 400
    this.overscanCount = options.overscanCount || PERFORMANCE_CONFIG.OVERSCAN_COUNT
    this.items = options.items || []
    this.scrollTop = 0
  }

  /**
   * Updates scroll position
   * @param {number} scrollTop - Scroll position
   */
  updateScrollTop(scrollTop) {
    this.scrollTop = scrollTop
  }

  /**
   * Gets visible range
   * @returns {Object} Visible range
   */
  getVisibleRange() {
    const startIndex = Math.floor(this.scrollTop / this.itemHeight)
    const endIndex = Math.min(
      startIndex + Math.ceil(this.containerHeight / this.itemHeight),
      this.items.length - 1
    )

    const overscanStart = Math.max(0, startIndex - this.overscanCount)
    const overscanEnd = Math.min(this.items.length - 1, endIndex + this.overscanCount)

    return {
      startIndex: overscanStart,
      endIndex: overscanEnd,
      visibleStartIndex: startIndex,
      visibleEndIndex: endIndex
    }
  }

  /**
   * Gets total height
   * @returns {number} Total height
   */
  getTotalHeight() {
    return this.items.length * this.itemHeight
  }

  /**
   * Gets offset for item
   * @param {number} index - Item index
   * @returns {number} Offset
   */
  getOffsetForIndex(index) {
    return index * this.itemHeight
  }
}

/**
 * React hook for virtual scrolling
 * @param {Array} items - Items to virtualize
 * @param {Object} options - Virtualization options
 * @returns {Object} Virtual scrolling utilities
 */
export function useVirtualScrolling(items, options = {}) {
  const [scrollTop, setScrollTop] = React.useState(0)
  const [containerHeight, setContainerHeight] = React.useState(options.containerHeight || 400)
  
  const scroller = React.useMemo(() => new VirtualScroller({
    ...options,
    containerHeight,
    items
  }), [items, containerHeight, options])

  React.useEffect(() => {
    scroller.updateScrollTop(scrollTop)
  }, [scroller, scrollTop])

  const visibleRange = React.useMemo(() => {
    return scroller.getVisibleRange()
  }, [scroller, scrollTop])

  const visibleItems = React.useMemo(() => {
    return items.slice(visibleRange.startIndex, visibleRange.endIndex + 1)
  }, [items, visibleRange])

  const totalHeight = React.useMemo(() => {
    return scroller.getTotalHeight()
  }, [scroller])

  const handleScroll = React.useCallback((e) => {
    setScrollTop(e.target.scrollTop)
  }, [])

  const scrollToIndex = React.useCallback((index) => {
    const offset = scroller.getOffsetForIndex(index)
    setScrollTop(offset)
  }, [scroller])

  return {
    visibleItems,
    visibleRange,
    totalHeight,
    handleScroll,
    scrollToIndex,
    containerHeight,
    setContainerHeight
  }
}

/**
 * Intersection Observer utility for lazy loading
 */
export class LazyLoader {
  constructor(options = {}) {
    this.options = {
      threshold: options.threshold || PERFORMANCE_CONFIG.DEFAULT_INTERSECTION_THRESHOLD,
      rootMargin: options.rootMargin || PERFORMANCE_CONFIG.DEFAULT_ROOT_MARGIN,
      ...options
    }
    this.observer = null
    this.elements = new Map()
  }

  /**
   * Initializes intersection observer
   */
  init() {
    if (this.observer) return

    this.observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        const element = entry.target
        const callback = this.elements.get(element)
        
        if (entry.isIntersecting) {
          callback?.(element)
          this.unobserve(element)
        }
      })
    }, this.options)
  }

  /**
   * Observes element for intersection
   * @param {HTMLElement} element - Element to observe
   * @param {Function} callback - Callback function
   */
  observe(element, callback) {
    this.init()
    this.elements.set(element, callback)
    this.observer.observe(element)
  }

  /**
   * Unobserves element
   * @param {HTMLElement} element - Element to unobserve
   */
  unobserve(element) {
    if (this.observer) {
      this.observer.unobserve(element)
      this.elements.delete(element)
    }
  }

  /**
   * Destroys observer
   */
  destroy() {
    if (this.observer) {
      this.observer.disconnect()
      this.observer = null
      this.elements.clear()
    }
  }
}

/**
 * React hook for lazy loading
 * @param {Object} options - Lazy loading options
 * @returns {Object} Lazy loading utilities
 */
export function useLazyLoading(options = {}) {
  const [isVisible, setIsVisible] = React.useState(false)
  const elementRef = React.useRef(null)
  const lazyLoader = React.useRef(null)

  React.useEffect(() => {
    lazyLoader.current = new LazyLoader(options)
    
    if (elementRef.current) {
      lazyLoader.current.observe(elementRef.current, () => {
        setIsVisible(true)
      })
    }

    return () => {
      lazyLoader.current?.destroy()
    }
  }, [options])

  return {
    elementRef,
    isVisible
  }
}

/**
 * Bundle analyzer utility
 */
export class BundleAnalyzer {
  constructor() {
    this.chunks = new Map()
    this.loadedChunks = new Set()
  }

  /**
   * Analyzes bundle size
   * @param {string} chunkName - Chunk name
   * @param {number} size - Chunk size
   */
  analyzeChunk(chunkName, size) {
    this.chunks.set(chunkName, {
      size,
      loadTime: Date.now(),
      loaded: false
    })
  }

  /**
   * Marks chunk as loaded
   * @param {string} chunkName - Chunk name
   */
  markChunkLoaded(chunkName) {
    const chunk = this.chunks.get(chunkName)
    if (chunk) {
      chunk.loaded = true
      chunk.loadTime = Date.now() - chunk.loadTime
      this.loadedChunks.add(chunkName)
    }
  }

  /**
   * Gets bundle statistics
   * @returns {Object} Bundle statistics
   */
  getStats() {
    const totalSize = Array.from(this.chunks.values())
      .reduce((sum, chunk) => sum + chunk.size, 0)
    
    const loadedSize = Array.from(this.loadedChunks)
      .reduce((sum, chunkName) => {
        const chunk = this.chunks.get(chunkName)
        return sum + (chunk?.size || 0)
      }, 0)

    return {
      totalChunks: this.chunks.size,
      loadedChunks: this.loadedChunks.size,
      totalSize,
      loadedSize,
      loadPercentage: totalSize > 0 ? (loadedSize / totalSize) * 100 : 0
    }
  }
}

// Global bundle analyzer
export const bundleAnalyzer = new BundleAnalyzer()

/**
 * Performance monitoring utility
 */
export class PerformanceMonitor {
  constructor() {
    this.metrics = new Map()
    this.observers = new Map()
  }

  /**
   * Measures performance of function
   * @param {string} name - Metric name
   * @param {Function} func - Function to measure
   * @returns {any} Function result
   */
  measure(name, func) {
    const start = performance.now()
    const result = func()
    const end = performance.now()
    
    this.recordMetric(name, end - start)
    return result
  }

  /**
   * Records performance metric
   * @param {string} name - Metric name
   * @param {number} value - Metric value
   */
  recordMetric(name, value) {
    if (!this.metrics.has(name)) {
      this.metrics.set(name, [])
    }
    
    const metrics = this.metrics.get(name)
    metrics.push({
      value,
      timestamp: Date.now()
    })

    // Keep only last 100 measurements
    if (metrics.length > 100) {
      metrics.shift()
    }
  }

  /**
   * Gets performance metrics
   * @param {string} name - Metric name
   * @returns {Object} Performance metrics
   */
  getMetrics(name) {
    const metrics = this.metrics.get(name) || []
    
    if (metrics.length === 0) {
      return { count: 0, average: 0, min: 0, max: 0 }
    }

    const values = metrics.map(m => m.value)
    const sum = values.reduce((a, b) => a + b, 0)
    
    return {
      count: metrics.length,
      average: sum / metrics.length,
      min: Math.min(...values),
      max: Math.max(...values),
      latest: values[values.length - 1]
    }
  }

  /**
   * Observes performance entries
   * @param {string} type - Entry type
   * @param {Function} callback - Callback function
   */
  observe(type, callback) {
    if (this.observers.has(type)) {
      return
    }

    const observer = new PerformanceObserver((list) => {
      list.getEntries().forEach(callback)
    })

    observer.observe({ entryTypes: [type] })
    this.observers.set(type, observer)
  }

  /**
   * Gets all performance metrics
   * @returns {Object} All metrics
   */
  getAllMetrics() {
    const result = {}
    for (const [name] of this.metrics) {
      result[name] = this.getMetrics(name)
    }
    return result
  }
}

// Global performance monitor
export const performanceMonitor = new PerformanceMonitor()

/**
 * React hook for performance monitoring
 * @param {string} name - Metric name
 * @returns {Object} Performance utilities
 */
export function usePerformanceMonitoring(name) {
  const measure = React.useCallback((func) => {
    return performanceMonitor.measure(name, func)
  }, [name])

  const recordMetric = React.useCallback((value) => {
    performanceMonitor.recordMetric(name, value)
  }, [name])

  const getMetrics = React.useCallback(() => {
    return performanceMonitor.getMetrics(name)
  }, [name])

  return {
    measure,
    recordMetric,
    getMetrics
  }
}
