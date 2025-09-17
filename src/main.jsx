import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { initDatabase } from './database/db.js'
import { recipeService } from './database/recipeService.js'
import { mealHistoryService } from './database/mealHistoryService.js'

// Initialize database and seed sample data for development
async function initializeApp() {
  try {
    await initDatabase()

    // Check if we need to seed sample recipes
    const existingRecipes = await recipeService.getAll()
    if (existingRecipes.length === 0) {
      console.log('Seeding sample recipes...')

      const sampleRecipes = [
        {
          name: "Spaghetti Carbonara",
          url: "https://www.bonappetit.com/recipe/simple-carbonara",
          tags: ["pasta", "italian", "quick", "gluten-free"]
        },
        {
          name: "Chicken Tikka Masala",
          url: "https://cafedelites.com/chicken-tikka-masala/",
          tags: ["indian", "chicken", "curry", "gluten-free"]
        },
        {
          name: "Caesar Salad",
          url: "https://www.foodnetwork.com/recipes/emeril-lagasse/caesars-salad-recipe-1915068",
          tags: ["salad", "vegetarian", "healthy", "gluten-free"]
        },
        {
          name: "Grilled Salmon",
          url: "https://example.com/grilled-salmon",
          tags: ["fish", "healthy", "quick", "gluten-free"]
        },
        {
          name: "Turkey Meatballs",
          url: "https://example.com/turkey-meatballs",
          tags: ["turkey", "protein", "italian", "gluten-free"]
        },
        {
          name: "Vegetable Stir Fry",
          url: "https://example.com/veggie-stir-fry",
          tags: ["vegetarian", "healthy", "quick", "gluten-free"]
        }
      ]

      await recipeService.bulkInsert(sampleRecipes)
      console.log('Sample recipes seeded successfully')
    }

    // Check if we need to seed sample meal history
    const existingHistory = await mealHistoryService.getAll()
    if (existingHistory.length === 0) {
      console.log('Seeding sample meal history...')

      const recipes = await recipeService.getAll()
      if (recipes.length > 0) {
        // Generate realistic meal history over the past 8 weeks
        const sampleHistory = []
        const now = new Date()

        // Create history entries going back 8 weeks
        for (let weekOffset = 0; weekOffset < 8; weekOffset++) {
          const weekDate = new Date(now)
          weekDate.setDate(weekDate.getDate() - (weekOffset * 7))

          // Simulate 2-4 meals per week with realistic frequency patterns
          const mealsThisWeek = Math.floor(Math.random() * 3) + 2; // 2-4 meals

          for (let meal = 0; meal < mealsThisWeek; meal++) {
            const mealDate = new Date(weekDate)
            mealDate.setDate(mealDate.getDate() + Math.floor(Math.random() * 6)) // Random day of week

            // Weight selection toward certain recipes (simulate preferences)
            let selectedRecipe
            const rand = Math.random()
            if (rand < 0.4 && recipes[0]) { // 40% chance - "regular" meal
              selectedRecipe = recipes[0] // Spaghetti Carbonara
            } else if (rand < 0.7 && recipes[1]) { // 30% chance - "regular" meal
              selectedRecipe = recipes[1] // Chicken Tikka Masala
            } else if (rand < 0.85 && recipes[3]) { // 15% chance - "less regular"
              selectedRecipe = recipes[3] // Grilled Salmon
            } else {
              // 15% chance - pick random recipe
              selectedRecipe = recipes[Math.floor(Math.random() * recipes.length)]
            }

            if (selectedRecipe) {
              sampleHistory.push({
                recipe_id: selectedRecipe.id,
                eaten_date: mealDate.toISOString().split('T')[0],
                created_at: mealDate.toISOString()
              })
            }
          }
        }

        await mealHistoryService.bulkAdd(sampleHistory)
        console.log(`Sample meal history seeded: ${sampleHistory.length} entries`)

        // Log statistics for debugging
        const stats = await mealHistoryService.getStatistics()
        console.log('Meal History Statistics:', stats)
      }
    }
  } catch (error) {
    console.error('Failed to initialize database:', error)
  }
}

// Initialize the app
initializeApp()

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
