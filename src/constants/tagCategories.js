// Tag categories for the meal planning system
export const TAG_CATEGORIES = {
  CUISINE: 'cuisine',
  INGREDIENTS: 'ingredients',
  CONVENIENCE: 'convenience'
}

// Predefined tag options for each category
export const CUISINE_TAGS = [
  'Italian',
  'Mexican',
  'Japanese',
  'Chinese',
  'Indian',
  'Thai',
  'Mediterranean',
  'American',
  'French',
  'Korean',
  'Vietnamese',
  'Greek',
  'Spanish',
  'Middle Eastern',
  'British',
  'German',
  'Other'
]

export const INGREDIENT_TAGS = [
  'Chicken',
  'Turkey',
  'Fish',
  'Salmon',
  'Tuna',
  'Shrimp',
  'Pasta',
  'Rice',
  'Quinoa',
  'Beans',
  'Lentils',
  'Tofu',
  'Eggs',
  'Cheese',
  'Vegetables',
  'Mushrooms',
  'Potatoes',
  'Sweet Potato',
  'Avocado',
  'Coconut',
  'Nuts',
  'Other'
]

export const CONVENIENCE_TAGS = [
  'Quick',           // Under 30 minutes total
  'Short-Prep',      // Minimal prep work
  'One-Pot',         // Single pot/pan cooking
  'Make-Ahead',      // Can be prepared in advance
  'Slow-Cooker',     // Crockpot/slow cooker recipes
  'No-Cook',         // No cooking required
  'Batch-Cook',      // Good for meal prep
  'Freezer-Friendly', // Can be frozen
  'Leftover-Friendly', // Makes good leftovers
  'Advanced',        // Complex technique/timing
  'Beginner',        // Simple to make
  'Weekend-Project', // Time-intensive but worth it
  'Gluten-Free',     // Dietary restriction
  'Vegetarian',      // Dietary restriction
  'Low-Carb',        // Dietary restriction
  'Dinner',          // Meal type
  'Lunch',           // Meal type
  'Bowl',            // Meal format
  'Other'
]

// Helper function to get all tags for a category
export const getTagsForCategory = (category) => {
  switch (category) {
    case TAG_CATEGORIES.CUISINE:
      return CUISINE_TAGS
    case TAG_CATEGORIES.INGREDIENTS:
      return INGREDIENT_TAGS
    case TAG_CATEGORIES.CONVENIENCE:
      return CONVENIENCE_TAGS
    default:
      return []
  }
}

// Helper function to get display name for category
export const getCategoryDisplayName = (category) => {
  switch (category) {
    case TAG_CATEGORIES.CUISINE:
      return 'Cuisine'
    case TAG_CATEGORIES.INGREDIENTS:
      return 'Main Ingredients'
    case TAG_CATEGORIES.CONVENIENCE:
      return 'Convenience'
    default:
      return category
  }
}

// Helper function to get category color classes
export const getCategoryColorClasses = (category) => {
  switch (category) {
    case TAG_CATEGORIES.CUISINE:
      return 'bg-blue-100 text-blue-800 border-blue-200'
    case TAG_CATEGORIES.INGREDIENTS:
      return 'bg-green-100 text-green-800 border-green-200'
    case TAG_CATEGORIES.CONVENIENCE:
      return 'bg-purple-100 text-purple-800 border-purple-200'
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200'
  }
}