import { db } from '../database/db.js'
import {
  TAG_CATEGORIES,
  CUISINE_TAGS,
  INGREDIENT_TAGS,
  CONVENIENCE_TAGS
} from '../constants/tagCategories.js'

// @ai-context: Tag migration utilities for converting legacy tags to new categorized system
// @ai-dependencies: Requires database access and tag category constants
// @ai-technical-debt(medium, high, medium) - Large hardcoded mapping object should be externalized to JSON
// @ai-technical-debt(low, medium, low) - Case-insensitive matching could be optimized with Map

// Mapping of common legacy tags to new categorized tags
const LEGACY_TAG_MAPPING = {
  // Cuisine mappings (case-insensitive)
  'italian': { category: TAG_CATEGORIES.CUISINE, tag: 'Italian' },
  'mexican': { category: TAG_CATEGORIES.CUISINE, tag: 'Mexican' },
  'japanese': { category: TAG_CATEGORIES.CUISINE, tag: 'Japanese' },
  'chinese': { category: TAG_CATEGORIES.CUISINE, tag: 'Chinese' },
  'indian': { category: TAG_CATEGORIES.CUISINE, tag: 'Indian' },
  'thai': { category: TAG_CATEGORIES.CUISINE, tag: 'Thai' },
  'mediterranean': { category: TAG_CATEGORIES.CUISINE, tag: 'Mediterranean' },
  'american': { category: TAG_CATEGORIES.CUISINE, tag: 'American' },
  'french': { category: TAG_CATEGORIES.CUISINE, tag: 'French' },
  'korean': { category: TAG_CATEGORIES.CUISINE, tag: 'Korean' },
  'vietnamese': { category: TAG_CATEGORIES.CUISINE, tag: 'Vietnamese' },
  'greek': { category: TAG_CATEGORIES.CUISINE, tag: 'Greek' },
  'spanish': { category: TAG_CATEGORIES.CUISINE, tag: 'Spanish' },
  'middle eastern': { category: TAG_CATEGORIES.CUISINE, tag: 'Middle Eastern' },
  'british': { category: TAG_CATEGORIES.CUISINE, tag: 'British' },
  'german': { category: TAG_CATEGORIES.CUISINE, tag: 'German' },

  // Ingredient mappings
  'chicken': { category: TAG_CATEGORIES.INGREDIENTS, tag: 'Chicken' },
  'turkey': { category: TAG_CATEGORIES.INGREDIENTS, tag: 'Turkey' },
  'fish': { category: TAG_CATEGORIES.INGREDIENTS, tag: 'Fish' },
  'salmon': { category: TAG_CATEGORIES.INGREDIENTS, tag: 'Salmon' },
  'tuna': { category: TAG_CATEGORIES.INGREDIENTS, tag: 'Tuna' },
  'shrimp': { category: TAG_CATEGORIES.INGREDIENTS, tag: 'Shrimp' },
  'pasta': { category: TAG_CATEGORIES.INGREDIENTS, tag: 'Pasta' },
  'rice': { category: TAG_CATEGORIES.INGREDIENTS, tag: 'Rice' },
  'quinoa': { category: TAG_CATEGORIES.INGREDIENTS, tag: 'Quinoa' },
  'beans': { category: TAG_CATEGORIES.INGREDIENTS, tag: 'Beans' },
  'lentils': { category: TAG_CATEGORIES.INGREDIENTS, tag: 'Lentils' },
  'tofu': { category: TAG_CATEGORIES.INGREDIENTS, tag: 'Tofu' },
  'eggs': { category: TAG_CATEGORIES.INGREDIENTS, tag: 'Eggs' },
  'cheese': { category: TAG_CATEGORIES.INGREDIENTS, tag: 'Cheese' },
  'vegetables': { category: TAG_CATEGORIES.INGREDIENTS, tag: 'Vegetables' },
  'mushrooms': { category: TAG_CATEGORIES.INGREDIENTS, tag: 'Mushrooms' },
  'potatoes': { category: TAG_CATEGORIES.INGREDIENTS, tag: 'Potatoes' },
  'sweet potato': { category: TAG_CATEGORIES.INGREDIENTS, tag: 'Sweet Potato' },
  'avocado': { category: TAG_CATEGORIES.INGREDIENTS, tag: 'Avocado' },
  'coconut': { category: TAG_CATEGORIES.INGREDIENTS, tag: 'Coconut' },
  'nuts': { category: TAG_CATEGORIES.INGREDIENTS, tag: 'Nuts' },

  // Convenience mappings
  'quick': { category: TAG_CATEGORIES.CONVENIENCE, tag: 'Quick' },
  'fast': { category: TAG_CATEGORIES.CONVENIENCE, tag: 'Quick' },
  'easy': { category: TAG_CATEGORIES.CONVENIENCE, tag: 'Beginner' },
  'simple': { category: TAG_CATEGORIES.CONVENIENCE, tag: 'Beginner' },
  'beginner': { category: TAG_CATEGORIES.CONVENIENCE, tag: 'Beginner' },
  'advanced': { category: TAG_CATEGORIES.CONVENIENCE, tag: 'Advanced' },
  'complex': { category: TAG_CATEGORIES.CONVENIENCE, tag: 'Advanced' },
  'one pot': { category: TAG_CATEGORIES.CONVENIENCE, tag: 'One-Pot' },
  'one-pot': { category: TAG_CATEGORIES.CONVENIENCE, tag: 'One-Pot' },
  'slow cooker': { category: TAG_CATEGORIES.CONVENIENCE, tag: 'Slow-Cooker' },
  'slow-cooker': { category: TAG_CATEGORIES.CONVENIENCE, tag: 'Slow-Cooker' },
  'crockpot': { category: TAG_CATEGORIES.CONVENIENCE, tag: 'Slow-Cooker' },
  'make ahead': { category: TAG_CATEGORIES.CONVENIENCE, tag: 'Make-Ahead' },
  'make-ahead': { category: TAG_CATEGORIES.CONVENIENCE, tag: 'Make-Ahead' },
  'prep ahead': { category: TAG_CATEGORIES.CONVENIENCE, tag: 'Make-Ahead' },
  'freezer': { category: TAG_CATEGORIES.CONVENIENCE, tag: 'Freezer-Friendly' },
  'freezer friendly': { category: TAG_CATEGORIES.CONVENIENCE, tag: 'Freezer-Friendly' },
  'freezer-friendly': { category: TAG_CATEGORIES.CONVENIENCE, tag: 'Freezer-Friendly' },
  'batch cook': { category: TAG_CATEGORIES.CONVENIENCE, tag: 'Batch-Cook' },
  'batch-cook': { category: TAG_CATEGORIES.CONVENIENCE, tag: 'Batch-Cook' },
  'meal prep': { category: TAG_CATEGORIES.CONVENIENCE, tag: 'Batch-Cook' },
  'no cook': { category: TAG_CATEGORIES.CONVENIENCE, tag: 'No-Cook' },
  'no-cook': { category: TAG_CATEGORIES.CONVENIENCE, tag: 'No-Cook' },
  'weekend': { category: TAG_CATEGORIES.CONVENIENCE, tag: 'Weekend-Project' },
  'weekend project': { category: TAG_CATEGORIES.CONVENIENCE, tag: 'Weekend-Project' },
  'leftover': { category: TAG_CATEGORIES.CONVENIENCE, tag: 'Leftover-Friendly' },
  'leftovers': { category: TAG_CATEGORIES.CONVENIENCE, tag: 'Leftover-Friendly' },
  'short prep': { category: TAG_CATEGORIES.CONVENIENCE, tag: 'Short-Prep' },
  'short-prep': { category: TAG_CATEGORIES.CONVENIENCE, tag: 'Short-Prep' },
  'minimal prep': { category: TAG_CATEGORIES.CONVENIENCE, tag: 'Short-Prep' }
}

