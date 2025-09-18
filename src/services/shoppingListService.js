import { getDatabase } from '../database/db.js'
import { recipeService } from '../database/recipeService.js'

class ShoppingListService {
  constructor() {
    this.db = getDatabase()

    // Common pantry items to exclude
    this.pantryItems = [
      'salt', 'pepper', 'black pepper', 'white pepper', 'garlic powder', 'onion powder',
      'olive oil', 'vegetable oil', 'canola oil', 'cooking oil', 'oil', 'butter',
      'flour', 'all-purpose flour', 'sugar', 'brown sugar', 'white sugar',
      'baking powder', 'baking soda', 'vanilla extract', 'vanilla', 'water'
    ]

    // Ingredient categories for grouping
    this.categories = {
      'Produce': ['onion', 'garlic', 'tomato', 'lettuce', 'cucumber', 'bell pepper', 'pepper', 'carrot', 'celery', 'potato', 'lemon', 'lime', 'orange', 'apple', 'banana', 'spinach', 'basil', 'parsley', 'cilantro', 'dill', 'thyme', 'oregano', 'rosemary', 'ginger', 'avocado', 'mushroom', 'zucchini', 'broccoli', 'cauliflower'],
      'Meat & Seafood': ['chicken', 'beef', 'pork', 'turkey', 'salmon', 'fish', 'shrimp', 'ground turkey', 'ground beef', 'chicken breast', 'chicken thigh', 'bacon', 'ham'],
      'Dairy & Eggs': ['milk', 'cheese', 'yogurt', 'cream', 'sour cream', 'heavy cream', 'eggs', 'egg', 'butter', 'mozzarella', 'cheddar', 'parmesan', 'feta'],
      'Pantry & Dry Goods': ['rice', 'pasta', 'bread', 'flour', 'sugar', 'honey', 'vinegar', 'soy sauce', 'olive oil', 'coconut oil', 'beans', 'lentils', 'quinoa', 'oats', 'nuts', 'almonds', 'pine nuts'],
      'Canned & Jarred': ['tomatoes', 'coconut milk', 'broth', 'stock', 'olives', 'capers', 'sauce', 'paste'],
      'Frozen': ['frozen'],
      'Other': []
    }
  }

  // Parse ingredient string to extract quantity, unit, and item
  parseIngredient(ingredientStr) {
    const original = ingredientStr.trim()

    // Basic regex to extract quantity, unit, and ingredient
    const patterns = [
      // "2 cups flour" or "1/2 cup milk"
      /^(\d+(?:\/\d+)?(?:\.\d+)?)\s+([a-z]+)\s+(.+)$/i,
      // "2 tablespoons olive oil"
      /^(\d+(?:\/\d+)?(?:\.\d+)?)\s+(tablespoons?|tbsp|teaspoons?|tsp|cups?|lbs?|pounds?|ounces?|oz|cloves?|slices?)\s+(.+)$/i,
      // "4 chicken thighs" (number + item)
      /^(\d+(?:\/\d+)?(?:\.\d+)?)\s+(.+)$/i,
      // Just the ingredient without quantity
      /^(.+)$/
    ]

    for (const pattern of patterns) {
      const match = ingredientStr.match(pattern)
      if (match) {
        if (match.length === 4) {
          return {
            quantity: this.parseQuantity(match[1]),
            unit: match[2].toLowerCase(),
            item: match[3].toLowerCase().trim(),
            original
          }
        } else if (match.length === 3) {
          return {
            quantity: this.parseQuantity(match[1]),
            unit: '',
            item: match[2].toLowerCase().trim(),
            original
          }
        } else {
          return {
            quantity: null,
            unit: '',
            item: match[1].toLowerCase().trim(),
            original
          }
        }
      }
    }

    return {
      quantity: null,
      unit: '',
      item: original.toLowerCase().trim(),
      original
    }
  }

  // Convert fractions and mixed numbers to decimals
  parseQuantity(qtyStr) {
    if (!qtyStr) return null

    // Handle fractions like "1/2", "1/4", "3/4"
    if (qtyStr.includes('/')) {
      const parts = qtyStr.split('/')
      if (parts.length === 2) {
        return parseFloat(parts[0]) / parseFloat(parts[1])
      }
    }

    return parseFloat(qtyStr)
  }

