/**
 * @fileoverview Restructured recipe tag taxonomy
 * 
 * This file defines the new, broader tag taxonomy for the meal planning system.
 * Tags are organized into 4 categories with 51 total tags (reduced from 74).
 * Each tag represents a broader, more usable category.
 */

export const TAG_TAXONOMY = {
  cuisine_tags: [
    'Italian',
    'Asian',           // Consolidates Chinese, Japanese, Korean, Thai, Vietnamese
    'Mexican',
    'Mediterranean',   // Consolidates Greek, Spanish, Middle Eastern
    'American',
    'Indian',
    'French',
    'Caribbean',
    'Latin American',  // Broader than just Mexican
    'European'         // Consolidates British, German, etc.
  ],
  ingredient_tags: [
    'Chicken',
    'Beef',
    'Pork',
    'Seafood',         // Consolidates Fish, Salmon, Tuna, Shrimp
    'Vegetarian',      // No meat, but may have dairy/eggs
    'Vegetable',       // Vegetable-focused dishes
    'Pasta',
    'Rice',
    'Soup',            // Soup-based dishes
    'Salad',           // Salad-based dishes
    'Sandwich',        // Sandwich/wrap based
    'Egg',             // Egg-focused (breakfast, frittata, etc.)
    'Beans',           // Bean/legume based
    'Grains',          // Quinoa, couscous, farro, etc.
    'Tofu'             // Tofu-based
  ],
  convenience_tags: [
    'Quick',              // Under 30 minutes total
    'Easy',               // Simple preparation
    'One-Pot',            // Single pot/pan
    'Slow-Cooker',
    'Instant-Pot',
    'No-Cook',
    'Make-Ahead',         // Can be prepared in advance
    'Freezer-Friendly',
    'Meal-Prep',          // Good for batch cooking
    'Budget-Friendly',
    'Oven-Baked',         // Oven-based cooking
    'Stovetop',           // Stovetop cooking
    'Grilled',            // Grilling
    'Comfort-Food'        // Comfort food category
  ],
  dietary_tags: [
    'Gluten-Free',
    'Dairy-Free',
    'Vegan',              // No animal products at all
    'Vegetarian',         // No meat, but may have dairy/eggs
    'Low-Carb',           // Low carbohydrate
    'High-Protein',
    'Keto',               // Keto-friendly
    'Paleo',
    'Healthy',            // Health-focused, balanced
    'Light',              // Lower calorie/lighter fare
    'Spicy',              // Spicy dishes
    'Kid-Friendly'        // Good for children
  ]
}

// Backward compatibility exports
export const CUISINE_TAGS = TAG_TAXONOMY.cuisine_tags
export const INGREDIENT_TAGS = TAG_TAXONOMY.ingredient_tags
export const CONVENIENCE_TAGS = TAG_TAXONOMY.convenience_tags
export const DIETARY_TAGS = TAG_TAXONOMY.dietary_tags

// Helper functions
export const getTagsForCategory = (category) => {
  return TAG_TAXONOMY[category] || []
}

export const getAllTags = () => {
  return {
    cuisine_tags: [...TAG_TAXONOMY.cuisine_tags],
    ingredient_tags: [...TAG_TAXONOMY.ingredient_tags],
    convenience_tags: [...TAG_TAXONOMY.convenience_tags],
    dietary_tags: [...TAG_TAXONOMY.dietary_tags]
  }
}

export const getCategoryDisplayName = (category) => {
  // Handle both 'cuisine' and 'cuisine_tags' formats
  const categoryKey = category.includes('_tags') ? category : `${category}_tags`
  
  const names = {
    cuisine_tags: 'Cuisine',
    ingredient_tags: 'Main Ingredients',
    convenience_tags: 'Convenience',
    dietary_tags: 'Dietary'
  }
  return names[categoryKey] || category
}

export const getCategoryColorClasses = (category) => {
  // Handle both 'cuisine' and 'cuisine_tags' formats
  const categoryKey = category.includes('_tags') ? category : `${category}_tags`
  
  const colors = {
    cuisine_tags: 'bg-blue-100 text-blue-800 border-blue-200',
    ingredient_tags: 'bg-green-100 text-green-800 border-green-200',
    convenience_tags: 'bg-purple-100 text-purple-800 border-purple-200',
    dietary_tags: 'bg-orange-100 text-orange-800 border-orange-200'
  }
  return colors[categoryKey] || 'bg-gray-100 text-gray-800 border-gray-200'
}

export const validateTag = (category, tagName) => {
  return TAG_TAXONOMY[category]?.includes(tagName) || false
}

export const getTotalTagCount = () => {
  return Object.values(TAG_TAXONOMY).reduce((total, tags) => total + tags.length, 0)
}

// Tag statistics
export const TAG_STATS = {
  total: getTotalTagCount(),
  byCategory: {
    cuisine_tags: TAG_TAXONOMY.cuisine_tags.length,
    ingredient_tags: TAG_TAXONOMY.ingredient_tags.length,
    convenience_tags: TAG_TAXONOMY.convenience_tags.length,
    dietary_tags: TAG_TAXONOMY.dietary_tags.length
  }
}
