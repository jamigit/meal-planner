/**
 * @fileoverview Test fixtures and mock data for the Meal Planner application
 * 
 * This file provides reusable test data for recipes, weekly plans, meal history,
 * and other entities used throughout the test suite.
 */

/**
 * Sample recipes for testing
 */
export const testRecipes = [
  {
    id: 1,
    name: 'Chicken Parmesan',
    url: 'https://example.com/chicken-parmesan',
    tags: ['italian', 'chicken', 'comfort-food'],
    cuisine_tags: ['Italian'],
    ingredient_tags: ['Chicken', 'Cheese'],
    convenience_tags: ['Comfort Food'],
    ingredients: [
      '4 chicken breasts',
      '1 cup breadcrumbs',
      '1/2 cup parmesan cheese',
      '2 eggs',
      '1 cup marinara sauce',
      '1 cup mozzarella cheese'
    ],
    instructions: [
      'Preheat oven to 400°F',
      'Pound chicken breasts to even thickness',
      'Dip chicken in beaten eggs, then breadcrumbs',
      'Fry chicken until golden brown',
      'Top with marinara and mozzarella',
      'Bake for 15 minutes until cheese melts'
    ],
    prep_time: 20,
    cook_time: 30,
    servings: 4,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z'
  },
  {
    id: 2,
    name: 'Thai Green Curry',
    url: 'https://example.com/thai-green-curry',
    tags: ['thai', 'spicy', 'coconut'],
    cuisine_tags: ['Thai'],
    ingredient_tags: ['Chicken', 'Coconut'],
    convenience_tags: ['Spicy', 'One-Pot'],
    ingredients: [
      '1 lb chicken breast',
      '1 can coconut milk',
      '2 tbsp green curry paste',
      '1 bell pepper',
      '1 onion',
      '1 cup jasmine rice'
    ],
    instructions: [
      'Cook rice according to package directions',
      'Cut chicken into bite-sized pieces',
      'Heat curry paste in large pot',
      'Add coconut milk and bring to simmer',
      'Add chicken and vegetables',
      'Simmer 15 minutes until chicken is cooked'
    ],
    prep_time: 15,
    cook_time: 25,
    servings: 3,
    created_at: '2024-01-02T00:00:00Z',
    updated_at: '2024-01-02T00:00:00Z'
  },
  {
    id: 3,
    name: 'Quick Pasta Salad',
    url: null,
    tags: ['quick', 'vegetarian', 'cold'],
    cuisine_tags: ['Italian'],
    ingredient_tags: ['Pasta', 'Vegetables'],
    convenience_tags: ['Quick', 'Cold', 'Vegetarian'],
    ingredients: [
      '1 lb pasta',
      '1 cucumber',
      '2 tomatoes',
      '1/2 red onion',
      '1/2 cup olive oil',
      '2 tbsp vinegar'
    ],
    instructions: [
      'Cook pasta according to package directions',
      'Dice vegetables',
      'Mix olive oil and vinegar for dressing',
      'Combine pasta, vegetables, and dressing',
      'Chill for at least 1 hour'
    ],
    prep_time: 10,
    cook_time: 10,
    servings: 6,
    created_at: '2024-01-03T00:00:00Z',
    updated_at: '2024-01-03T00:00:00Z'
  },
  {
    id: 4,
    name: 'Fish Tacos',
    url: 'https://example.com/fish-tacos',
    tags: ['mexican', 'fish', 'healthy'],
    cuisine_tags: ['Mexican'],
    ingredient_tags: ['Fish'],
    convenience_tags: ['Healthy', 'Quick'],
    ingredients: [
      '1 lb white fish fillets',
      '8 corn tortillas',
      '1 avocado',
      '1 lime',
      '1/2 head cabbage',
      '1/2 cup sour cream'
    ],
    instructions: [
      'Season fish with salt and pepper',
      'Cook fish in pan until flaky',
      'Warm tortillas',
      'Slice avocado and cabbage',
      'Assemble tacos with fish and toppings',
      'Serve with lime wedges'
    ],
    prep_time: 15,
    cook_time: 15,
    servings: 4,
    created_at: '2024-01-04T00:00:00Z',
    updated_at: '2024-01-04T00:00:00Z'
  },
  {
    id: 5,
    name: 'Vegetarian Stir Fry',
    url: null,
    tags: ['vegetarian', 'asian', 'healthy'],
    cuisine_tags: ['Asian'],
    ingredient_tags: ['Vegetables', 'Tofu'],
    convenience_tags: ['Vegetarian', 'Healthy', 'Quick'],
    ingredients: [
      '1 block tofu',
      '2 bell peppers',
      '1 broccoli head',
      '2 carrots',
      '3 cloves garlic',
      '1/4 cup soy sauce'
    ],
    instructions: [
      'Press and cube tofu',
      'Cut vegetables into bite-sized pieces',
      'Heat oil in large pan',
      'Cook tofu until golden',
      'Add vegetables and stir fry',
      'Add sauce and cook until vegetables are tender'
    ],
    prep_time: 20,
    cook_time: 15,
    servings: 3,
    created_at: '2024-01-05T00:00:00Z',
    updated_at: '2024-01-05T00:00:00Z'
  }
]

