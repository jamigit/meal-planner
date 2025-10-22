/**
 * AI-powered categorization service for shopping list items
 * Uses Claude AI to provide intelligent category suggestions
 */

import { claudeAiService } from '../services/claudeAiService.js'

const CATEGORY_PROMPT = `You are a helpful assistant that categorizes grocery shopping items. 

Given a shopping item name, suggest the most appropriate category from this list:
- Produce (fruits, vegetables, herbs)
- Meat & Seafood (meat, poultry, fish, seafood)
- Dairy & Eggs (milk, cheese, eggs, yogurt, butter)
- Pantry & Dry Goods (grains, pasta, rice, flour, sugar, spices, oils)
- Canned & Jarred (canned goods, jarred items, preserves)
- Frozen (frozen foods, ice cream, frozen vegetables)
- Bakery (bread, pastries, baked goods)
- Beverages (drinks, juices, sodas, coffee, tea)
- Other (items that don't fit other categories)

Respond with ONLY the category name, nothing else. Be precise and consistent.

Examples:
- "apples" → Produce
- "chicken breast" → Meat & Seafood  
- "milk" → Dairy & Eggs
- "rice" → Pantry & Dry Goods
- "canned tomatoes" → Canned & Jarred
- "frozen peas" → Frozen
- "bread" → Bakery
- "orange juice" → Beverages
- "paper towels" → Other

Item: `

/**
 * Get AI-powered category suggestion for an item
 * @param {string} itemName - Name of the item
 * @returns {Promise<string>} - Suggested category
 */
export async function getAICategorySuggestion(itemName) {
  if (!itemName || typeof itemName !== 'string' || !itemName.trim()) {
    return 'Other'
  }

  try {
    const prompt = CATEGORY_PROMPT + itemName.trim()
    const response = await claudeAiService.generateText(prompt, {
      max_tokens: 50,
      temperature: 0.1 // Low temperature for consistent categorization
    })

    if (!response || !response.text) {
      return 'Other'
    }

    const suggestedCategory = response.text.trim()
    
    // Validate that the suggestion is one of our valid categories
    const validCategories = [
      'Produce', 'Meat & Seafood', 'Dairy & Eggs', 'Pantry & Dry Goods',
      'Canned & Jarred', 'Frozen', 'Bakery', 'Beverages', 'Other'
    ]

    if (validCategories.includes(suggestedCategory)) {
      return suggestedCategory
    }

    // If AI returned something else, try to match it to our categories
    const normalizedSuggestion = suggestedCategory.toLowerCase()
    
    if (normalizedSuggestion.includes('produce') || normalizedSuggestion.includes('fruit') || normalizedSuggestion.includes('vegetable')) {
      return 'Produce'
    }
    if (normalizedSuggestion.includes('meat') || normalizedSuggestion.includes('seafood') || normalizedSuggestion.includes('chicken') || normalizedSuggestion.includes('beef')) {
      return 'Meat & Seafood'
    }
    if (normalizedSuggestion.includes('dairy') || normalizedSuggestion.includes('milk') || normalizedSuggestion.includes('cheese') || normalizedSuggestion.includes('egg')) {
      return 'Dairy & Eggs'
    }
    if (normalizedSuggestion.includes('pantry') || normalizedSuggestion.includes('grain') || normalizedSuggestion.includes('rice') || normalizedSuggestion.includes('pasta')) {
      return 'Pantry & Dry Goods'
    }
    if (normalizedSuggestion.includes('canned') || normalizedSuggestion.includes('jarred')) {
      return 'Canned & Jarred'
    }
    if (normalizedSuggestion.includes('frozen')) {
      return 'Frozen'
    }
    if (normalizedSuggestion.includes('bakery') || normalizedSuggestion.includes('bread')) {
      return 'Bakery'
    }
    if (normalizedSuggestion.includes('beverage') || normalizedSuggestion.includes('drink') || normalizedSuggestion.includes('juice')) {
      return 'Beverages'
    }

    return 'Other'
  } catch (error) {
    console.error('Failed to get AI category suggestion:', error)
    return 'Other'
  }
}

