import Dexie from 'dexie'

// Database using IndexedDB via Dexie
class MealPlannerDB extends Dexie {
  constructor() {
    super('MealPlannerDB')

    this.version(1).stores({
      recipes: '++id, name, url, tags, created_at, updated_at',
      weeklyPlans: '++id, meal_ids, notes, is_current, created_at',
      mealHistory: '++id, recipe_id, week_date, eaten_date, created_at'
    })

    // Version 2: Add ingredients, instructions, prep_time, cook_time, servings
    this.version(2).stores({
      recipes: '++id, name, url, tags, ingredients, instructions, prep_time, cook_time, servings, created_at, updated_at',
      weeklyPlans: '++id, meal_ids, notes, is_current, created_at',
      mealHistory: '++id, recipe_id, week_date, eaten_date, created_at'
    })

    // Version 3: Add shopping lists
    this.version(3).stores({
      recipes: '++id, name, url, tags, ingredients, instructions, prep_time, cook_time, servings, created_at, updated_at',
      weeklyPlans: '++id, meal_ids, notes, is_current, created_at',
      mealHistory: '++id, recipe_id, week_date, eaten_date, created_at',
      shoppingLists: '++id, weekly_plan_id, items, created_at'
    })

    // Version 4: Update weeklyPlans to store meal objects with scaling instead of just IDs
    this.version(4).stores({
      recipes: '++id, name, url, tags, ingredients, instructions, prep_time, cook_time, servings, created_at, updated_at',
      weeklyPlans: '++id, meals, notes, is_current, created_at',
      mealHistory: '++id, recipe_id, week_date, eaten_date, created_at',
      shoppingLists: '++id, weekly_plan_id, items, created_at'
    })

    // Version 6: Fix is_current to use boolean instead of integer and add name
    this.version(6).stores({
      recipes: '++id, name, url, tags, cuisine_tags, ingredient_tags, convenience_tags, ingredients, instructions, prep_time, cook_time, servings, created_at, updated_at',
      weeklyPlans: '++id, meals, notes, name, is_current, created_at',
      mealHistory: '++id, recipe_id, week_date, eaten_date, created_at',
      shoppingLists: '++id, weekly_plan_id, items, created_at'
    }).upgrade(tx => {
      // Migrate is_current from integer (0/1) to boolean (true/false)
      return tx.weeklyPlans.toCollection().modify(plan => {
        if (typeof plan.is_current === 'number') {
          plan.is_current = plan.is_current === 1
        }
        // Add name field if it doesn't exist
        if (plan.name === undefined) {
          plan.name = null
        }
      })
    })

    // Version 7: Ensure all data is properly migrated
    this.version(7).stores({
      recipes: '++id, name, url, tags, cuisine_tags, ingredient_tags, convenience_tags, ingredients, instructions, prep_time, cook_time, servings, created_at, updated_at',
      weeklyPlans: '++id, meals, notes, name, is_current, created_at',
      mealHistory: '++id, recipe_id, week_date, eaten_date, created_at',
      shoppingLists: '++id, weekly_plan_id, items, created_at'
    })

    // Version 8: Force migration with explicit data conversion
    this.version(8).stores({
      recipes: '++id, name, url, tags, cuisine_tags, ingredient_tags, convenience_tags, ingredients, instructions, prep_time, cook_time, servings, created_at, updated_at',
      weeklyPlans: '++id, meals, notes, name, is_current, created_at',
      mealHistory: '++id, recipe_id, week_date, eaten_date, created_at',
      shoppingLists: '++id, weekly_plan_id, items, created_at'
    }).upgrade(tx => {
      console.log('Running Version 8 migration...')
      // Explicitly convert all is_current values to boolean
      return tx.weeklyPlans.toCollection().modify(plan => {
        console.log('Migrating plan:', plan.id, 'is_current:', plan.is_current, 'type:', typeof plan.is_current)
        if (typeof plan.is_current === 'number') {
          plan.is_current = plan.is_current === 1
          console.log('Converted to boolean:', plan.is_current)
        }
        // Ensure name field exists
        if (plan.name === undefined) {
          plan.name = null
        }
      })
    })

    // Version 9: Add persistent shopping list tables
    this.version(9).stores({
      recipes: '++id, name, url, tags, cuisine_tags, ingredient_tags, convenience_tags, ingredients, instructions, prep_time, cook_time, servings, created_at, updated_at',
      weeklyPlans: '++id, meals, notes, name, is_current, created_at',
      mealHistory: '++id, recipe_id, week_date, eaten_date, created_at',
      shoppingLists: '++id, weekly_plan_id, items, created_at',
      persistentShoppingLists: '++id, name, created_at, updated_at',
      persistentShoppingListItems: '++id, shopping_list_id, name, quantity, unit, category, checked, checked_at, notes, created_at, updated_at'
    })

    // Version 10: Add sort_order to shopping list items
    this.version(10).stores({
      recipes: '++id, name, url, tags, cuisine_tags, ingredient_tags, convenience_tags, ingredients, instructions, prep_time, cook_time, servings, created_at, updated_at',
      weeklyPlans: '++id, meals, notes, name, is_current, created_at',
      mealHistory: '++id, recipe_id, week_date, eaten_date, created_at',
      shoppingLists: '++id, weekly_plan_id, items, created_at',
      persistentShoppingLists: '++id, name, created_at, updated_at',
      persistentShoppingListItems: '++id, shopping_list_id, name, quantity, unit, category, checked, checked_at, notes, sort_order, created_at, updated_at'
    })

    // Version 11: Add meal_role to shopping list items
    this.version(11).stores({
      recipes: '++id, name, url, tags, cuisine_tags, ingredient_tags, convenience_tags, ingredients, instructions, prep_time, cook_time, servings, created_at, updated_at',
      weeklyPlans: '++id, meals, notes, name, is_current, created_at',
      mealHistory: '++id, recipe_id, week_date, eaten_date, created_at',
      shoppingLists: '++id, weekly_plan_id, items, created_at',
      persistentShoppingLists: '++id, name, created_at, updated_at',
      persistentShoppingListItems: '++id, shopping_list_id, name, quantity, unit, category, checked, checked_at, notes, sort_order, meal_role, created_at, updated_at'
    })
  }
}

// Create database instance
export const db = new MealPlannerDB()

// Initialize database
export async function initDatabase() {
  try {
    await db.open()
    console.log('Connected to IndexedDB database')
    console.log('Database version:', db.verno)
    return db
  } catch (error) {
    console.error('Failed to initialize database:', error)
    throw error
  }
}

// Get database instance
export function getDatabase() {
  return db
}

// Close database connection
export async function closeDatabase() {
  try {
    await db.close()
    console.log('Database connection closed')
  } catch (error) {
    console.error('Failed to close database:', error)
  }
}

// Helper functions for JSON handling (kept for compatibility)
export function serializeJSON(data) {
  return data || []
}

export function deserializeJSON(data) {
  return data || []
}