/**
 * Sample weekly plans for testing
 */
export const testWeeklyPlans = [
  {
    id: 1,
    meals: [
      {
        ...testRecipes[0], // Chicken Parmesan
        scaling: 1
      },
      {
        ...testRecipes[1], // Thai Green Curry
        scaling: 1.5
      },
      {
        ...testRecipes[2], // Quick Pasta Salad
        scaling: 1
      },
      {
        ...testRecipes[3], // Fish Tacos
        scaling: 1
      }
    ],
    notes: 'This week focuses on variety with different cuisines',
    name: 'Variety Week',
    is_current: true,
    created_at: '2024-01-08T00:00:00Z'
  },
  {
    id: 2,
    meals: [
      {
        ...testRecipes[0], // Chicken Parmesan
        scaling: 2
      },
      {
        ...testRecipes[4], // Vegetarian Stir Fry
        scaling: 1
      }
    ],
    notes: 'Simple week with comfort food',
    name: 'Comfort Food Week',
    is_current: false,
    created_at: '2024-01-01T00:00:00Z'
  },
  {
    id: 3,
    meals: [],
    notes: '',
    name: null,
    is_current: false,
    created_at: '2024-01-15T00:00:00Z'
  }
]

/**
 * Sample meal history for testing
 */
export const testMealHistory = [
  {
    id: 1,
    recipe_id: 1, // Chicken Parmesan
    week_date: '2024-01-01', // Monday
    eaten_date: '2024-01-01',
    created_at: '2024-01-01T18:00:00Z'
  },
  {
    id: 2,
    recipe_id: 1, // Chicken Parmesan (eaten again)
    week_date: '2024-01-08',
    eaten_date: '2024-01-08',
    created_at: '2024-01-08T18:00:00Z'
  },
  {
    id: 3,
    recipe_id: 1, // Chicken Parmesan (eaten again)
    week_date: '2024-01-15',
    eaten_date: '2024-01-15',
    created_at: '2024-01-15T18:00:00Z'
  },
  {
    id: 4,
    recipe_id: 2, // Thai Green Curry
    week_date: '2024-01-01',
    eaten_date: '2024-01-02',
    created_at: '2024-01-02T18:00:00Z'
  },
  {
    id: 5,
    recipe_id: 2, // Thai Green Curry (eaten again)
    week_date: '2024-01-08',
    eaten_date: '2024-01-09',
    created_at: '2024-01-09T18:00:00Z'
  },
  {
    id: 6,
    recipe_id: 3, // Quick Pasta Salad
    week_date: '2024-01-15',
    eaten_date: '2024-01-16',
    created_at: '2024-01-16T18:00:00Z'
  },
  {
    id: 7,
    recipe_id: 4, // Fish Tacos
    week_date: '2024-01-15',
    eaten_date: '2024-01-17',
    created_at: '2024-01-17T18:00:00Z'
  },
  {
    id: 8,
    recipe_id: 5, // Vegetarian Stir Fry
    week_date: '2024-01-22',
    eaten_date: '2024-01-22',
    created_at: '2024-01-22T18:00:00Z'
  }
]

/**
 * Sample meal history with recipe details
 */
export const testMealHistoryWithRecipes = testMealHistory.map(entry => ({
  ...entry,
  recipe: testRecipes.find(recipe => recipe.id === entry.recipe_id)
}))

/**
 * Sample recipe frequency data (for AI analysis testing)
 */
export const testRecipeFrequency = {
  1: 3, // Chicken Parmesan eaten 3 times
  2: 2, // Thai Green Curry eaten 2 times
  3: 1, // Quick Pasta Salad eaten 1 time
  4: 1, // Fish Tacos eaten 1 time
  5: 1  // Vegetarian Stir Fry eaten 1 time
}

/**
 * Sample recipe categorization (for AI analysis testing)
 */