// Function to categorize a legacy tag
function categorizeLegacyTag(legacyTag) {
  const normalizedTag = legacyTag.toLowerCase().trim()

  // Check direct mapping first
  if (LEGACY_TAG_MAPPING[normalizedTag]) {
    return LEGACY_TAG_MAPPING[normalizedTag]
  }

  // Check if it's a close match to any predefined tags
  const allPredefinedTags = [
    ...CUISINE_TAGS.map(tag => ({ category: TAG_CATEGORIES.CUISINE, tag })),
    ...INGREDIENT_TAGS.map(tag => ({ category: TAG_CATEGORIES.INGREDIENTS, tag })),
    ...CONVENIENCE_TAGS.map(tag => ({ category: TAG_CATEGORIES.CONVENIENCE, tag }))
  ]

  // Find case-insensitive match
  const exactMatch = allPredefinedTags.find(
    ({ tag }) => tag.toLowerCase() === normalizedTag
  )

  if (exactMatch) {
    return exactMatch
  }

  // If no match found, return as unmapped
  return { category: 'unmapped', tag: legacyTag }
}

// Function to migrate a single recipe's tags
export function migrateRecipeTags(recipe) {
  const legacyTags = recipe.tags || []
  const cuisineTags = []
  const ingredientTags = []
  const convenienceTags = []
  const unmappedTags = []

  legacyTags.forEach(tag => {
    const categorized = categorizeLegacyTag(tag)

    switch (categorized.category) {
      case TAG_CATEGORIES.CUISINE:
        if (!cuisineTags.includes(categorized.tag)) {
          cuisineTags.push(categorized.tag)
        }
        break
      case TAG_CATEGORIES.INGREDIENTS:
        if (!ingredientTags.includes(categorized.tag)) {
          ingredientTags.push(categorized.tag)
        }
        break
      case TAG_CATEGORIES.CONVENIENCE:
        if (!convenienceTags.includes(categorized.tag)) {
          convenienceTags.push(categorized.tag)
        }
        break
      default:
        unmappedTags.push(tag)
        break
    }
  })

  return {
    ...recipe,
    cuisine_tags: cuisineTags,
    ingredient_tags: ingredientTags,
    convenience_tags: convenienceTags,
    // Keep legacy tags for now with unmapped tags
    tags: unmappedTags
  }
}