  // Determine ingredient category
  categorizeIngredient(item) {
    const lowerItem = item.toLowerCase()

    for (const [category, keywords] of Object.entries(this.categories)) {
      if (category === 'Other') continue

      for (const keyword of keywords) {
        if (lowerItem.includes(keyword)) {
          return category
        }
      }
    }

    return 'Other'
  }

  // Check if ingredient should be excluded (pantry item)
  isPantryItem(item) {
    const lowerItem = item.toLowerCase()
    return this.pantryItems.some(pantryItem =>
      lowerItem.includes(pantryItem) || pantryItem.includes(lowerItem)
    )
  }

  // Consolidate ingredients with same item name
  consolidateIngredients(parsedIngredients) {
    const consolidated = new Map()

    for (const ingredient of parsedIngredients) {
      const key = ingredient.item

      if (consolidated.has(key)) {
        const existing = consolidated.get(key)

        // Combine quantities if units are compatible
        if (this.areUnitsCompatible(existing.unit, ingredient.unit)) {
          const convertedQty = this.convertToBaseUnit(ingredient.quantity, ingredient.unit, existing.unit)
          existing.quantity += convertedQty
          existing.sources.push({
            recipe: ingredient.recipe,
            original: ingredient.original,
            quantity: ingredient.quantity,
            unit: ingredient.unit
          })
        } else {
          // Different units, keep separate entries
          existing.sources.push({
            recipe: ingredient.recipe,
            original: ingredient.original,
            quantity: ingredient.quantity,
            unit: ingredient.unit
          })
        }
      } else {
        consolidated.set(key, {
          item: ingredient.item,
          quantity: ingredient.quantity,
          unit: ingredient.unit,
          category: this.categorizeIngredient(ingredient.item),
          sources: [{
            recipe: ingredient.recipe,
            original: ingredient.original,
            quantity: ingredient.quantity,
            unit: ingredient.unit
          }]
        })
      }
    }

    return Array.from(consolidated.values())
  }

  // Check if two units can be combined
  areUnitsCompatible(unit1, unit2) {
    const volumeUnits = ['cup', 'cups', 'tablespoon', 'tablespoons', 'tbsp', 'teaspoon', 'teaspoons', 'tsp', 'ml', 'liter', 'liters']
    const weightUnits = ['lb', 'lbs', 'pound', 'pounds', 'oz', 'ounce', 'ounces', 'gram', 'grams', 'kg']
    const countUnits = ['', 'piece', 'pieces', 'clove', 'cloves', 'slice', 'slices']

    const isVolume1 = volumeUnits.includes(unit1)
    const isVolume2 = volumeUnits.includes(unit2)
    const isWeight1 = weightUnits.includes(unit1)
    const isWeight2 = weightUnits.includes(unit2)
    const isCount1 = countUnits.includes(unit1)
    const isCount2 = countUnits.includes(unit2)

    return (isVolume1 && isVolume2) || (isWeight1 && isWeight2) || (isCount1 && isCount2)
  }

  // Convert between compatible units (basic conversions)
  convertToBaseUnit(quantity, fromUnit, toUnit) {
    if (!quantity || fromUnit === toUnit) return quantity

    // Volume conversions (to cups)
    const volumeConversions = {
      'teaspoon': 1/48, 'tsp': 1/48,
      'tablespoon': 1/16, 'tbsp': 1/16,
      'cup': 1, 'cups': 1
    }

    // Weight conversions (to ounces)
    const weightConversions = {
      'ounce': 1, 'ounces': 1, 'oz': 1,
      'pound': 16, 'pounds': 16, 'lb': 16, 'lbs': 16
    }

    if (volumeConversions[fromUnit] && volumeConversions[toUnit]) {
      return quantity * volumeConversions[fromUnit] / volumeConversions[toUnit]
    }

    if (weightConversions[fromUnit] && weightConversions[toUnit]) {
      return quantity * weightConversions[fromUnit] / weightConversions[toUnit]
    }

    return quantity
  }