/**
 * Get AI-powered category suggestions for multiple items
 * @param {Array<string>} itemNames - Array of item names
 * @returns {Promise<Array<{item: string, category: string}>>} - Array of item-category pairs
 */
export async function getAICategorySuggestions(itemNames) {
  if (!Array.isArray(itemNames) || itemNames.length === 0) {
    return []
  }

  try {
    // Process items in batches to avoid overwhelming the AI service
    const batchSize = 5
    const results = []

    for (let i = 0; i < itemNames.length; i += batchSize) {
      const batch = itemNames.slice(i, i + batchSize)
      const batchPromises = batch.map(async (itemName) => {
        const category = await getAICategorySuggestion(itemName)
        return { item: itemName, category }
      })

      const batchResults = await Promise.all(batchPromises)
      results.push(...batchResults)

      // Add a small delay between batches to be respectful to the API
      if (i + batchSize < itemNames.length) {
        await new Promise(resolve => setTimeout(resolve, 100))
      }
    }

    return results
  } catch (error) {
    console.error('Failed to get AI category suggestions:', error)
    return itemNames.map(itemName => ({ item: itemName, category: 'Other' }))
  }
}

/**
 * Get AI-powered unit suggestions for an item
 * @param {string} itemName - Name of the item
 * @returns {Promise<Array<string>>} - Suggested units
 */
export async function getAIUnitSuggestions(itemName) {
  if (!itemName || typeof itemName !== 'string' || !itemName.trim()) {
    return ['piece']
  }

  try {
    const prompt = `You are a helpful assistant that suggests appropriate units for grocery shopping items.

Given a shopping item name, suggest 2-3 appropriate units from this list:
- Weight: g, kg, lb, oz
- Volume: ml, l, cup, tbsp, tsp, fl oz
- Count: piece, pieces, dozen, bunch, bag, box, can, jar, bottle

Respond with ONLY the unit names separated by commas, nothing else.

Examples:
- "apples" → piece, dozen, bag
- "milk" → cup, ml, l
- "chicken breast" → lb, kg, piece
- "rice" → cup, kg, lb
- "olive oil" → cup, ml, fl oz

Item: ${itemName.trim()}`

    const response = await claudeAiService.generateText(prompt, {
      max_tokens: 50,
      temperature: 0.1
    })

    if (!response || !response.text) {
      return ['piece']
    }

    const suggestedUnits = response.text.trim().split(',').map(unit => unit.trim()).filter(unit => unit)
    
    // Validate units against our known units
    const validUnits = [
      'g', 'kg', 'lb', 'oz', 'ml', 'l', 'cup', 'tbsp', 'tsp', 'fl oz',
      'piece', 'pieces', 'dozen', 'bunch', 'bag', 'box', 'can', 'jar', 'bottle'
    ]

    const filteredUnits = suggestedUnits.filter(unit => validUnits.includes(unit))
    
    return filteredUnits.length > 0 ? filteredUnits : ['piece']
  } catch (error) {
    console.error('Failed to get AI unit suggestions:', error)
    return ['piece']
  }
}

/**
 * Get comprehensive AI suggestions for an item (category + units)
 * @param {string} itemName - Name of the item
 * @returns {Promise<{category: string, units: Array<string>}>} - AI suggestions
 */
export async function getAIItemSuggestions(itemName) {
  try {
    const [category, units] = await Promise.all([
      getAICategorySuggestion(itemName),
      getAIUnitSuggestions(itemName)
    ])

    return { category, units }
  } catch (error) {
    console.error('Failed to get AI item suggestions:', error)
    return { category: 'Other', units: ['piece'] }
  }
}

export default {
  getAICategorySuggestion,
  getAICategorySuggestions,
  getAIUnitSuggestions,
  getAIItemSuggestions
}
