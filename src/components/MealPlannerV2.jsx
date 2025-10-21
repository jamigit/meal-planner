import React, { useReducer, useEffect, useRef, useCallback, useState } from 'react'
import { useLoadingState } from '../utils/loadingStates.js'
import { useRequestLifecycle } from '../utils/requestLifecycle.js'
import { aiMealPlannerService } from '../services/aiMealPlannerService.js'
import { serviceSelector } from '../services/serviceSelector.js'
import { emailService } from '../services/emailService.js'
import { debounce } from '../utils/performance.js'
import { SkeletonLoader } from '../components/LoadingComponents.jsx'
import RecipeListModal from './RecipeListModal.jsx'
import ShoppingListCard from './ShoppingListCard.jsx'
import SavePlanTransition from './SavePlanTransition.jsx'
import { useNavigate } from 'react-router-dom'

// State management with reducer
const initialState = {
  selectedMeals: [],
  suggestions: { meals: [], overview: '', error: null },
  preferences: { userPrompt: '', cuisines: [], tags: [], dietary: [] },
  plan: { name: '', notes: '' },
  activeTab: 'selected', // 'selected' or 'ingredients'
  allRecipes: [],
  recipeSearchTerm: '',
  successMessage: '',
  errorMessage: '',
  isRecipeModalOpen: false,
  showSaveTransition: false,
  transitionMessage: 'Well done!'
}

function mealPlanReducer(state, action) {
  switch (action.type) {
    case 'ADD_MEAL':
      return { ...state, selectedMeals: [...state.selectedMeals, action.meal] }
    case 'REMOVE_MEAL':
      return { ...state, selectedMeals: state.selectedMeals.filter(m => m.id !== action.id) }
    case 'UPDATE_SCALING':
      return { 
        ...state, 
        selectedMeals: state.selectedMeals.map(m => 
          m.id === action.id ? { ...m, scaling: action.scaling } : m
        )
      }
    case 'SET_SUGGESTIONS':
      return { ...state, suggestions: action.suggestions }
    case 'UPDATE_PREFERENCES':
      return { ...state, preferences: { ...state.preferences, ...action.preferences } }
    case 'UPDATE_PLAN':
      return { ...state, plan: { ...state.plan, ...action.plan } }
    case 'CLEAR_SELECTED':
      return { ...state, selectedMeals: [] }
    case 'SET_ACTIVE_TAB':
      return { ...state, activeTab: action.tab }
    case 'SET_ALL_RECIPES':
      return { ...state, allRecipes: action.recipes }
    case 'SET_RECIPE_SEARCH':
      return { ...state, recipeSearchTerm: action.searchTerm }
    case 'SET_SUCCESS_MESSAGE':
      return { ...state, successMessage: action.message, errorMessage: '' }
    case 'SET_ERROR_MESSAGE':
      return { ...state, errorMessage: action.message, successMessage: '' }
    case 'CLEAR_MESSAGES':
      return { ...state, successMessage: '', errorMessage: '' }
    case 'SET_RECIPE_MODAL_OPEN':
      return { ...state, isRecipeModalOpen: action.isOpen }
    case 'SET_SAVE_TRANSITION':
      return { ...state, showSaveTransition: action.show, transitionMessage: action.message || 'Well done!' }
    default:
      return state
  }
}

