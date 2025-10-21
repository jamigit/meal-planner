/**
 * @fileoverview Test setup configuration for Vitest
 * 
 * This file configures the testing environment, mocks, and global utilities
 * needed for testing the meal planner application.
 */

import '@testing-library/jest-dom'
import { beforeAll, afterEach, afterAll } from 'vitest'
import { server } from './mocks/server.js'

// Mock IndexedDB for testing
import 'fake-indexeddb/auto'

// Mock Supabase client
import { vi } from 'vitest'

// Global test utilities
global.vi = vi

// Mock console methods to reduce noise in tests
global.console = {
  ...console,
  log: vi.fn(),
  debug: vi.fn(),
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn()
}

// Mock window.matchMedia (used by some UI libraries)
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(), // deprecated
    removeListener: vi.fn(), // deprecated
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
})

// Mock IntersectionObserver
global.IntersectionObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}))

// Mock ResizeObserver
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}))

// Mock fetch globally
global.fetch = vi.fn()

// Setup MSW (Mock Service Worker) for API mocking
beforeAll(() => {
  server.listen({ onUnhandledRequest: 'error' })
})

afterEach(() => {
  server.resetHandlers()
  // Clear all mocks after each test
  vi.clearAllMocks()
})

afterAll(() => {
  server.close()
})

// Mock environment variables
vi.mock('import.meta.env', () => ({
  VITE_SUPABASE_URL: 'https://test.supabase.co',
  VITE_SUPABASE_ANON_KEY: 'test-anon-key',
  VITE_CLAUDE_API_KEY: 'test-claude-key'
}))

// Mock Supabase client
vi.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      getUser: vi.fn(),
      signInWithPassword: vi.fn(),
      signOut: vi.fn(),
      onAuthStateChange: vi.fn()
    },
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn(),
      order: vi.fn().mockReturnThis()
    }))
  },
  isSupabaseConfigured: vi.fn(() => true)
}))

// Mock auth service
vi.mock('@/services/authService', () => ({
  authService: {
    getCurrentUser: vi.fn(),
    signIn: vi.fn(),
    signOut: vi.fn(),
    isAuthenticated: vi.fn(() => true),
    getUserId: vi.fn(() => 'test-user-id'),
    onAuthStateChange: vi.fn()
  }
}))

// Test data cleanup utility
export async function cleanupTestData() {
  // Clear IndexedDB with unique database name for each test
  if (typeof indexedDB !== 'undefined') {
    try {
      // Generate unique database name for this test run
      const testDbName = `MealPlannerDB_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      
      await new Promise((resolve, reject) => {
        const deleteReq = indexedDB.deleteDatabase('MealPlannerDB')
        deleteReq.onsuccess = () => resolve()
        deleteReq.onerror = () => reject(deleteReq.error)
        deleteReq.onblocked = () => {
          // If blocked, wait a bit and try again
          setTimeout(() => {
            indexedDB.deleteDatabase('MealPlannerDB')
            resolve()
          }, 100)
        }
      })
      
      // Also try to delete any test databases
      await new Promise((resolve) => {
        const deleteTestReq = indexedDB.deleteDatabase(testDbName)
        deleteTestReq.onsuccess = () => resolve()
        deleteTestReq.onerror = () => resolve() // Ignore errors for test DBs
        deleteTestReq.onblocked = () => resolve()
      })
    } catch (error) {
      console.warn('Failed to delete IndexedDB:', error)
    }
  }
  
  // Clear localStorage
  localStorage.clear()
  sessionStorage.clear()
  
  // Reset all mocks
  vi.clearAllMocks()
}

// Helper to create test user
export function createTestUser(overrides = {}) {
  return {
    id: 'test-user-id',
    email: 'test@example.com',
    ...overrides
  }
}

// Helper to create test recipe
export function createTestRecipe(overrides = {}) {
  return {
    id: 1,
    name: 'Test Recipe',
    url: 'https://example.com/recipe',
    tags: ['test'],
    cuisine_tags: ['Italian'],
    ingredient_tags: ['Chicken'],
    convenience_tags: ['Quick'],
    ingredients: ['1 chicken breast'],
    instructions: ['Cook the chicken'],
    prep_time: 10,
    cook_time: 20,
    servings: 2,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    ...overrides
  }
}

// Helper to create test weekly plan
export function createTestWeeklyPlan(overrides = {}) {
  return {
    id: 1,
    meals: [createTestRecipe()],
    notes: 'Test plan notes',
    name: 'Test Plan',
    is_current: true,
    created_at: '2024-01-01T00:00:00Z',
    ...overrides
  }
}

// Helper to create test meal history
export function createTestMealHistory(overrides = {}) {
  return {
    id: 1,
    recipe_id: 1,
    week_date: '2024-01-01',
    eaten_date: '2024-01-01',
    created_at: '2024-01-01T00:00:00Z',
    ...overrides
  }
}
