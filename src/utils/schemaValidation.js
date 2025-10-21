/**
 * @fileoverview Runtime schema validation utilities for data normalization
 * 
 * These utilities ensure data consistency across IndexedDB and Supabase
 * by validating and normalizing data according to the canonical schema.
 */

/**
 * Validates and normalizes a Recipe object
 * @param {Object} recipe - Raw recipe data
 * @returns {Object} Normalized recipe object
 * @throws {Error} If required fields are missing or invalid
 */
export function validateRecipe(recipe) {
  if (!recipe) {
    throw new Error('Recipe data is required')
  }

  if (!recipe.name || typeof recipe.name !== 'string' || recipe.name.trim() === '') {
    throw new Error('Recipe name is required and must be a non-empty string')
  }

  return {
    id: recipe.id || null,
    name: recipe.name.trim(),
    url: recipe.url && typeof recipe.url === 'string' ? recipe.url.trim() : null,
    tags: Array.isArray(recipe.tags) ? recipe.tags.filter(tag => typeof tag === 'string' && tag.trim()) : [],
    cuisine_tags: Array.isArray(recipe.cuisine_tags) ? recipe.cuisine_tags.filter(tag => typeof tag === 'string' && tag.trim()) : [],
    ingredient_tags: Array.isArray(recipe.ingredient_tags) ? recipe.ingredient_tags.filter(tag => typeof tag === 'string' && tag.trim()) : [],
    convenience_tags: Array.isArray(recipe.convenience_tags) ? recipe.convenience_tags.filter(tag => typeof tag === 'string' && tag.trim()) : [],
    ingredients: Array.isArray(recipe.ingredients) ? recipe.ingredients.filter(ing => typeof ing === 'string' && ing.trim()) : [],
    instructions: Array.isArray(recipe.instructions) ? recipe.instructions.filter(inst => typeof inst === 'string' && inst.trim()) : [],
    prep_time: typeof recipe.prep_time === 'number' && recipe.prep_time > 0 ? recipe.prep_time : null,
    cook_time: typeof recipe.cook_time === 'number' && recipe.cook_time > 0 ? recipe.cook_time : null,
    servings: typeof recipe.servings === 'number' && recipe.servings > 0 ? recipe.servings : null,
    created_at: recipe.created_at || new Date().toISOString(),
    updated_at: recipe.updated_at || new Date().toISOString()
  }
}

/**
 * Validates and normalizes a WeeklyPlan object
 * @param {Object} plan - Raw weekly plan data
 * @returns {Object} Normalized weekly plan object
 * @throws {Error} If required fields are missing or invalid
 */
export function validateWeeklyPlan(plan) {
  if (!plan) {
    throw new Error('Weekly plan data is required')
  }

  if (!Array.isArray(plan.meals)) {
    throw new Error('Weekly plan meals must be an array')
  }

  if (plan.meals.length > 4) {
    throw new Error('Weekly plan cannot have more than 4 meals')
  }

  // Validate each meal has required fields
  const validatedMeals = plan.meals.map(meal => {
    if (!meal.id || typeof meal.id !== 'number') {
      throw new Error('Each meal must have a valid recipe ID')
    }
    if (!meal.name || typeof meal.name !== 'string') {
      throw new Error('Each meal must have a valid name')
    }
    return {
      id: meal.id,
      name: meal.name.trim(),
      url: meal.url && typeof meal.url === 'string' ? meal.url.trim() : null,
      tags: Array.isArray(meal.tags) ? meal.tags : [],
      cuisine_tags: Array.isArray(meal.cuisine_tags) ? meal.cuisine_tags : [],
      ingredient_tags: Array.isArray(meal.ingredient_tags) ? meal.ingredient_tags : [],
      convenience_tags: Array.isArray(meal.convenience_tags) ? meal.convenience_tags : [],
      ingredients: Array.isArray(meal.ingredients) ? meal.ingredients : [],
      instructions: Array.isArray(meal.instructions) ? meal.instructions : [],
      prep_time: typeof meal.prep_time === 'number' ? meal.prep_time : null,
      cook_time: typeof meal.cook_time === 'number' ? meal.cook_time : null,
      servings: typeof meal.servings === 'number' ? meal.servings : null,
      scaling: typeof meal.scaling === 'number' && meal.scaling > 0 ? meal.scaling : 1
    }
  })

  return {
    id: plan.id || null,
    meals: validatedMeals,
    notes: typeof plan.notes === 'string' ? plan.notes.trim() : '',
    name: typeof plan.name === 'string' ? plan.name.trim() : null,
    is_current: Boolean(plan.is_current),
    created_at: plan.created_at || new Date().toISOString()
  }
}

