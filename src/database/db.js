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
  }
}

// Create database instance
export const db = new MealPlannerDB()

// Initialize database
export async function initDatabase() {
  try {
    await db.open()
    console.log('Connected to IndexedDB database')
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