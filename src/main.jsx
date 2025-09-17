import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { initDatabase } from './database/db.js'
import { recipeService } from './database/recipeService.js'

// Initialize database and seed sample data for development
async function initializeApp() {
  try {
    await initDatabase()

    // Check if we need to seed sample data
    const existingRecipes = await recipeService.getAll()
    if (existingRecipes.length === 0) {
      console.log('Seeding sample data...')

      const sampleRecipes = [
        {
          name: "Spaghetti Carbonara",
          url: "https://www.bonappetit.com/recipe/simple-carbonara",
          tags: ["pasta", "italian", "quick"]
        },
        {
          name: "Chicken Tikka Masala",
          url: "https://cafedelites.com/chicken-tikka-masala/",
          tags: ["indian", "chicken", "curry"]
        },
        {
          name: "Caesar Salad",
          url: "https://www.foodnetwork.com/recipes/emeril-lagasse/caesars-salad-recipe-1915068",
          tags: ["salad", "vegetarian", "healthy"]
        },
        {
          name: "Beef Tacos",
          url: "https://www.tacobell.com/",
          tags: ["mexican", "beef", "quick"]
        }
      ]

      await recipeService.bulkInsert(sampleRecipes)
      console.log('Sample data seeded successfully')
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
