/**
 * Unit conversion system for shopping list items
 * Handles conversion between different units of measurement
 */

// Unit conversion definitions
const UNIT_CONVERSIONS = {
  // Weight conversions (base unit: grams)
  weight: {
    g: 1,
    gram: 1,
    grams: 1,
    kg: 1000,
    kilogram: 1000,
    kilograms: 1000,
    lb: 453.592,
    lbs: 453.592,
    pound: 453.592,
    pounds: 453.592,
    oz: 28.3495,
    ounce: 28.3495,
    ounces: 28.3495
  },
  
  // Volume conversions (base unit: milliliters)
  volume: {
    ml: 1,
    milliliter: 1,
    milliliters: 1,
    l: 1000,
    liter: 1000,
    liters: 1000,
    cup: 236.588,
    cups: 236.588,
    tbsp: 14.7868,
    tablespoon: 14.7868,
    tablespoons: 14.7868,
    tsp: 4.92892,
    teaspoon: 4.92892,
    teaspoons: 4.92892,
    fl_oz: 29.5735,
    'fluid ounce': 29.5735,
    'fluid ounces': 29.5735,
    pint: 473.176,
    pints: 473.176,
    quart: 946.353,
    quarts: 946.353,
    gallon: 3785.41,
    gallons: 3785.41
  },
  
  // Length conversions (base unit: centimeters)
  length: {
    cm: 1,
    centimeter: 1,
    centimeters: 1,
    m: 100,
    meter: 100,
    meters: 100,
    in: 2.54,
    inch: 2.54,
    inches: 2.54,
    ft: 30.48,
    foot: 30.48,
    feet: 30.48
  }
}

// Unit categories for UI grouping
const UNIT_CATEGORIES = {
  weight: {
    name: 'Weight',
    icon: '⚖️',
    units: ['g', 'kg', 'lb', 'oz']
  },
  volume: {
    name: 'Volume',
    icon: '🥤',
    units: ['ml', 'l', 'cup', 'tbsp', 'tsp', 'fl oz']
  },
  length: {
    name: 'Length',
    icon: '📏',
    units: ['cm', 'm', 'in', 'ft']
  },
  count: {
    name: 'Count',
    icon: '🔢',
    units: ['piece', 'pieces', 'each', 'dozen', 'bunch', 'bag', 'box', 'can', 'jar', 'bottle']
  }
}

/**
 * Normalize unit name for comparison
 * @param {string} unit - Unit name to normalize
 * @returns {string} - Normalized unit name
 */
function normalizeUnit(unit) {
  if (!unit || typeof unit !== 'string') {
    return ''
  }
  
  return unit.toLowerCase().trim().replace(/[^a-z0-9]/g, '_')
}

/**
 * Get the category of a unit
 * @param {string} unit - Unit name
 * @returns {string|null} - Category name or null if not found
 */
export function getUnitCategory(unit) {
  const normalized = normalizeUnit(unit)
  
  for (const [category, conversions] of Object.entries(UNIT_CONVERSIONS)) {
    if (conversions[normalized] !== undefined) {
      return category
    }
  }
  
  return 'count'
}

/**
 * Convert between units
 * @param {number} value - Value to convert
 * @param {string} fromUnit - Source unit
 * @param {string} toUnit - Target unit
 * @returns {number|null} - Converted value or null if conversion not possible
 */
export function convertUnit(value, fromUnit, toUnit) {
  if (!value || !fromUnit || !toUnit) {
    return null
  }

  const fromNormalized = normalizeUnit(fromUnit)
  const toNormalized = normalizeUnit(toUnit)
  
  // If units are the same, return original value
  if (fromNormalized === toNormalized) {
    return value
  }
  
  // Check if both units are in the same category
  const fromCategory = getUnitCategory(fromUnit)
  const toCategory = getUnitCategory(toUnit)
  
  if (fromCategory !== toCategory || fromCategory === 'count') {
    return null // Cannot convert between different categories or count units
  }
  
  const conversions = UNIT_CONVERSIONS[fromCategory]
  const fromFactor = conversions[fromNormalized]
  const toFactor = conversions[toNormalized]
  
  if (fromFactor === undefined || toFactor === undefined) {
    return null
  }
  
  // Convert to base unit, then to target unit
  const baseValue = value * fromFactor
  const convertedValue = baseValue / toFactor
  
  return Math.round(convertedValue * 1000) / 1000 // Round to 3 decimal places
}

