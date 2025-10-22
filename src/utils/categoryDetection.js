/**
 * Automatic category detection for shopping list items
 * Analyzes item names and suggests appropriate categories
 */

// Category keywords mapping
const CATEGORY_KEYWORDS = {
  'Produce': [
    'apple', 'banana', 'orange', 'lemon', 'lime', 'grape', 'strawberry', 'blueberry', 'raspberry',
    'lettuce', 'spinach', 'kale', 'arugula', 'cabbage', 'broccoli', 'cauliflower', 'carrot',
    'potato', 'onion', 'garlic', 'tomato', 'cucumber', 'pepper', 'bell pepper', 'jalapeño',
    'avocado', 'mushroom', 'herbs', 'basil', 'parsley', 'cilantro', 'mint', 'thyme', 'rosemary',
    'celery', 'radish', 'beet', 'corn', 'peas', 'beans', 'squash', 'zucchini', 'eggplant',
    'fruit', 'vegetable', 'organic', 'fresh'
  ],
  'Meat & Seafood': [
    'chicken', 'beef', 'pork', 'lamb', 'turkey', 'duck', 'ham', 'bacon', 'sausage',
    'fish', 'salmon', 'tuna', 'cod', 'halibut', 'shrimp', 'crab', 'lobster', 'scallops',
    'ground beef', 'ground turkey', 'steak', 'chops', 'ribs', 'wings', 'breast', 'thigh',
    'meat', 'seafood', 'protein', 'fresh fish', 'frozen fish'
  ],
  'Dairy & Eggs': [
    'milk', 'cheese', 'eggs', 'yogurt', 'butter', 'cream', 'sour cream', 'cottage cheese',
    'mozzarella', 'cheddar', 'parmesan', 'feta', 'goat cheese', 'cream cheese', 'ricotta',
    'heavy cream', 'half and half', 'buttermilk', 'dairy', 'organic milk', 'almond milk',
    'oat milk', 'soy milk', 'coconut milk'
  ],
  'Pantry & Dry Goods': [
    'rice', 'pasta', 'noodles', 'bread', 'flour', 'sugar', 'salt', 'pepper', 'spices',
    'olive oil', 'vegetable oil', 'coconut oil', 'vinegar', 'balsamic', 'soy sauce',
    'cereal', 'oats', 'quinoa', 'barley', 'lentils', 'beans', 'chickpeas', 'nuts',
    'almonds', 'walnuts', 'peanuts', 'cashews', 'seeds', 'sunflower seeds', 'chia seeds',
    'crackers', 'chips', 'snacks', 'granola', 'honey', 'maple syrup', 'jam', 'jelly'
  ],
  'Canned & Jarred': [
    'canned', 'jarred', 'tomato sauce', 'pasta sauce', 'soup', 'broth', 'stock',
    'canned beans', 'canned corn', 'canned tomatoes', 'pickles', 'olives', 'salsa',
    'pesto', 'tahini', 'peanut butter', 'almond butter', 'preserves', 'marinara'
  ],
  'Frozen': [
    'frozen', 'ice cream', 'frozen vegetables', 'frozen fruit', 'frozen berries',
    'frozen pizza', 'frozen meals', 'frozen chicken', 'frozen fish', 'frozen shrimp',
    'frozen yogurt', 'sorbet', 'frozen waffles', 'frozen french fries'
  ],
  'Bakery': [
    'bread', 'bagels', 'croissants', 'muffins', 'donuts', 'pastries', 'cake', 'cookies',
    'pie', 'tart', 'rolls', 'buns', 'loaf', 'fresh bread', 'artisan bread'
  ],
  'Beverages': [
    'water', 'juice', 'soda', 'coffee', 'tea', 'beer', 'wine', 'sparkling water',
    'sports drink', 'energy drink', 'coconut water', 'kombucha', 'smoothie'
  ]
}

/**
 * Detect category for an item based on its name
 * @param {string} itemName - The name of the item
 * @returns {string} - The detected category
 */
export function detectCategory(itemName) {
  if (!itemName || typeof itemName !== 'string') {
    return 'Other'
  }

  const normalizedName = itemName.toLowerCase().trim()
  
  // Check each category for keyword matches
  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    for (const keyword of keywords) {
      if (normalizedName.includes(keyword.toLowerCase())) {
        return category
      }
    }
  }

  // Additional pattern matching for common cases
  if (normalizedName.includes('fresh') || normalizedName.includes('organic')) {
    // If it contains "fresh" or "organic", it's likely produce
    return 'Produce'
  }

  if (normalizedName.includes('frozen')) {
    return 'Frozen'
  }

  if (normalizedName.includes('canned') || normalizedName.includes('jarred')) {
    return 'Canned & Jarred'
  }

  if (normalizedName.includes('bread') || normalizedName.includes('bakery')) {
    return 'Bakery'
  }

  if (normalizedName.includes('drink') || normalizedName.includes('beverage')) {
    return 'Beverages'
  }

  // Default fallback
  return 'Other'
}

/**
 * Get confidence score for category detection
 * @param {string} itemName - The name of the item
 * @param {string} detectedCategory - The detected category
 * @returns {number} - Confidence score between 0 and 1
 */
export function getCategoryConfidence(itemName, detectedCategory) {
  if (!itemName || !detectedCategory || detectedCategory === 'Other') {
    return 0.1
  }

  const normalizedName = itemName.toLowerCase().trim()
  const keywords = CATEGORY_KEYWORDS[detectedCategory] || []
  
  let matches = 0
  let totalKeywords = keywords.length
  
  for (const keyword of keywords) {
    if (normalizedName.includes(keyword.toLowerCase())) {
      matches++
    }
  }

  // Calculate confidence based on keyword matches
  const baseConfidence = matches / totalKeywords
  
  // Boost confidence for exact matches or very specific keywords
  if (normalizedName === detectedCategory.toLowerCase()) {
    return 1.0
  }
  
  if (matches > 0) {
    return Math.min(0.9, baseConfidence + 0.3)
  }
  
  return 0.1
}

/**
 * Suggest alternative categories for an item
 * @param {string} itemName - The name of the item
 * @returns {Array} - Array of {category, confidence} objects sorted by confidence
 */
export function suggestCategories(itemName) {
  if (!itemName || typeof itemName !== 'string') {
    return [{ category: 'Other', confidence: 0.1 }]
  }

  const suggestions = []
  
  for (const category of Object.keys(CATEGORY_KEYWORDS)) {
    const confidence = getCategoryConfidence(itemName, category)
    if (confidence > 0.1) {
      suggestions.push({ category, confidence })
    }
  }

  // Sort by confidence (highest first)
  suggestions.sort((a, b) => b.confidence - a.confidence)
  
  // Always include 'Other' as fallback
  if (suggestions.length === 0 || suggestions[0].confidence < 0.5) {
    suggestions.push({ category: 'Other', confidence: 0.1 })
  }

  return suggestions.slice(0, 3) // Return top 3 suggestions
}

/**
 * Batch detect categories for multiple items
 * @param {Array} items - Array of item names
 * @returns {Array} - Array of {item, category, confidence} objects
 */
export function batchDetectCategories(items) {
  return items.map(item => {
    const category = detectCategory(item)
    const confidence = getCategoryConfidence(item, category)
    return { item, category, confidence }
  })
}

export default {
  detectCategory,
  getCategoryConfidence,
  suggestCategories,
  batchDetectCategories,
  CATEGORY_KEYWORDS
}
