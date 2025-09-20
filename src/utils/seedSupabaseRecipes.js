import { supabase } from '../lib/supabase.js'
import { authService } from '../services/authService.js'

// Comprehensive recipe data with full ingredients and instructions
const sampleRecipes = [
  {
    name: "Classic Spaghetti Carbonara",
    url: "https://www.foodnetwork.com/recipes/tyler-florence/spaghetti-carbonara-recipe-1912597",
    ingredients: [
      "1 lb spaghetti pasta",
      "6 large eggs",
      "1 cup grated Pecorino Romano cheese",
      "1/2 lb pancetta, diced",
      "4 cloves garlic, minced",
      "1/2 cup dry white wine",
      "1/2 tsp black pepper",
      "1/4 tsp salt",
      "2 tbsp olive oil",
      "Fresh parsley for garnish"
    ],
    instructions: [
      "Bring a large pot of salted water to boil and cook spaghetti according to package directions until al dente. Reserve 1 cup pasta water before draining.",
      "Heat olive oil in a large skillet over medium heat. Add diced pancetta and cook until crispy and golden, about 5-7 minutes.",
      "Add minced garlic to the skillet and cook for 1 minute until fragrant. Add white wine and let it reduce by half, about 2-3 minutes.",
      "In a large bowl, whisk together eggs, grated cheese, black pepper, and salt until well combined.",
      "Add hot, drained pasta to the skillet with pancetta. Toss quickly to combine and remove from heat immediately.",
      "Slowly pour the egg mixture over the pasta while tossing continuously. The residual heat will cook the eggs without scrambling them.",
      "Add reserved pasta water gradually while tossing until you reach a creamy consistency. Serve immediately with extra cheese and parsley."
    ],
    prep_time: 15,
    cook_time: 20,
    servings: 6,
    tags: ["italian", "pasta", "comfort-food", "dinner"],
    cuisine_tags: ["italian"],
    ingredient_tags: ["pasta", "eggs", "cheese", "pancetta"],
    convenience_tags: ["moderate-cooking", "one-pot"]
  },
  {
    name: "Perfect Grilled Salmon with Lemon Herb Butter",
    url: "https://www.allrecipes.com/recipe/217931/perfect-grilled-salmon/",
    ingredients: [
      "4 salmon fillets (6 oz each)",
      "3 tbsp butter, softened",
      "2 tbsp fresh dill, chopped",
      "2 tbsp fresh parsley, chopped",
      "1 tbsp fresh chives, chopped",
      "2 cloves garlic, minced",
      "1 lemon, zested and juiced",
      "2 tbsp olive oil",
      "1 tsp salt",
      "1/2 tsp black pepper",
      "1/4 tsp paprika",
      "Lemon wedges for serving"
    ],
    instructions: [
      "Preheat grill to medium-high heat (400-450°F). Clean and oil the grill grates.",
      "In a small bowl, mix together softened butter, dill, parsley, chives, garlic, lemon zest, and half the lemon juice. Season with salt and pepper.",
      "Pat salmon fillets dry with paper towels. Brush both sides with olive oil and season with salt, pepper, and paprika.",
      "Place salmon on the grill, skin-side down. Close the lid and cook for 4-5 minutes without moving.",
      "Carefully flip the salmon using a spatula. Cook for another 3-4 minutes until the fish flakes easily with a fork.",
      "Remove from grill and immediately top each fillet with a dollop of the herb butter mixture.",
      "Squeeze remaining lemon juice over the salmon and serve with lemon wedges. The butter will melt and create a delicious sauce."
    ],
    prep_time: 20,
    cook_time: 15,
    servings: 4,
    tags: ["seafood", "healthy", "grilled", "dinner"],
    cuisine_tags: ["american", "mediterranean"],
    ingredient_tags: ["salmon", "herbs", "lemon", "butter"],
    convenience_tags: ["quick-cooking", "grilled", "healthy"]
  },
  {
    name: "Authentic Chicken Tikka Masala",
    url: "https://www.recipetineats.com/chicken-tikka-masala/",
    ingredients: [
      "2 lbs chicken breast, cut into 1-inch cubes",
      "1 cup plain yogurt",
      "2 tbsp lemon juice",
      "2 tsp garam masala",
      "1 tsp turmeric",
      "1 tsp cumin",
      "1 tsp coriander",
      "1 tsp paprika",
      "1/2 tsp cayenne pepper",
      "2 tbsp vegetable oil",
      "1 large onion, diced",
      "4 cloves garlic, minced",
      "1 inch fresh ginger, grated",
      "1 can (14 oz) crushed tomatoes",
      "1 cup heavy cream",
      "2 tbsp butter",
      "1 tsp sugar",
      "Salt to taste",
      "Fresh cilantro for garnish",
      "Basmati rice for serving"
    ],
    instructions: [
      "In a large bowl, mix yogurt, lemon juice, 1 tsp garam masala, turmeric, cumin, coriander, paprika, and cayenne. Add chicken and marinate for at least 2 hours or overnight.",
      "Heat oil in a large skillet over medium-high heat. Cook marinated chicken in batches until golden and cooked through, about 4-5 minutes per side. Set aside.",
      "In the same skillet, add butter and sauté diced onion until golden brown, about 8-10 minutes. Add garlic and ginger, cook for 1 minute until fragrant.",
      "Add remaining garam masala, crushed tomatoes, and sugar. Simmer for 10 minutes until sauce thickens slightly.",
      "Stir in heavy cream and return chicken to the skillet. Simmer for 5-10 minutes until chicken is heated through and sauce is creamy.",
      "Season with salt to taste. Garnish with fresh cilantro and serve over basmati rice with naan bread."
    ],
    prep_time: 30,
    cook_time: 45,
    servings: 6,
    tags: ["indian", "curry", "spicy", "dinner"],
    cuisine_tags: ["indian"],
    ingredient_tags: ["chicken", "yogurt", "spices", "tomatoes"],
    convenience_tags: ["marinate-ahead", "one-pot", "make-ahead"]
  },
  {
    name: "Decadent Chocolate Lava Cake",
    url: "https://www.tasteofhome.com/recipes/chocolate-lava-cakes/",
    ingredients: [
      "6 oz dark chocolate (70% cacao), chopped",
      "1/2 cup unsalted butter",
      "3 large eggs",
      "3 large egg yolks",
      "1/3 cup granulated sugar",
      "1/4 cup all-purpose flour",
      "1/4 tsp salt",
      "1 tsp vanilla extract",
      "2 tbsp cocoa powder for dusting",
      "Powdered sugar for dusting",
      "Fresh berries for garnish",
      "Vanilla ice cream for serving"
    ],
    instructions: [
      "Preheat oven to 425°F. Grease 4 ramekins with butter and dust with cocoa powder. Place on a baking sheet.",
      "In a double boiler, melt chocolate and butter together, stirring until smooth. Remove from heat and let cool slightly.",
      "In a large bowl, whisk together eggs, egg yolks, and sugar until pale and thick, about 3-4 minutes.",
      "Slowly whisk the melted chocolate mixture into the egg mixture. Add vanilla extract and mix well.",
      "Sift flour and salt together, then fold into the chocolate mixture until just combined. Do not overmix.",
      "Divide batter evenly among prepared ramekins. Bake for 12-14 minutes until edges are firm but centers are still soft.",
      "Let cool for 1 minute, then run a knife around edges and invert onto serving plates. Dust with powdered sugar and serve immediately with ice cream and berries."
    ],
    prep_time: 25,
    cook_time: 15,
    servings: 4,
    tags: ["dessert", "chocolate", "baking", "special-occasion"],
    cuisine_tags: ["french", "american"],
    ingredient_tags: ["chocolate", "eggs", "butter", "flour"],
    convenience_tags: ["quick-baking", "impressive", "special-occasion"]
  },
  {
    name: "Mediterranean Quinoa Bowl",
    url: "https://www.cookingclassy.com/mediterranean-quinoa-bowl/",
    ingredients: [
      "1 cup quinoa, rinsed",
      "2 cups vegetable broth",
      "1 cucumber, diced",
      "2 cups cherry tomatoes, halved",
      "1/2 red onion, thinly sliced",
      "1/2 cup kalamata olives, pitted and halved",
      "1/2 cup feta cheese, crumbled",
      "1/4 cup fresh parsley, chopped",
      "1/4 cup fresh mint, chopped",
      "1/4 cup pine nuts, toasted",
      "3 tbsp olive oil",
      "2 tbsp lemon juice",
      "1 clove garlic, minced",
      "1 tsp dried oregano",
      "Salt and pepper to taste"
    ],
    instructions: [
      "In a medium saucepan, bring vegetable broth to a boil. Add quinoa, reduce heat to low, cover and simmer for 15 minutes until liquid is absorbed. Fluff with a fork and let cool.",
      "In a small bowl, whisk together olive oil, lemon juice, minced garlic, oregano, salt, and pepper to make the dressing.",
      "In a large bowl, combine cooled quinoa with diced cucumber, cherry tomatoes, red onion, and olives.",
      "Pour the dressing over the quinoa mixture and toss gently to combine. Let marinate for 15 minutes.",
      "Just before serving, add crumbled feta cheese, chopped parsley, mint, and toasted pine nuts. Toss gently.",
      "Taste and adjust seasoning. Serve at room temperature or chilled. Can be made ahead and stored in the refrigerator for up to 3 days."
    ],
    prep_time: 20,
    cook_time: 20,
    servings: 4,
    tags: ["healthy", "vegetarian", "mediterranean", "lunch"],
    cuisine_tags: ["mediterranean"],
    ingredient_tags: ["quinoa", "vegetables", "feta", "olives"],
    convenience_tags: ["make-ahead", "healthy", "meal-prep", "vegetarian"]
  },
  {
    name: "Beef and Broccoli Stir-Fry",
    url: "https://www.damndelicious.net/2014/10/15/beef-and-broccoli/",
    ingredients: [
      "1 lb flank steak, sliced thin against the grain",
      "1 lb broccoli, cut into florets",
      "3 cloves garlic, minced",
      "1 inch fresh ginger, grated",
      "3 tbsp soy sauce",
      "2 tbsp oyster sauce",
      "1 tbsp cornstarch",
      "1 tbsp brown sugar",
      "1 tbsp rice vinegar",
      "1 tsp sesame oil",
      "2 tbsp vegetable oil",
      "1/4 cup beef broth",
      "2 green onions, sliced",
      "1 tbsp sesame seeds",
      "Cooked rice for serving"
    ],
    instructions: [
      "In a small bowl, whisk together soy sauce, oyster sauce, cornstarch, brown sugar, rice vinegar, and sesame oil to make the sauce. Set aside.",
      "Heat 1 tbsp vegetable oil in a large wok or skillet over high heat. Add broccoli and stir-fry for 3-4 minutes until bright green and crisp-tender. Remove and set aside.",
      "Add remaining oil to the same pan. Add sliced beef and stir-fry for 2-3 minutes until browned but still pink in the center. Remove and set aside.",
      "Add garlic and ginger to the pan, stir-fry for 30 seconds until fragrant. Return beef and broccoli to the pan.",
      "Pour the sauce mixture over everything and toss to combine. Add beef broth and bring to a simmer. Cook for 2-3 minutes until sauce thickens.",
      "Garnish with sliced green onions and sesame seeds. Serve immediately over steamed rice."
    ],
    prep_time: 20,
    cook_time: 15,
    servings: 4,
    tags: ["asian", "stir-fry", "quick", "dinner"],
    cuisine_tags: ["chinese", "asian"],
    ingredient_tags: ["beef", "broccoli", "soy-sauce", "ginger"],
    convenience_tags: ["quick-cooking", "one-pan", "weeknight-dinner"]
  }
]

