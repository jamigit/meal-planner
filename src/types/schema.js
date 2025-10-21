/**
 * @fileoverview Shared schema definitions for the Meal Planner application
 * 
 * This file defines the canonical data structures used across both IndexedDB
 * and Supabase storage backends. All services should implement these interfaces
 * to ensure consistency and prevent schema drift.
 */

/**
 * @typedef {Object} Recipe
 * @property {number} id - Unique identifier (auto-generated)
 * @property {string} name - Recipe name (required)
 * @property {string|null} url - Optional recipe URL
 * @property {string[]} tags - Legacy tags array (for backwards compatibility)
 * @property {string[]} cuisine_tags - Cuisine type tags (Italian, Thai, etc.)
 * @property {string[]} ingredient_tags - Main ingredient tags (Chicken, Fish, etc.)
 * @property {string[]} convenience_tags - Convenience tags (Quick, Beginner, etc.)
 * @property {string[]} ingredients - List of ingredients
 * @property {string[]} instructions - Step-by-step cooking instructions
 * @property {number|null} prep_time - Preparation time in minutes
 * @property {number|null} cook_time - Cooking time in minutes
 * @property {number|null} servings - Number of servings
 * @property {string} created_at - ISO timestamp when created
 * @property {string} updated_at - ISO timestamp when last modified
 */

/**
 * @typedef {Object} MealWithScaling
 * @property {number} id - Recipe ID
 * @property {string} name - Recipe name
 * @property {string|null} url - Recipe URL
 * @property {string[]} tags - All tags (legacy + categorized)
 * @property {string[]} cuisine_tags - Cuisine tags
 * @property {string[]} ingredient_tags - Ingredient tags
 * @property {string[]} convenience_tags - Convenience tags
 * @property {string[]} ingredients - Ingredients list
 * @property {string[]} instructions - Cooking instructions
 * @property {number|null} prep_time - Prep time in minutes
 * @property {number|null} cook_time - Cook time in minutes
 * @property {number|null} servings - Number of servings
 * @property {number} scaling - Scaling factor (default: 1)
 */

/**
 * @typedef {Object} WeeklyPlan
 * @property {number} id - Unique identifier (auto-generated)
 * @property {MealWithScaling[]} meals - Array of selected recipes with scaling (max 4)
 * @property {string} notes - Optional notes about meal preferences
 * @property {string|null} name - Optional custom name for the plan
 * @property {boolean} is_current - Whether this is the active plan
 * @property {string} created_at - ISO timestamp when created
 */

/**
 * @typedef {Object} MealHistory
 * @property {number} id - Unique identifier (auto-generated)
 * @property {number} recipe_id - Reference to recipe ID
 * @property {string} week_date - YYYY-MM-DD format (Monday of the week)
 * @property {string} eaten_date - YYYY-MM-DD format (actual consumption date)
 * @property {string} created_at - ISO timestamp when created
 */

/**
 * @typedef {Object} MealHistoryWithRecipe
 * @property {number} id - History entry ID
 * @property {number} recipe_id - Recipe ID
 * @property {string} week_date - Week start date
 * @property {string} eaten_date - Actual eaten date
 * @property {string} created_at - Creation timestamp
 * @property {Recipe} recipe - Full recipe object
 */

/**
 * @typedef {Object} RecipeFrequency
 * @property {number} [recipeId] - Number of times recipe was eaten in last 8 weeks
 */

/**
 * @typedef {Object} RecipeCategorization
 * @property {Recipe[]} regular - Recipes eaten 3+ times in last 8 weeks
 * @property {Recipe[]} lessRegular - Recipes eaten 0-2 times in last 8 weeks
 */

/**
 * @typedef {Object} WeeklyPlanWithRecipes
 * @property {number} id - Plan ID
 * @property {MealWithScaling[]} meals - Meals with full recipe data
 * @property {string} notes - Plan notes
 * @property {string|null} name - Plan name
 * @property {boolean} is_current - Is current plan
 * @property {string} created_at - Creation timestamp
 */

/**
 * @typedef {Object} ServiceResponse
 * @property {boolean} success - Whether the operation succeeded
 * @property {string|null} error - Error message if operation failed
 * @property {*} data - Response data (type depends on operation)
 */

/**
 * @typedef {Object} DatabaseStatistics
 * @property {number} totalEntries - Total number of entries
 * @property {number} uniqueRecipes - Number of unique recipes
 * @property {number} regularRecipes - Number of regular recipes (3+ times)
 * @property {number} lessRegularRecipes - Number of less regular recipes (0-2 times)
 * @property {number} averageFrequency - Average frequency across all recipes
 */

// Export types for use in other files
export {
  // Types are exported via JSDoc comments above
  // Individual exports not needed for JSDoc types
}
