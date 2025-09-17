const STORAGE_KEYS = {
  RECIPES: 'meal_planner_recipes',
  WEEKLY_PLANS: 'meal_planner_weekly_plans'
}

function safeJSONParse(str, fallback = null) {
  if (str === null || str === undefined) {
    return fallback
  }
  try {
    return JSON.parse(str)
  } catch (error) {
    console.error('Error parsing JSON from localStorage:', error)
    return fallback
  }
}

function safeJSONStringify(obj) {
  try {
    return JSON.stringify(obj)
  } catch (error) {
    console.error('Error stringifying object for localStorage:', error)
    return null
  }
}

export const recipeStorage = {
  getAll: () => {
    const recipes = localStorage.getItem(STORAGE_KEYS.RECIPES)
    return safeJSONParse(recipes, [])
  },

  add: (recipe) => {
    const recipes = recipeStorage.getAll()
    const newRecipe = {
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
      ...recipe
    }
    recipes.push(newRecipe)
    const serialized = safeJSONStringify(recipes)
    if (serialized) {
      localStorage.setItem(STORAGE_KEYS.RECIPES, serialized)
    }
    return newRecipe
  },

  update: (id, updates) => {
    const recipes = recipeStorage.getAll()
    const index = recipes.findIndex(recipe => recipe.id === id)
    if (index !== -1) {
      recipes[index] = { ...recipes[index], ...updates, updatedAt: new Date().toISOString() }
      const serialized = safeJSONStringify(recipes)
      if (serialized) {
        localStorage.setItem(STORAGE_KEYS.RECIPES, serialized)
      }
      return recipes[index]
    }
    return null
  },

  delete: (id) => {
    const recipes = recipeStorage.getAll()
    const filteredRecipes = recipes.filter(recipe => recipe.id !== id)
    const serialized = safeJSONStringify(filteredRecipes)
    if (serialized) {
      localStorage.setItem(STORAGE_KEYS.RECIPES, serialized)
    }
    return true
  },

  getById: (id) => {
    const recipes = recipeStorage.getAll()
    return recipes.find(recipe => recipe.id === id) || null
  }
}

export const weeklyPlanStorage = {
  getAll: () => {
    const plans = localStorage.getItem(STORAGE_KEYS.WEEKLY_PLANS)
    return safeJSONParse(plans, [])
  },

  getCurrent: () => {
    const plans = weeklyPlanStorage.getAll()
    return plans.find(plan => plan.isCurrent) || null
  },

  save: (weeklyPlan) => {
    const plans = weeklyPlanStorage.getAll()

    plans.forEach(plan => {
      plan.isCurrent = false
    })

    const newPlan = {
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
      isCurrent: true,
      ...weeklyPlan
    }

    plans.push(newPlan)
    const serialized = safeJSONStringify(plans)
    if (serialized) {
      localStorage.setItem(STORAGE_KEYS.WEEKLY_PLANS, serialized)
    }
    return newPlan
  },

  delete: (id) => {
    const plans = weeklyPlanStorage.getAll()
    const filteredPlans = plans.filter(plan => plan.id !== id)
    const serialized = safeJSONStringify(filteredPlans)
    if (serialized) {
      localStorage.setItem(STORAGE_KEYS.WEEKLY_PLANS, serialized)
    }
    return true
  }
}

export const clearAllData = () => {
  localStorage.removeItem(STORAGE_KEYS.RECIPES)
  localStorage.removeItem(STORAGE_KEYS.WEEKLY_PLANS)
  console.log('All meal planner data cleared from localStorage')
}

export const seedSampleData = () => {
  const existingRecipes = recipeStorage.getAll()
  if (existingRecipes.length === 0) {
    const baseTimestamp = Date.now()
    const sampleRecipes = [
      {
        id: (baseTimestamp + 1).toString(),
        name: "Spaghetti Carbonara",
        url: "https://example.com/carbonara",
        tags: ["pasta", "italian", "quick"],
        createdAt: new Date(baseTimestamp + 1).toISOString()
      },
      {
        id: (baseTimestamp + 2).toString(),
        name: "Chicken Stir Fry",
        url: "https://example.com/stirfry",
        tags: ["chicken", "asian", "vegetables", "quick"],
        createdAt: new Date(baseTimestamp + 2).toISOString()
      },
      {
        id: (baseTimestamp + 3).toString(),
        name: "Beef Tacos",
        url: "",
        tags: ["mexican", "beef", "easy"],
        createdAt: new Date(baseTimestamp + 3).toISOString()
      },
      {
        id: (baseTimestamp + 4).toString(),
        name: "Greek Salad",
        url: "https://example.com/greek-salad",
        tags: ["vegetarian", "healthy", "mediterranean"],
        createdAt: new Date(baseTimestamp + 4).toISOString()
      }
    ]

    // Store the recipes directly with unique IDs
    const serialized = safeJSONStringify(sampleRecipes)
    if (serialized) {
      localStorage.setItem(STORAGE_KEYS.RECIPES, serialized)
      console.log('Sample recipes added to localStorage with unique IDs:', sampleRecipes.map(r => ({ id: r.id, name: r.name })))
    }
  }
}