export default function MealPlannerV2() {
  const [state, dispatch] = useReducer(mealPlanReducer, initialState)
  const navigate = useNavigate()
  const { signal, cancel } = useRequestLifecycle('meal-planner')
  const { isLoading, startLoading, stopLoading } = useLoadingState('AI Suggestions')
  
  // Load all recipes for the recipe tab
  useEffect(() => {
    const loadRecipes = async () => {
      try {
        const weeklyPlanService = await serviceSelector.getWeeklyPlanService()
        const recipeService = await serviceSelector.getRecipeService()
        const recipes = await recipeService.getAll()
        dispatch({ type: 'SET_ALL_RECIPES', recipes })
      } catch (error) {
        console.error('Failed to load recipes:', error)
      }
    }
    loadRecipes()
  }, [])
  
  // Remember preferences in localStorage
  useEffect(() => {
    const saved = localStorage.getItem('mealPlannerV2Prefs')
    if (saved) {
      try {
        dispatch({ type: 'UPDATE_PREFERENCES', preferences: JSON.parse(saved) })
      } catch (error) {
        console.warn('Failed to parse saved preferences:', error)
      }
    }
  }, [])

  useEffect(() => {
    localStorage.setItem('mealPlannerV2Prefs', JSON.stringify(state.preferences))
  }, [state.preferences])

  // Normalize meal data for consistency
  const normalizeMeal = useCallback((recipe, scaling = 1) => ({
    id: recipe.id,
    name: recipe.name,
    url: recipe.url || null,
    tags: recipe.tags || [],
    cuisine_tags: recipe.cuisine_tags || [],
    ingredient_tags: recipe.ingredient_tags || [],
    convenience_tags: recipe.convenience_tags || [],
    ingredients: recipe.ingredients || [],
    instructions: recipe.instructions || [],
    scaling
  }), [])

  const handleGetSuggestions = async () => {
    startLoading('update', 'Getting AI suggestions...')
    
    try {
      const result = await aiMealPlannerService.generateEightMealSuggestions(
        state.preferences.userPrompt,
        state.preferences,
        signal
      )
      
      if (result.success) {
        dispatch({ 
          type: 'SET_SUGGESTIONS', 
          suggestions: { 
            meals: result.data.meals, 
            overview: result.data.overview,
            error: null
          }
        })
      } else {
        // Use fallback
        dispatch({ 
          type: 'SET_SUGGESTIONS', 
          suggestions: { 
            meals: result.fallback.meals, 
            overview: result.fallback.overview,
            error: result.error
          }
        })
      }
    } catch (error) {
      if (error.name !== 'AbortError') {
        dispatch({ 
          type: 'SET_SUGGESTIONS', 
          suggestions: { meals: [], overview: '', error: error.message }
        })
      }
    } finally {
      stopLoading()
    }
  }

  const handleAddMeal = (recipe) => {
    if (!state.selectedMeals.find(m => m.id === recipe.id)) {
      dispatch({ type: 'ADD_MEAL', meal: normalizeMeal(recipe) })
    }
  }

  const handleRemoveMeal = (id) => {
    dispatch({ type: 'REMOVE_MEAL', id })
  }

  const handleUpdateScaling = (id, scaling) => {
    dispatch({ type: 'UPDATE_SCALING', id, scaling })
  }

  const handleSavePlan = async () => {
    startLoading('create', 'Saving meal plan...')
    dispatch({ type: 'CLEAR_MESSAGES' })
    
    try {
      const weeklyPlanService = await serviceSelector.getWeeklyPlanService()
      
      // Clear any existing current plans first (like existing weekly planner)
      await weeklyPlanService.clearCurrentPlans()
      
      const plan = {
        meals: state.selectedMeals,
        notes: state.plan.notes,
        name: state.plan.name || `Meal Plan ${new Date().toLocaleDateString()}`,
        is_current: true,
        created_at: new Date().toISOString()
      }
      
      const savedPlan = await weeklyPlanService.save(plan, true)
      
      if (savedPlan) {
        // Show transition screen
        dispatch({ type: 'SET_SAVE_TRANSITION', show: true, message: 'Well done!' })
        
        // Clear selected meals and reset form after save
        dispatch({ type: 'CLEAR_SELECTED' })
        dispatch({ type: 'UPDATE_PLAN', plan: { name: '', notes: '' } })
      } else {
        dispatch({ type: 'SET_ERROR_MESSAGE', message: 'Failed to save meal plan' })
      }
      
    } catch (error) {
      console.error('Save plan error:', error)
      dispatch({ type: 'SET_ERROR_MESSAGE', message: `Failed to save meal plan: ${error.message}` })
    } finally {
      stopLoading()
    }
  }
  
  const handleSaveAndEmailPlan = async () => {
    startLoading('create', 'Saving and emailing meal plan...')
    dispatch({ type: 'CLEAR_MESSAGES' })
    
    try {
      const weeklyPlanService = await serviceSelector.getWeeklyPlanService()
      
      // Clear any existing current plans first
      await weeklyPlanService.clearCurrentPlans()
      
      const plan = {
        meals: state.selectedMeals,
        notes: state.plan.notes,
        name: state.plan.name || `Meal Plan ${new Date().toLocaleDateString()}`,
        is_current: true,
        created_at: new Date().toISOString()
      }
      
      const savedPlan = await weeklyPlanService.save(plan, true)
      
      if (savedPlan) {
        // Send email
        try {
          const emailResults = await emailService.sendMealPlan(savedPlan)
          
          const successCount = emailResults.filter(r => r.success).length
          const failCount = emailResults.filter(r => !r.success).length
          
          let message = 'Plan Saved & Emailed!'
          if (failCount > 0) {
            message = 'Plan Saved! (Email failed)'
          }
          
          // Show transition screen
          dispatch({ type: 'SET_SAVE_TRANSITION', show: true, message })
          
        } catch (emailError) {
          console.error('Email error:', emailError)
          dispatch({ type: 'SET_SAVE_TRANSITION', show: true, message: 'Plan Saved! (Email failed)' })
        }
        
        // Clear selected meals and reset form after save
        dispatch({ type: 'CLEAR_SELECTED' })
        dispatch({ type: 'UPDATE_PLAN', plan: { name: '', notes: '' } })
        
      } else {
        dispatch({ type: 'SET_ERROR_MESSAGE', message: 'Failed to save meal plan' })
      }
      
    } catch (error) {
      console.error('Save and email plan error:', error)
      dispatch({ type: 'SET_ERROR_MESSAGE', message: `Failed to save meal plan: ${error.message}` })
    } finally {
      stopLoading()
    }
  }
  
  const handleTransitionComplete = () => {
    dispatch({ type: 'SET_SAVE_TRANSITION', show: false })
    navigate('/saved-plans')
  }

  // Debounced user prompt update
  const debouncedPromptUpdate = useCallback(
    debounce((value) => {
      dispatch({ type: 'UPDATE_PREFERENCES', preferences: { userPrompt: value } })
    }, 300),
    []
  )

  const handlePromptChange = (e) => {
    const value = e.target.value
    debouncedPromptUpdate(value)
  }
  
  // Filter recipes based on search term
  const filteredRecipes = state.allRecipes.filter(recipe => 
    recipe.name.toLowerCase().includes(state.recipeSearchTerm.toLowerCase()) ||
    (recipe.ingredient_tags || []).some(tag => 
      tag.toLowerCase().includes(state.recipeSearchTerm.toLowerCase())
    ) ||
    (recipe.cuisine_tags || []).some(tag => 
      tag.toLowerCase().includes(state.recipeSearchTerm.toLowerCase())
    )
  )

  return (
    <div className="meal-planner-v2 max-w-4xl mx-auto p-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">AI Meal Planner V2</h1>
        <p className="text-gray-600">Get personalized meal suggestions based on your preferences and eating history.</p>
      </div>

      {/* User Preferences Section */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Your Preferences</h2>
        
        <div className="space-y-4">
          <div>
            <label htmlFor="userPrompt" className="block text-sm font-medium text-gray-700 mb-2">
              Tell us what you're looking for (optional)
            </label>
            <textarea
              id="userPrompt"
              placeholder="e.g., 'I want quick meals with chicken and vegetables', 'Looking for Italian cuisine', 'Need gluten-free options'"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows={3}
              onChange={handlePromptChange}
              defaultValue={state.preferences.userPrompt}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-gray-700">Cuisines</label>
                <button
                  onClick={() => dispatch({ type: 'UPDATE_PREFERENCES', preferences: { cuisines: [] } })}
                  className="text-xs text-gray-500 hover:text-gray-700 underline"
                >
                  Clear
                </button>
              </div>
              <select 
                multiple
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                onChange={(e) => {
                  const selected = Array.from(e.target.selectedOptions, option => option.value)
                  dispatch({ type: 'UPDATE_PREFERENCES', preferences: { cuisines: selected } })
                }}
              >
                <option value="Italian">Italian</option>
                <option value="Asian">Asian</option>
                <option value="Mexican">Mexican</option>
                <option value="Mediterranean">Mediterranean</option>
                <option value="American">American</option>
                <option value="Indian">Indian</option>
              </select>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-gray-700">Tags</label>
                <button
                  onClick={() => dispatch({ type: 'UPDATE_PREFERENCES', preferences: { tags: [] } })}
                  className="text-xs text-gray-500 hover:text-gray-700 underline"
                >
                  Clear
                </button>
              </div>
              <select 
                multiple
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                onChange={(e) => {
                  const selected = Array.from(e.target.selectedOptions, option => option.value)
                  dispatch({ type: 'UPDATE_PREFERENCES', preferences: { tags: selected } })
                }}
              >
                <option value="Quick">Quick</option>
                <option value="Healthy">Healthy</option>
                <option value="One-Pot">One-Pot</option>
                <option value="Vegetarian">Vegetarian</option>
                <option value="Chicken">Chicken</option>
                <option value="Beef">Beef</option>
                <option value="Seafood">Seafood</option>
              </select>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-gray-700">Dietary</label>
                <button
                  onClick={() => dispatch({ type: 'UPDATE_PREFERENCES', preferences: { dietary: [] } })}
                  className="text-xs text-gray-500 hover:text-gray-700 underline"
                >
                  Clear
                </button>
              </div>
              <select 
                multiple
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                onChange={(e) => {
                  const selected = Array.from(e.target.selectedOptions, option => option.value)
                  dispatch({ type: 'UPDATE_PREFERENCES', preferences: { dietary: selected } })
                }}
              >
                <option value="Gluten-Free">Gluten-Free</option>
                <option value="Dairy-Free">Dairy-Free</option>
                <option value="Nut-Free">Nut-Free</option>
                <option value="Low-Carb">Low-Carb</option>
                <option value="Keto">Keto</option>
                <option value="Paleo">Paleo</option>
              </select>
            </div>
          </div>
          
          {/* Clear All Preferences Button */}
          <div className="flex justify-center mt-4">
            <button
              onClick={() => dispatch({ type: 'UPDATE_PREFERENCES', preferences: { cuisines: [], tags: [], dietary: [] } })}
              className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 text-sm"
            >
              Clear All Preferences
            </button>
          </div>
        </div>

        <button
          onClick={handleGetSuggestions}
          disabled={isLoading}
          className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          {isLoading ? 'Getting Suggestions...' : 'Suggest 8 Meals'}
        </button>
      </div>

      {/* Suggestions Section */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">AI Suggestions</h2>
        
        {isLoading && (
          <div className="space-y-2">
            {[...Array(8)].map((_, i) => (
              <SkeletonLoader key={i} height="h-16" />
            ))}
          </div>
        )}

        {!isLoading && state.suggestions.error && (
          <div className="bg-yellow-50 p-4 rounded-md mb-4">
            <p className="text-yellow-800">{state.suggestions.error}</p>
            <p className="text-sm text-yellow-700 mt-1">Using fallback suggestions</p>
            <button 
              onClick={handleGetSuggestions} 
              className="mt-2 px-4 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700"
            >
              Try Again
            </button>
          </div>
        )}

        {!isLoading && state.suggestions.overview && (
          <div className="bg-blue-50 p-4 rounded-md mb-4">
            <p className="text-blue-800 font-medium">{state.suggestions.overview}</p>
          </div>
        )}

        {!isLoading && state.suggestions.meals.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {state.suggestions.meals.map((meal) => (
              <div key={meal.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                <h3 className="font-semibold text-gray-900 mb-2">{meal.name}</h3>
                <div className="text-sm text-gray-600 mb-3">
                  {meal.cuisine_tags?.length > 0 && (
                    <div className="mb-1">
                      <span className="font-medium">Cuisine:</span> {meal.cuisine_tags.join(', ')}
                    </div>
                  )}
                  {meal.ingredient_tags?.length > 0 && (
                    <div className="mb-1">
                      <span className="font-medium">Tags:</span> {meal.ingredient_tags.slice(0, 3).join(', ')}
                    </div>
                  )}
                </div>
                <button
                  onClick={() => handleAddMeal(meal)}
                  disabled={state.selectedMeals.find(m => m.id === meal.id)}
                  className="w-full px-3 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-sm"
                >
                  {state.selectedMeals.find(m => m.id === meal.id) ? 'Added' : 'Add to Plan'}
                </button>
              </div>
            ))}
          </div>
        )}

        {!isLoading && !state.suggestions.meals.length && !state.suggestions.error && (
          <div className="text-center py-8 text-gray-500">
            <div className="text-4xl mb-4">🤖</div>
            <h3 className="text-lg font-medium mb-2">Ready to suggest meals</h3>
            <p>Enter your preferences and click 'Suggest 8 Meals' to get started</p>
          </div>
        )}
      </div>

      {/* Success/Error Messages */}
      {state.successMessage && (
        <div className="bg-green-50 border border-green-200 rounded-md p-4 mb-6">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-green-800">{state.successMessage}</p>
            </div>
          </div>
        </div>
      )}
      
      {state.errorMessage && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-red-800">{state.errorMessage}</p>
            </div>
          </div>
        </div>
      )}

      {/* Selected Meals and Recipe Browser - Tabbed Interface */}
      <div className="bg-white rounded-lg shadow-md mb-6">
        {/* Tab Navigation */}
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8 px-6 pt-6">
            <button
              onClick={() => dispatch({ type: 'SET_ACTIVE_TAB', tab: 'selected' })}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                state.activeTab === 'selected'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Selected Meals ({state.selectedMeals.length})
            </button>
            <button
              onClick={() => dispatch({ type: 'SET_ACTIVE_TAB', tab: 'ingredients' })}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                state.activeTab === 'ingredients'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Ingredients
            </button>
          </nav>
        </div>
        
        {/* Tab Content */}
        <div className="p-6">
          {state.activeTab === 'selected' ? (
            <div>
              {/* Add Recipes Button */}
              <div className="mb-4 flex justify-between items-center">
                <h3 className="text-lg font-medium text-gray-900">Your Selected Meals</h3>
                <button
                  onClick={() => dispatch({ type: 'SET_RECIPE_MODAL_OPEN', isOpen: true })}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 text-sm"
                >
                  Add Recipes
                </button>
              </div>
              
              {state.selectedMeals.length > 0 ? (
                <div className="space-y-3">
                  {state.selectedMeals.map((meal) => (
                    <div key={meal.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-900">{meal.name}</h3>
                        <div className="text-sm text-gray-600">
                          {meal.cuisine_tags?.length > 0 && (
                            <span className="mr-3">Cuisine: {meal.cuisine_tags.join(', ')}</span>
                          )}
                          {meal.ingredient_tags?.length > 0 && (
                            <span>Tags: {meal.ingredient_tags.slice(0, 3).join(', ')}</span>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-3">
                        <div className="flex items-center space-x-2">
                          <label htmlFor={`scaling-${meal.id}`} className="text-sm font-medium">Servings:</label>
                          <select
                            id={`scaling-${meal.id}`}
                            value={meal.scaling}
                            onChange={(e) => handleUpdateScaling(meal.id, parseInt(e.target.value))}
                            className="px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                          >
                            {[1, 2, 3, 4, 5].map(num => (
                              <option key={num} value={num}>{num}</option>
                            ))}
                          </select>
                        </div>
                        
                        <button
                          onClick={() => handleRemoveMeal(meal.id)}
                          className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <div className="text-4xl mb-4">🍽️</div>
                  <h3 className="text-lg font-medium mb-2">No meals selected yet</h3>
                  <p>Add meals from the suggestions above or click "Add Recipes" to browse all recipes</p>
                </div>
              )}
            </div>
          ) : (
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Shopping List</h3>
              <ShoppingListCard 
                recipes={state.selectedMeals}
                className="max-h-96 overflow-y-auto"
                showTitle={false}
              />
            </div>
          )}
        </div>
      </div>

      {/* Plan Details Section */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Plan Details</h2>
        
        <div className="space-y-4">
          <div>
            <label htmlFor="planName" className="block text-sm font-medium text-gray-700 mb-2">
              Plan Name (optional)
            </label>
            <input
              id="planName"
              type="text"
              placeholder="e.g., 'Week of Jan 15th', 'Healthy Week', 'Quick Meals'"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={state.plan.name}
              onChange={(e) => dispatch({ type: 'UPDATE_PLAN', plan: { name: e.target.value } })}
            />
          </div>

          <div>
            <label htmlFor="planNotes" className="block text-sm font-medium text-gray-700 mb-2">
              Notes (optional)
            </label>
            <textarea
              id="planNotes"
              placeholder="Add any notes about this meal plan..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows={3}
              value={state.plan.notes}
              onChange={(e) => dispatch({ type: 'UPDATE_PLAN', plan: { notes: e.target.value } })}
            />
          </div>
        </div>
      </div>

      {/* Save Buttons */}
      <div className="flex justify-center space-x-4">
        <button
          onClick={handleSavePlan}
          disabled={state.selectedMeals.length === 0 || isLoading}
          className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 font-medium"
        >
          {isLoading ? 'Saving...' : 'Save Plan'}
        </button>
        
        <button
          onClick={handleSaveAndEmailPlan}
          disabled={state.selectedMeals.length === 0 || isLoading}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 font-medium"
        >
          {isLoading ? 'Saving...' : 'Save & Email'}
        </button>
      </div>

      {/* Recipe List Modal */}
      <RecipeListModal
        isOpen={state.isRecipeModalOpen}
        onClose={() => dispatch({ type: 'SET_RECIPE_MODAL_OPEN', isOpen: false })}
        onAddMeal={handleAddMeal}
        selectedMealIds={state.selectedMeals.map(m => m.id)}
      />

      {/* Save Plan Transition */}
      <SavePlanTransition 
        isVisible={state.showSaveTransition}
        onComplete={handleTransitionComplete}
        message={state.transitionMessage}
      />

    </div>
  )
}