  // Format quantity for display
  formatQuantity(quantity, unit) {
    if (!quantity) return ''

    // Convert decimals to fractions for common cooking measurements
    const fractions = {
      0.25: '1/4',
      0.33: '1/3',
      0.5: '1/2',
      0.67: '2/3',
      0.75: '3/4'
    }

    const rounded = Math.round(quantity * 100) / 100

    // Check for common fractions
    for (const [decimal, fraction] of Object.entries(fractions)) {
      if (Math.abs(rounded - decimal) < 0.01) {
        return `${fraction} ${unit}`
      }
    }

    // Handle mixed numbers
    if (rounded > 1) {
      const whole = Math.floor(rounded)
      const decimal = rounded - whole

      for (const [decimalFraction, fraction] of Object.entries(fractions)) {
        if (Math.abs(decimal - decimalFraction) < 0.01) {
          return `${whole} ${fraction} ${unit}`
        }
      }
    }

    // Return as decimal
    return `${rounded} ${unit}`
  }

  // Generate shopping list from selected recipes
  async generateShoppingList(recipes, excludePantryItems = true) {
    try {
      const parsedIngredients = []

      for (const recipe of recipes) {
        if (!recipe.ingredients || recipe.ingredients.length === 0) continue

        for (const ingredient of recipe.ingredients) {
          const parsed = this.parseIngredient(ingredient)
          parsed.recipe = recipe.name

          // Skip pantry items if requested
          if (excludePantryItems && this.isPantryItem(parsed.item)) {
            continue
          }

          parsedIngredients.push(parsed)
        }
      }

      // Consolidate ingredients
      const consolidated = this.consolidateIngredients(parsedIngredients)

      // Group by category
      const grouped = {}
      for (const ingredient of consolidated) {
        const category = ingredient.category
        if (!grouped[category]) {
          grouped[category] = []
        }
        grouped[category].push(ingredient)
      }

      // Sort categories and items within categories
      const sortedCategories = Object.keys(grouped).sort((a, b) => {
        const order = ['Produce', 'Meat & Seafood', 'Dairy & Eggs', 'Pantry & Dry Goods', 'Canned & Jarred', 'Frozen', 'Other']
        return order.indexOf(a) - order.indexOf(b)
      })

      const result = {}
      for (const category of sortedCategories) {
        result[category] = grouped[category].sort((a, b) => a.item.localeCompare(b.item))
      }

      return result

    } catch (error) {
      console.error('Failed to generate shopping list:', error)
      throw error
    }
  }

  // Save shopping list to database
  async saveShoppingList(weeklyPlanId, items) {
    try {
      const now = new Date().toISOString()

      // Delete existing shopping list for this weekly plan
      await this.db.shoppingLists.where('weekly_plan_id').equals(weeklyPlanId).delete()

      // Save new shopping list
      const id = await this.db.shoppingLists.add({
        weekly_plan_id: weeklyPlanId,
        items: items,
        created_at: now
      })

      return id
    } catch (error) {
      console.error('Failed to save shopping list:', error)
      throw error
    }
  }

  // Get shopping list for a weekly plan
  async getShoppingList(weeklyPlanId) {
    try {
      const shoppingList = await this.db.shoppingLists
        .where('weekly_plan_id')
        .equals(weeklyPlanId)
        .first()

      return shoppingList
    } catch (error) {
      console.error('Failed to get shopping list:', error)
      return null
    }
  }

  // Generate text for copying to clipboard
  generateCopyText(shoppingList, groupByRecipe = false) {
    let text = 'Shopping List\n' + '='.repeat(20) + '\n\n'

    if (groupByRecipe) {
      // Group by recipe instead of category
      const byRecipe = {}

      for (const [category, items] of Object.entries(shoppingList)) {
        for (const item of items) {
          for (const source of item.sources) {
            if (!byRecipe[source.recipe]) {
              byRecipe[source.recipe] = []
            }
            byRecipe[source.recipe].push(`• ${source.original}`)
          }
        }
      }

      for (const [recipe, ingredients] of Object.entries(byRecipe)) {
        text += `${recipe}:\n`
        text += ingredients.join('\n') + '\n\n'
      }
    } else {
      // Group by category
      for (const [category, items] of Object.entries(shoppingList)) {
        if (items.length === 0) continue

        text += `${category}:\n`
        for (const item of items) {
          const qty = this.formatQuantity(item.quantity, item.unit)
          const sources = item.sources.map(s => s.original).join(', ')
          text += `• ${qty} ${item.item} (${sources})\n`
        }
        text += '\n'
      }
    }

    return text
  }
}

// Export singleton instance
export const shoppingListService = new ShoppingListService()