export const testRecipeCategorization = {
  regular: [
    { ...testRecipes[0], frequency: 3 }, // Chicken Parmesan
    { ...testRecipes[1], frequency: 2 }  // Thai Green Curry
  ],
  lessRegular: [
    { ...testRecipes[2], frequency: 1 }, // Quick Pasta Salad
    { ...testRecipes[3], frequency: 1 }, // Fish Tacos
    { ...testRecipes[4], frequency: 1 }  // Vegetarian Stir Fry
  ]
}

/**
 * Sample shopping list items (for shopping list testing)
 */
export const testShoppingListItems = [
  {
    ingredient: 'chicken breasts',
    amount: '4',
    unit: 'pieces',
    recipes: ['Chicken Parmesan']
  },
  {
    ingredient: 'breadcrumbs',
    amount: '1',
    unit: 'cup',
    recipes: ['Chicken Parmesan']
  },
  {
    ingredient: 'parmesan cheese',
    amount: '1/2',
    unit: 'cup',
    recipes: ['Chicken Parmesan']
  },
  {
    ingredient: 'coconut milk',
    amount: '1',
    unit: 'can',
    recipes: ['Thai Green Curry']
  },
  {
    ingredient: 'green curry paste',
    amount: '2',
    unit: 'tbsp',
    recipes: ['Thai Green Curry']
  }
]

/**
 * Sample AI suggestions (for AI testing)
 */
export const testAISuggestions = [
  {
    id: 'suggestion-1',
    meals: [
      { id: 1, name: 'Chicken Parmesan', reasoning: 'Your most popular recipe' },
      { id: 2, name: 'Thai Green Curry', reasoning: 'Good variety from Italian' },
      { id: 3, name: 'Quick Pasta Salad', reasoning: 'Light and refreshing' },
      { id: 4, name: 'Fish Tacos', reasoning: 'Healthy protein option' }
    ],
    explanation: 'This selection balances your favorites with variety and includes healthy options.'
  },
  {
    id: 'suggestion-2',
    meals: [
      { id: 1, name: 'Chicken Parmesan', reasoning: 'Comfort food favorite' },
      { id: 5, name: 'Vegetarian Stir Fry', reasoning: 'Healthy vegetarian option' },
      { id: 2, name: 'Thai Green Curry', reasoning: 'Spicy and flavorful' },
      { id: 3, name: 'Quick Pasta Salad', reasoning: 'Quick and easy' }
    ],
    explanation: 'This selection focuses on comfort foods with one healthy vegetarian option.'
  },
  {
    id: 'suggestion-3',
    meals: [
      { id: 4, name: 'Fish Tacos', reasoning: 'Light and healthy' },
      { id: 5, name: 'Vegetarian Stir Fry', reasoning: 'Vegetarian protein' },
      { id: 3, name: 'Quick Pasta Salad', reasoning: 'Cold and refreshing' },
      { id: 2, name: 'Thai Green Curry', reasoning: 'Warm and spicy' }
    ],
    explanation: 'This selection emphasizes healthy, lighter meals with good variety.'
  }
]

/**
 * Helper functions for creating test data
 */

/**
 * Creates a test recipe with optional overrides
 * @param {Object} overrides - Properties to override
 * @returns {Object} Test recipe
 */
export function createTestRecipe(overrides = {}) {
  return {
    ...testRecipes[0],
    ...overrides
  }
}

/**
 * Creates a test weekly plan with optional overrides
 * @param {Object} overrides - Properties to override
 * @returns {Object} Test weekly plan
 */
export function createTestWeeklyPlan(overrides = {}) {
  return {
    ...testWeeklyPlans[0],
    ...overrides
  }
}

/**
 * Creates a test meal history entry with optional overrides
 * @param {Object} overrides - Properties to override
 * @returns {Object} Test meal history entry
 */
export function createTestMealHistory(overrides = {}) {
  return {
    ...testMealHistory[0],
    ...overrides
  }
}

/**
 * Creates a test user for authentication testing
 * @param {Object} overrides - Properties to override
 * @returns {Object} Test user
 */
export function createTestUser(overrides = {}) {
  return {
    id: 'test-user-id',
    email: 'test@example.com',
    created_at: '2024-01-01T00:00:00Z',
    ...overrides
  }
}

/**
 * Creates a test session for authentication testing
 * @param {Object} overrides - Properties to override
 * @returns {Object} Test session
 */
export function createTestSession(overrides = {}) {
  return {
    access_token: 'test-access-token',
    token_type: 'bearer',
    expires_in: 3600,
    refresh_token: 'test-refresh-token',
    user: createTestUser(),
    ...overrides
  }
}