// Function to analyze existing tags and provide migration report
export async function analyzeExistingTags() {
  try {
    const recipes = await db.recipes.toArray()
    const allTags = [...new Set(recipes.flatMap(recipe => recipe.tags || []))]

    const analysis = {
      totalRecipes: recipes.length,
      totalUniqueTags: allTags.length,
      categorized: {
        [TAG_CATEGORIES.CUISINE]: [],
        [TAG_CATEGORIES.INGREDIENTS]: [],
        [TAG_CATEGORIES.CONVENIENCE]: []
      },
      unmapped: []
    }

    allTags.forEach(tag => {
      const categorized = categorizeLegacyTag(tag)

      if (categorized.category === 'unmapped') {
        analysis.unmapped.push(tag)
      } else {
        if (!analysis.categorized[categorized.category].includes(categorized.tag)) {
          analysis.categorized[categorized.category].push(categorized.tag)
        }
      }
    })

    return analysis
  } catch (error) {
    console.error('Failed to analyze existing tags:', error)
    throw error
  }
}

// Function to perform the migration on all recipes
export async function migrateAllRecipes() {
  try {
    const recipes = await db.recipes.toArray()
    const migratedRecipes = []

    for (const recipe of recipes) {
      const migratedRecipe = migrateRecipeTags(recipe)
      migratedRecipes.push(migratedRecipe)
    }

    // Update all recipes in the database
    await db.transaction('rw', db.recipes, async () => {
      for (const recipe of migratedRecipes) {
        await db.recipes.put(recipe)
      }
    })

    console.log(`Successfully migrated ${migratedRecipes.length} recipes`)
    return {
      success: true,
      migratedCount: migratedRecipes.length,
      recipes: migratedRecipes
    }
  } catch (error) {
    console.error('Failed to migrate recipes:', error)
    throw error
  }
}

// Function to check if migration has been run
export async function isMigrationComplete() {
  try {
    const recipes = await db.recipes.toArray()

    // Check if any recipe has the new categorized tag fields
    const hasCategorizedTags = recipes.some(recipe =>
      recipe.cuisine_tags !== undefined ||
      recipe.ingredient_tags !== undefined ||
      recipe.convenience_tags !== undefined
    )

    return hasCategorizedTags
  } catch (error) {
    console.error('Failed to check migration status:', error)
    return false
  }
}