/**
 * Validates and normalizes a MealHistory object
 * @param {Object} history - Raw meal history data
 * @returns {Object} Normalized meal history object
 * @throws {Error} If required fields are missing or invalid
 */
export function validateMealHistory(history) {
  if (!history) {
    throw new Error('Meal history data is required')
  }

  if (!history.recipe_id || typeof history.recipe_id !== 'number') {
    throw new Error('Recipe ID is required and must be a number')
  }

  if (!history.eaten_date || typeof history.eaten_date !== 'string') {
    throw new Error('Eaten date is required and must be a string')
  }

  // Validate date format (YYYY-MM-DD)
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/
  if (!dateRegex.test(history.eaten_date)) {
    throw new Error('Eaten date must be in YYYY-MM-DD format')
  }

  // Calculate week_date if not provided
  let week_date = history.week_date
  if (!week_date || typeof week_date !== 'string') {
    week_date = getWeekStartDate(history.eaten_date)
  }

  if (!dateRegex.test(week_date)) {
    throw new Error('Week date must be in YYYY-MM-DD format')
  }

  return {
    id: history.id || null,
    recipe_id: history.recipe_id,
    week_date: week_date,
    eaten_date: history.eaten_date,
    created_at: history.created_at || new Date().toISOString()
  }
}

/**
 * Gets the Monday of the week for a given date
 * @param {string} dateString - Date in YYYY-MM-DD format
 * @returns {string} Monday date in YYYY-MM-DD format
 */
export function getWeekStartDate(dateString) {
  const date = new Date(dateString)
  const day = date.getDay()
  const diff = date.getDate() - day + (day === 0 ? -6 : 1) // Adjust when day is Sunday
  date.setDate(diff)
  return date.toISOString().split('T')[0]
}

/**
 * Validates that an array field is properly formatted
 * @param {*} value - Value to validate
 * @param {string} fieldName - Name of the field for error messages
 * @returns {Array} Normalized array
 */
export function validateArrayField(value, fieldName) {
  if (value === null || value === undefined) {
    return []
  }
  if (!Array.isArray(value)) {
    console.warn(`${fieldName} is not an array, converting to empty array`)
    return []
  }
  return value.filter(item => typeof item === 'string' && item.trim())
}

/**
 * Validates that a numeric field is properly formatted
 * @param {*} value - Value to validate
 * @param {string} fieldName - Name of the field for error messages
 * @returns {number|null} Normalized number or null
 */
export function validateNumericField(value, fieldName) {
  if (value === null || value === undefined || value === '') {
    return null
  }
  const num = typeof value === 'string' ? parseInt(value, 10) : value
  if (typeof num !== 'number' || isNaN(num) || num <= 0) {
    console.warn(`${fieldName} is not a valid positive number, setting to null`)
    return null
  }
  return num
}

/**
 * Validates that a boolean field is properly formatted
 * @param {*} value - Value to validate
 * @param {string} fieldName - Name of the field for error messages
 * @returns {boolean} Normalized boolean
 */
export function validateBooleanField(value, fieldName) {
  if (typeof value === 'boolean') {
    return value
  }
  if (typeof value === 'number') {
    return value !== 0
  }
  if (typeof value === 'string') {
    return value.toLowerCase() === 'true' || value === '1'
  }
  console.warn(`${fieldName} is not a valid boolean, defaulting to false`)
  return false
}

/**
 * Validates that a string field is properly formatted
 * @param {*} value - Value to validate
 * @param {string} fieldName - Name of the field for error messages
 * @param {boolean} required - Whether the field is required
 * @returns {string|null} Normalized string or null
 */
export function validateStringField(value, fieldName, required = false) {
  if (value === null || value === undefined || value === '') {
    if (required) {
      throw new Error(`${fieldName} is required`)
    }
    return null
  }
  if (typeof value !== 'string') {
    console.warn(`${fieldName} is not a string, converting to string`)
    return String(value).trim()
  }
  const trimmed = value.trim()
  if (required && trimmed === '') {
    throw new Error(`${fieldName} cannot be empty`)
  }
  return trimmed || null
}
