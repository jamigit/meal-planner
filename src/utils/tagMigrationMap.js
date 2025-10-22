/**
 * @fileoverview Tag migration mapping for taxonomy restructure
 * 
 * Maps old tags to new broader categories for migration from 74→51 tags.
 * Handles consolidation, renaming, and removal of tags.
 */

export const TAG_MIGRATION_MAP = {
  cuisine_tags: {
    // Consolidate Asian cuisines
    'Thai': 'Asian',
    'Chinese': 'Asian',
    'Japanese': 'Asian',
    'Korean': 'Asian',
    'Vietnamese': 'Asian',
    
    // Consolidate Mediterranean cuisines
    'Greek': 'Mediterranean',
    'Spanish': 'Mediterranean',
    'Middle Eastern': 'Mediterranean',
    
    // Consolidate European cuisines
    'British': 'European',
    'German': 'European',
    
    // Keep existing broad categories
    'Italian': 'Italian',
    'Mexican': 'Mexican',
    'American': 'American',
    'Indian': 'Indian',
    'French': 'French',
    'Caribbean': 'Caribbean',
    
    // Add new broad categories
    'Latin American': 'Latin American',
    'Other': null  // Remove generic "Other"
  },
  
  ingredient_tags: {
    // Consolidate seafood
    'Fish': 'Seafood',
    'Salmon': 'Seafood',
    'Tuna': 'Seafood',
    'Shrimp': 'Seafood',
    
    // Consolidate poultry
    'Turkey': 'Chicken',
    
    // Consolidate grains
    'Quinoa': 'Grains',
    'Nuts': 'Grains',  // Could be debated, but fits better here
    
    // Consolidate vegetables
    'Potatoes': 'Vegetable',
    'Sweet Potato': 'Vegetable',
    'Mushrooms': 'Vegetable',
    'Vegetables': 'Vegetable',  // Normalize
    
    // Keep existing broad categories
    'Chicken': 'Chicken',
    'Beef': 'Beef',
    'Pork': 'Pork',
    'Pasta': 'Pasta',
    'Rice': 'Rice',
    'Beans': 'Beans',
    'Lentils': 'Beans',  // Group with beans
    'Tofu': 'Tofu',
    'Eggs': 'Egg',
    'Cheese': 'Vegetarian',  // Move to vegetarian category
    'Avocado': 'Vegetable',
    'Coconut': 'Vegetable',
    
    // Add new dish-type categories
    'Soup': 'Soup',
    'Salad': 'Salad',
    'Sandwich': 'Sandwich',
    
    'Other': null  // Remove generic "Other"
  },
  
  convenience_tags: {
    // Consolidate time-based tags
    'Short-Prep': 'Easy',
    'Beginner': 'Easy',
    
    // Consolidate meal prep tags
    'Batch-Cook': 'Meal-Prep',
    'Leftover-Friendly': 'Make-Ahead',
    
    // Consolidate cooking methods
    'Advanced': null,  // Remove (too subjective)
    'Weekend-Project': null,  // Remove (too specific)
    'Baked': 'Oven-Baked',
    
    // Remove meal-type tags (not convenience)
    'Dinner': null,
    'Lunch': null,
    'Bowl': null,
    
    // Keep existing broad categories
    'Quick': 'Quick',
    'One-Pot': 'One-Pot',
    'Make-Ahead': 'Make-Ahead',
    'Slow-Cooker': 'Slow-Cooker',
    'No-Cook': 'No-Cook',
    'Freezer-Friendly': 'Freezer-Friendly',
    'Gluten-Free': 'Gluten-Free',  // Will move to dietary_tags
    'Vegetarian': 'Vegetarian',    // Will move to dietary_tags
    'Low-Carb': 'Low-Carb',       // Will move to dietary_tags
    
    // Add new categories
    'Easy': 'Easy',
    'Instant-Pot': 'Instant-Pot',
    'Meal-Prep': 'Meal-Prep',
    'Budget-Friendly': 'Budget-Friendly',
    'Oven-Baked': 'Oven-Baked',
    'Stovetop': 'Stovetop',
    'Grilled': 'Grilled',
    'Comfort-Food': 'Comfort-Food',
    
    'Other': null  // Remove generic "Other"
  },
  
  dietary_tags: {
    // This is a new category, will receive transfers from convenience_tags
    'Gluten-Free': 'Gluten-Free',
    'Dairy-Free': 'Dairy-Free',
    'Vegan': 'Vegan',
    'Vegetarian': 'Vegetarian',
    'Low-Carb': 'Low-Carb',
    'High-Protein': 'High-Protein',
    'Keto': 'Keto',
    'Paleo': 'Paleo',
    'Healthy': 'Healthy',
    'Light': 'Light',
    'Spicy': 'Spicy',
    'Kid-Friendly': 'Kid-Friendly'
  }
}

/**
 * Get migration mapping for a specific category
 * @param {string} category - The tag category
 * @returns {Object} Mapping object for the category
 */
export const getMigrationMapForCategory = (category) => {
  return TAG_MIGRATION_MAP[category] || {}
}

/**
 * Check if a tag should be migrated
 * @param {string} category - The tag category
 * @param {string} oldTag - The old tag name
 * @returns {string|null} New tag name or null if should be removed
 */
export const getMigrationTarget = (category, oldTag) => {
  const categoryMap = getMigrationMapForCategory(category)
  return categoryMap[oldTag] || null
}

/**
 * Get all tags that should be removed (mapped to null)
 * @param {string} category - The tag category
 * @returns {string[]} Array of tags to remove
 */
export const getTagsToRemove = (category) => {
  const categoryMap = getMigrationMapForCategory(category)
  return Object.entries(categoryMap)
    .filter(([_, newTag]) => newTag === null)
    .map(([oldTag, _]) => oldTag)
}

/**
 * Get all tags that should be consolidated into a target tag
 * @param {string} category - The tag category
 * @param {string} targetTag - The target tag to consolidate into
 * @returns {string[]} Array of source tags
 */
export const getTagsToConsolidate = (category, targetTag) => {
  const categoryMap = getMigrationMapForCategory(category)
  return Object.entries(categoryMap)
    .filter(([_, newTag]) => newTag === targetTag)
    .map(([oldTag, _]) => oldTag)
}

/**
 * Check if a tag needs migration
 * @param {string} category - The tag category
 * @param {string} tag - The tag name
 * @returns {boolean} True if tag needs migration
 */
export const needsMigration = (category, tag) => {
  const categoryMap = getMigrationMapForCategory(category)
  return tag in categoryMap
}

/**
 * Get migration statistics
 * @returns {Object} Migration statistics
 */
export const getMigrationStats = () => {
  const stats = {
    totalMappings: 0,
    consolidations: 0,
    removals: 0,
    byCategory: {}
  }
  
  Object.entries(TAG_MIGRATION_MAP).forEach(([category, mappings]) => {
    const categoryStats = {
      mappings: Object.keys(mappings).length,
      consolidations: Object.values(mappings).filter(v => v !== null).length,
      removals: Object.values(mappings).filter(v => v === null).length
    }
    
    stats.totalMappings += categoryStats.mappings
    stats.consolidations += categoryStats.consolidations
    stats.removals += categoryStats.removals
    stats.byCategory[category] = categoryStats
  })
  
  return stats
}