export async function seedSupabaseRecipes() {
  try {
    console.log('🌱 Starting to seed Supabase with sample recipes...')
    
    // Get current user
    const user = await authService.getCurrentUser()
    if (!user) {
      throw new Error('User must be authenticated to seed recipes')
    }
    
    console.log('👤 Seeding recipes for user:', user.id)
    
    // Insert recipes one by one to handle any potential errors
    const results = []
    for (const recipe of sampleRecipes) {
      try {
        const { data, error } = await supabase
          .from('recipes')
          .insert({
            user_id: user.id,
            name: recipe.name,
            url: recipe.url,
            ingredients: recipe.ingredients,
            instructions: recipe.instructions,
            prep_time: recipe.prep_time,
            cook_time: recipe.cook_time,
            servings: recipe.servings,
            tags: recipe.tags,
            cuisine_tags: recipe.cuisine_tags,
            ingredient_tags: recipe.ingredient_tags,
            convenience_tags: recipe.convenience_tags
          })
          .select()
          .single()
        
        if (error) {
          console.error(`❌ Error inserting recipe "${recipe.name}":`, error)
          results.push({ recipe: recipe.name, success: false, error: error.message })
        } else {
          console.log(`✅ Successfully inserted recipe: "${recipe.name}"`)
          results.push({ recipe: recipe.name, success: true, id: data.id })
        }
      } catch (err) {
        console.error(`❌ Exception inserting recipe "${recipe.name}":`, err)
        results.push({ recipe: recipe.name, success: false, error: err.message })
      }
    }
    
    const successCount = results.filter(r => r.success).length
    const failCount = results.filter(r => !r.success).length
    
    console.log(`🎉 Seeding complete! ${successCount} recipes inserted successfully, ${failCount} failed.`)
    
    return {
      success: true,
      total: sampleRecipes.length,
      successful: successCount,
      failed: failCount,
      results: results
    }
    
  } catch (error) {
    console.error('❌ Error seeding Supabase recipes:', error)
    return {
      success: false,
      error: error.message
    }
  }
}

// Function to check if recipes already exist
export async function checkExistingRecipes() {
  try {
    const user = await authService.getCurrentUser()
    if (!user) {
      throw new Error('User must be authenticated to check recipes')
    }
    
    const { data, error } = await supabase
      .from('recipes')
      .select('id, name')
      .eq('user_id', user.id)
    
    if (error) throw error
    
    return {
      success: true,
      count: data?.length || 0,
      recipes: data || []
    }
  } catch (error) {
    console.error('❌ Error checking existing recipes:', error)
    return {
      success: false,
      error: error.message
    }
  }
}
