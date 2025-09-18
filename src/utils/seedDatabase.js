import { recipeService } from '../database/recipeService.js'
import { sampleRecipes } from '../data/sampleRecipes.js'

export async function seedDatabase() {
  try {
    console.log('🌱 Starting database seeding...')

    // Check if recipes already exist
    const existingRecipes = await recipeService.getAll()

    if (existingRecipes.length > 0) {
      console.log(`📋 Found ${existingRecipes.length} existing recipes. Skipping seed.`)
      return {
        success: true,
        message: `Database already has ${existingRecipes.length} recipes`,
        existingCount: existingRecipes.length
      }
    }

    // Add sample recipes
    const results = []
    for (const recipe of sampleRecipes) {
      try {
        const savedRecipe = await recipeService.add(recipe)
        results.push(savedRecipe)
        console.log(`✅ Added: ${recipe.name}`)
      } catch (error) {
        console.error(`❌ Failed to add ${recipe.name}:`, error)
      }
    }

    console.log(`🎉 Successfully seeded database with ${results.length} recipes!`)

    return {
      success: true,
      message: `Successfully added ${results.length} sample recipes`,
      addedCount: results.length,
      recipes: results
    }

  } catch (error) {
    console.error('💥 Database seeding failed:', error)
    return {
      success: false,
      error: error.message
    }
  }
}

// Utility function to clear all recipes (for development)
export async function clearAllRecipes() {
  try {
    const recipes = await recipeService.getAll()
    const deletePromises = recipes.map(recipe => recipeService.delete(recipe.id))
    await Promise.all(deletePromises)

    console.log(`🧹 Cleared ${recipes.length} recipes from database`)
    return {
      success: true,
      deletedCount: recipes.length
    }
  } catch (error) {
    console.error('Failed to clear recipes:', error)
    return {
      success: false,
      error: error.message
    }
  }
}

// Function to reseed (clear + add sample recipes)
export async function reseedDatabase() {
  try {
    console.log('🔄 Reseeding database...')

    // Clear existing recipes
    const clearResult = await clearAllRecipes()
    if (!clearResult.success) {
      throw new Error(`Failed to clear database: ${clearResult.error}`)
    }

    // Add sample recipes
    const seedResult = await seedDatabase()
    if (!seedResult.success) {
      throw new Error(`Failed to seed database: ${seedResult.error}`)
    }

    console.log('🎉 Database reseeding completed!')
    return {
      success: true,
      message: `Cleared ${clearResult.deletedCount} recipes and added ${seedResult.addedCount} new ones`,
      ...seedResult
    }

  } catch (error) {
    console.error('Reseed failed:', error)
    return {
      success: false,
      error: error.message
    }
  }
}