/**
 * Get suggested conversions for a unit
 * @param {string} unit - Source unit
 * @param {number} value - Value to convert
 * @returns {Array} - Array of conversion suggestions
 */
export function getConversionSuggestions(unit, value) {
  const category = getUnitCategory(unit)
  const suggestions = []
  
  if (category === 'count') {
    return suggestions // No conversions for count units
  }
  
  const conversions = UNIT_CONVERSIONS[category]
  const normalizedUnit = normalizeUnit(unit)
  const unitFactor = conversions[normalizedUnit]
  
  if (unitFactor === undefined) {
    return suggestions
  }
  
  // Get common units for this category
  const commonUnits = UNIT_CATEGORIES[category].units
  
  for (const commonUnit of commonUnits) {
    const convertedValue = convertUnit(value, unit, commonUnit)
    if (convertedValue !== null && convertedValue !== value) {
      suggestions.push({
        unit: commonUnit,
        value: convertedValue,
        displayValue: formatConvertedValue(convertedValue)
      })
    }
  }
  
  return suggestions.slice(0, 3) // Return top 3 suggestions
}

/**
 * Format converted value for display
 * @param {number} value - Value to format
 * @returns {string} - Formatted value
 */
function formatConvertedValue(value) {
  if (value >= 1000) {
    return Math.round(value).toString()
  } else if (value >= 1) {
    return value.toFixed(1)
  } else {
    return value.toFixed(2)
  }
}

/**
 * Check if two units can be converted
 * @param {string} unit1 - First unit
 * @param {string} unit2 - Second unit
 * @returns {boolean} - True if conversion is possible
 */
export function canConvertUnits(unit1, unit2) {
  const category1 = getUnitCategory(unit1)
  const category2 = getUnitCategory(unit2)
  
  return category1 === category2 && category1 !== 'count'
}

/**
 * Get all available units for a category
 * @param {string} category - Category name
 * @returns {Array} - Array of available units
 */
export function getUnitsForCategory(category) {
  if (!UNIT_CATEGORIES[category]) {
    return []
  }
  
  return UNIT_CATEGORIES[category].units
}

/**
 * Get all unit categories
 * @returns {Object} - Unit categories object
 */
export function getUnitCategories() {
  return UNIT_CATEGORIES
}

/**
 * Smart unit suggestion based on item name
 * @param {string} itemName - Name of the item
 * @returns {Array} - Suggested units
 */
export function suggestUnitsForItem(itemName) {
  if (!itemName || typeof itemName !== 'string') {
    return ['piece']
  }
  
  const name = itemName.toLowerCase()
  const suggestions = []
  
  // Weight-based items
  if (name.includes('meat') || name.includes('chicken') || name.includes('beef') || 
      name.includes('pork') || name.includes('fish') || name.includes('cheese') ||
      name.includes('butter') || name.includes('flour') || name.includes('sugar')) {
    suggestions.push('lb', 'kg', 'oz')
  }
  
  // Volume-based items
  if (name.includes('milk') || name.includes('juice') || name.includes('oil') ||
      name.includes('vinegar') || name.includes('sauce') || name.includes('broth')) {
    suggestions.push('cup', 'ml', 'fl oz')
  }
  
  // Count-based items
  if (name.includes('egg') || name.includes('apple') || name.includes('banana') ||
      name.includes('onion') || name.includes('potato') || name.includes('tomato')) {
    suggestions.push('piece', 'dozen', 'bunch')
  }
  
  // Default suggestions
  if (suggestions.length === 0) {
    suggestions.push('piece', 'cup', 'lb')
  }
  
  return suggestions.slice(0, 3)
}

export default {
  convertUnit,
  getUnitCategory,
  getConversionSuggestions,
  canConvertUnits,
  getUnitsForCategory,
  getUnitCategories,
  suggestUnitsForItem,
  UNIT_CONVERSIONS,
  UNIT_CATEGORIES
}
