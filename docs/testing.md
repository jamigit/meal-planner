# Testing

## Test Framework Setup

### Vitest Configuration
**File**: `vitest.config.js`

```javascript
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/tests/setup.js'],
    globals: true
  }
})
```

### Available Test Scripts
```bash
npm run test         # Run tests in watch mode
npm run test:run     # Run tests once
npm run test:coverage # Run tests with coverage report
npm run test:ui      # Run tests with UI interface
```

### Test Setup
**File**: `src/tests/setup.js`

```javascript
import { beforeAll, afterEach } from 'vitest'
import { cleanupTestData } from './setup.js'

// Global test setup
beforeAll(async () => {
  // Initialize test environment
})

afterEach(async () => {
  await cleanupTestData()
})
```

## Mocking Strategy

### MSW (Mock Service Worker)
**File**: `src/tests/mocks/server.js`

```javascript
import { setupServer } from 'msw/node'
import { http, HttpResponse } from 'msw'

export const server = setupServer(
  // Mock Supabase API calls
  http.post('https://*.supabase.co/rest/v1/*', () => {
    return HttpResponse.json({ data: [], error: null })
  }),
  
  // Mock Claude API calls
  http.post('http://localhost:3002/api/claude', () => {
    return HttpResponse.json({
      success: true,
      data: ['Mock Recipe 1', 'Mock Recipe 2']
    })
  })
)
```

### IndexedDB Mocking
**File**: `src/tests/setup.js`

```javascript
import 'fake-indexeddb/auto'

// Clean up IndexedDB between tests
export async function cleanupTestData() {
  const dbName = `test-db-${Date.now()}`
  // Clean up test database
}
```

## Test Categories

### Unit Tests
**Location**: `src/**/__tests__/*.test.js`

#### Service Layer Tests
```javascript
// Example: recipeService.test.js
import { describe, it, expect, beforeEach } from 'vitest'
import { recipeService } from '../recipeService.js'

describe('RecipeService', () => {
  beforeEach(async () => {
    await cleanupTestData()
  })

  it('should add a recipe', async () => {
    const recipe = {
      name: 'Test Recipe',
      ingredients: ['ingredient1', 'ingredient2']
    }
    
    const result = await recipeService.add(recipe)
    expect(result.name).toBe('Test Recipe')
  })
})
```

#### Utility Function Tests
```javascript
// Example: schemaValidation.test.js
import { validateStringField, validateArrayField } from '../schemaValidation.js'

describe('Schema Validation', () => {
  it('should validate required string fields', () => {
    expect(validateStringField('test', 'name', true)).toBe('test')
    expect(() => validateStringField('', 'name', true)).toThrow()
  })
})
```

### Integration Tests
**Location**: `src/tests/integration/*.test.js`

#### Service Integration
```javascript
// Example: serviceSelector.test.js
import { serviceSelector } from '../../services/serviceSelector.js'

describe('Service Selector Integration', () => {
  it('should route to Supabase when authenticated', async () => {
    // Mock authenticated state
    const service = await serviceSelector.getRecipeService()
    expect(service.constructor.name).toBe('SupabaseRecipeService')
  })
})
```

### Component Tests
**Location**: `src/components/__tests__/*.test.js`

#### React Component Testing
```javascript
// Example: Button.test.jsx
import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import Button from '../ui/Button.jsx'

describe('Button Component', () => {
  it('should render with correct variant', () => {
    render(<Button variant="primary">Test Button</Button>)
    expect(screen.getByRole('button')).toHaveClass('btn-primary')
  })
})
```

## Test Data Management

### Test Fixtures
**File**: `src/tests/fixtures/testData.js`

```javascript
export const mockRecipes = [
  {
    id: 1,
    name: 'Test Recipe 1',
    ingredients: ['ingredient1', 'ingredient2'],
    cuisine_tags: ['Italian'],
    created_at: '2025-01-01T00:00:00Z'
  },
  {
    id: 2,
    name: 'Test Recipe 2',
    ingredients: ['ingredient3', 'ingredient4'],
    cuisine_tags: ['Asian'],
    created_at: '2025-01-02T00:00:00Z'
  }
]

export const mockWeeklyPlans = [
  {
    id: 1,
    meals: [
      { recipe_id: 1, servings: 2 },
      { recipe_id: 2, servings: 4 }
    ],
    is_current: true,
    created_at: '2025-01-01T00:00:00Z'
  }
]
```

### Test Database Setup
```javascript
// Setup test database with fixtures
async function setupTestDatabase() {
  const db = getDatabase()
  await db.recipes.bulkAdd(mockRecipes)
  await db.weeklyPlans.bulkAdd(mockWeeklyPlans)
}
```

## Testing Patterns

### Service Testing Pattern
```javascript
describe('ServiceName', () => {
  beforeEach(async () => {
    await cleanupTestData()
    await setupTestDatabase()
  })

  describe('getAll()', () => {
    it('should return all records', async () => {
      const results = await service.getAll()
      expect(results).toHaveLength(2)
    })
  })

  describe('add()', () => {
    it('should add new record', async () => {
      const newRecord = { name: 'New Record' }
      const result = await service.add(newRecord)
      expect(result.name).toBe('New Record')
    })

    it('should validate required fields', async () => {
      await expect(service.add({})).rejects.toThrow('Validation failed')
    })
  })
})
```

### Component Testing Pattern
```javascript
describe('ComponentName', () => {
  const defaultProps = {
    // Default props for testing
  }

  it('should render correctly', () => {
    render(<ComponentName {...defaultProps} />)
    expect(screen.getByText('Expected Text')).toBeInTheDocument()
  })

  it('should handle user interactions', async () => {
    render(<ComponentName {...defaultProps} />)
    const button = screen.getByRole('button')
    await user.click(button)
    expect(screen.getByText('Updated Text')).toBeInTheDocument()
  })
})
```

## Test Coverage

### Coverage Goals
- **Services**: 90%+ coverage for all service methods
- **Utilities**: 100% coverage for validation and helper functions
- **Components**: 80%+ coverage for user interactions
- **Integration**: Critical user flows covered

### Coverage Commands
```bash
# Run tests with coverage
npm run test:coverage

# Coverage report
npm run test:coverage -- --reporter=html
```

## Running Tests

### Development Testing
```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run specific test file
npm test recipeService.test.js

# Run tests matching pattern
npm test -- --grep "should add"
```

### CI/CD Testing
```bash
# Run tests in CI
npm run test:ci

# Run tests with coverage for CI
npm run test:coverage:ci
```

## Test Best Practices

### Do's ✅
- Use descriptive test names that explain the scenario
- Test both success and error cases
- Mock external dependencies (APIs, IndexedDB)
- Clean up test data between tests
- Use fixtures for consistent test data
- Test edge cases and boundary conditions

### Don'ts ❌
- Don't test implementation details
- Don't create tests that depend on other tests
- Don't use real API calls in tests
- Don't skip cleanup between tests
- Don't write tests that are too complex

### Test Organization
```
src/
├── components/
│   └── __tests__/
│       ├── Button.test.jsx
│       └── RecipeForm.test.jsx
├── services/
│   └── __tests__/
│       ├── recipeService.test.js
│       └── aiMealPlannerService.test.js
├── utils/
│   └── __tests__/
│       ├── schemaValidation.test.js
│       └── security.test.js
└── tests/
    ├── setup.js
    ├── fixtures/
    │   └── testData.js
    └── mocks/
        └── server.js
```
