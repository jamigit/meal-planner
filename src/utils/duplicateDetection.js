/**
 * Smart duplicate detection and merging for shopping list items
 * Detects similar items and suggests merging options
 */

/**
 * Normalize item name for comparison
 * @param {string} name - Item name to normalize
 * @returns {string} - Normalized name
 */
function normalizeItemName(name) {
  if (!name || typeof name !== 'string') {
    return ''
  }

  return name
    .toLowerCase()
    .trim()
    // Remove common prefixes/suffixes
    .replace(/^(fresh|organic|free-range|cage-free|grass-fed|wild-caught)\s+/i, '')
    .replace(/\s+(fresh|organic|free-range|cage-free|grass-fed|wild-caught)$/i, '')
    // Remove common units and quantities
    .replace(/\b\d+\s*(lb|lbs|kg|g|oz|ml|l|cup|cups|tbsp|tsp|pound|pounds|kilogram|gram|ounce|liter|milliliter|tablespoon|teaspoon)\b/g, '')
    // Remove extra whitespace
    .replace(/\s+/g, ' ')
    .trim()
}

/**
 * Calculate similarity between two item names
 * @param {string} name1 - First item name
 * @param {string} name2 - Second item name
 * @returns {number} - Similarity score between 0 and 1
 */
function calculateSimilarity(name1, name2) {
  const norm1 = normalizeItemName(name1)
  const norm2 = normalizeItemName(name2)

  if (!norm1 || !norm2) {
    return 0
  }

  // Exact match after normalization
  if (norm1 === norm2) {
    return 1.0
  }

  // Check if one contains the other
  if (norm1.includes(norm2) || norm2.includes(norm1)) {
    return 0.8
  }

  // Levenshtein distance-based similarity
  const distance = levenshteinDistance(norm1, norm2)
  const maxLength = Math.max(norm1.length, norm2.length)
  
  if (maxLength === 0) {
    return 0
  }

  const similarity = 1 - (distance / maxLength)
  
  // Boost similarity for items with common words
  const words1 = norm1.split(' ')
  const words2 = norm2.split(' ')
  const commonWords = words1.filter(word => words2.includes(word))
  
  if (commonWords.length > 0) {
    const wordSimilarity = commonWords.length / Math.max(words1.length, words2.length)
    return Math.max(similarity, wordSimilarity * 0.7)
  }

  return similarity
}

/**
 * Calculate Levenshtein distance between two strings
 * @param {string} str1 - First string
 * @param {string} str2 - Second string
 * @returns {number} - Edit distance
 */
function levenshteinDistance(str1, str2) {
  const matrix = []
  
  for (let i = 0; i <= str2.length; i++) {
    matrix[i] = [i]
  }
  
  for (let j = 0; j <= str1.length; j++) {
    matrix[0][j] = j
  }
  
  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1]
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          matrix[i][j - 1] + 1,     // insertion
          matrix[i - 1][j] + 1      // deletion
        )
      }
    }
  }
  
  return matrix[str2.length][str1.length]
}

/**
 * Find potential duplicates for a new item
 * @param {string} newItemName - Name of the new item
 * @param {Array} existingItems - Array of existing items
 * @param {number} threshold - Similarity threshold (default: 0.7)
 * @returns {Array} - Array of potential duplicates with similarity scores
 */
export function findDuplicates(newItemName, existingItems, threshold = 0.7) {
  if (!newItemName || !existingItems || existingItems.length === 0) {
    return []
  }

  const duplicates = []

  for (const item of existingItems) {
    const similarity = calculateSimilarity(newItemName, item.name)
    
    if (similarity >= threshold) {
      duplicates.push({
        item,
        similarity,
        normalizedName: normalizeItemName(item.name)
      })
    }
  }

  // Sort by similarity (highest first)
  duplicates.sort((a, b) => b.similarity - a.similarity)

  return duplicates
}

/**
 * Suggest merge options for duplicate items
 * @param {string} newItemName - Name of the new item
 * @param {string} newItemQuantity - Quantity of the new item
 * @param {string} newItemUnit - Unit of the new item
 * @param {Object} existingItem - Existing item to merge with
 * @returns {Object} - Merge suggestion
 */
export function suggestMerge(newItemName, newItemQuantity, newItemUnit, existingItem) {
  const normalizedNew = normalizeItemName(newItemName)
  const normalizedExisting = normalizeItemName(existingItem.name)
  
  // Determine the best name to use
  let suggestedName = existingItem.name
  if (normalizedNew.length > normalizedExisting.length) {
    suggestedName = newItemName
  }

  // Combine quantities if both have them
  let suggestedQuantity = existingItem.quantity
  let suggestedUnit = existingItem.unit

  if (newItemQuantity && existingItem.quantity) {
    // Try to combine quantities if units match
    if (newItemUnit === existingItem.unit) {
      const newQty = parseFloat(newItemQuantity) || 0
      const existingQty = parseFloat(existingItem.quantity) || 0
      suggestedQuantity = (newQty + existingQty).toString()
      suggestedUnit = newItemUnit
    } else {
      // Keep both quantities with different units
      suggestedQuantity = `${existingItem.quantity} ${existingItem.unit || ''} + ${newItemQuantity} ${newItemUnit || ''}`.trim()
      suggestedUnit = null
    }
  } else if (newItemQuantity) {
    suggestedQuantity = newItemQuantity
    suggestedUnit = newItemUnit
  }

  return {
    name: suggestedName,
    quantity: suggestedQuantity,
    unit: suggestedUnit,
    category: existingItem.category,
    notes: existingItem.notes,
    // Keep the existing item's ID for updating
    id: existingItem.id
  }
}

/**
 * Check if items are likely the same product
 * @param {string} name1 - First item name
 * @param {string} name2 - Second item name
 * @returns {boolean} - True if items are likely the same
 */
export function areLikelySame(name1, name2) {
  const similarity = calculateSimilarity(name1, name2)
  return similarity >= 0.8
}

/**
 * Batch check for duplicates in a list of items
 * @param {Array} items - Array of items to check
 * @param {number} threshold - Similarity threshold
 * @returns {Array} - Array of duplicate groups
 */
export function findDuplicateGroups(items, threshold = 0.8) {
  const groups = []
  const processed = new Set()

  for (let i = 0; i < items.length; i++) {
    if (processed.has(i)) continue

    const group = [items[i]]
    processed.add(i)

    for (let j = i + 1; j < items.length; j++) {
      if (processed.has(j)) continue

      if (areLikelySame(items[i].name, items[j].name)) {
        group.push(items[j])
        processed.add(j)
      }
    }

    if (group.length > 1) {
      groups.push(group)
    }
  }

  return groups
}

export default {
  findDuplicates,
  suggestMerge,
  areLikelySame,
  findDuplicateGroups,
  normalizeItemName,
  calculateSimilarity
}
