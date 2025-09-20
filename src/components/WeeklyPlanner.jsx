import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { weeklyPlanService } from '../database/weeklyPlanService.js'
import { mealHistoryService } from '../database/mealHistoryService.js'
import { claudeAiService } from '../services/claudeAiService.js'
import RecipeSelector from './RecipeSelector'
import AISuggestionModal from './AISuggestionModal'
import ShoppingList from './ShoppingList'
import ShoppingListCard from './ShoppingListCard'
import CategorizedTags from './CategorizedTags'
import RecipeCard from './RecipeCard'

function WeeklyPlanner() {
  const navigate = useNavigate()
  const [weeklyPlan, setWeeklyPlan] = useState({
    meals: [],
    notes: ''
  })
  const [isRecipeSelectorOpen, setIsRecipeSelectorOpen] = useState(false)

  // AI Suggestion state
  const [showAIModal, setShowAIModal] = useState(false)
  const [aiSuggestions, setAISuggestions] = useState([])
  const [isLoadingAI, setIsLoadingAI] = useState(false)
  const [aiError, setAIError] = useState(null)
  const [weekPreferences, setWeekPreferences] = useState('')


  // Shopping list state
  const [showShoppingList, setShowShoppingList] = useState(false)
  const [currentPlanId, setCurrentPlanId] = useState(null)
  const [mealEatenCounts, setMealEatenCounts] = useState({})
  const [sidebarRecipe, setSidebarRecipe] = useState(null) // Recipe to show in sidebar

  useEffect(() => {
    const loadCurrentPlan = async () => {
      const currentPlan = await weeklyPlanService.getCurrentWithRecipes()
      if (currentPlan) {
        // Ensure each meal has a scaling factor
        const mealsWithScaling = (currentPlan.meals || []).map(meal => ({
          ...meal,
          scaling: meal.scaling || 1
        }))
        setWeeklyPlan({
          meals: mealsWithScaling,
          notes: currentPlan.notes || ''
        })
        setCurrentPlanId(currentPlan.id)
      }
    }

    loadCurrentPlan()
  }, [])

  // Load eaten counts whenever meals change
  useEffect(() => {
    const loadEatenCounts = async () => {
      if (weeklyPlan.meals.length > 0) {
        const mealIds = weeklyPlan.meals.map(meal => meal.id)
        const counts = await mealHistoryService.getRecipeEatenCounts(mealIds)
        setMealEatenCounts(counts)
      } else {
        setMealEatenCounts({})
      }
    }

    loadEatenCounts()
  }, [weeklyPlan.meals])

  const handleSelectRecipes = (selectedRecipes) => {
    // Add default scaling factor of 1 to each recipe
    const mealsWithScaling = selectedRecipes.map(recipe => ({
      ...recipe,
      scaling: recipe.scaling || 1
    }))
    setWeeklyPlan(prev => ({
      ...prev,
      meals: mealsWithScaling
    }))
    // Clear currentPlanId since this is now a new unsaved selection
    setCurrentPlanId(null)
  }

  const handleRemoveMeal = (mealId) => {
    setWeeklyPlan(prev => ({
      ...prev,
      meals: prev.meals.filter(meal => meal.id !== mealId)
    }))
    // Clear currentPlanId since this modifies the plan
    setCurrentPlanId(null)
  }

  const handleScalingChange = (mealId, newScaling) => {
    setWeeklyPlan(prev => ({
      ...prev,
      meals: prev.meals.map(meal =>
        meal.id === mealId
          ? { ...meal, scaling: parseInt(newScaling) }
          : meal
      )
    }))
    // Clear currentPlanId since this modifies the plan
    setCurrentPlanId(null)
  }

  const handleSavePlan = async () => {
    const savedPlan = await weeklyPlanService.save(weeklyPlan)
    if (savedPlan) {
      setCurrentPlanId(savedPlan.id)
      // Clear the selected meals and notes
      setWeeklyPlan({
        meals: [],
        notes: ''
      })
      alert('Weekly plan saved successfully!')
      // Navigate to saved plans page
      navigate('/saved-plans')
    }
  }

  const handleShowShoppingList = () => {
    if (weeklyPlan.meals.length === 0) {
      alert('Please add some meals to your weekly plan first.')
      return
    }
    setShowShoppingList(true)
  }

  // AI Suggestion handlers
  const handleGetAISuggestions = async () => {
    setIsLoadingAI(true)
    setAIError(null)
    setShowAIModal(true)
    setAISuggestions([])

    try {
      console.log('🤖 Requesting AI suggestions with preferences:', weekPreferences)
      const result = await claudeAiService.generateMealSuggestions(weekPreferences)

      if (result.success) {
        setAISuggestions(result.data)
        console.log('✅ AI suggestions generated:', result.data)
      } else {
        setAIError(result.error)
        // Try to use fallback suggestions if available
        if (result.fallback && result.fallback.length > 0) {
          setAISuggestions(result.fallback)
          setAIError(`${result.error} (showing fallback suggestions)`)
        }
      }
    } catch (error) {
      console.error('Failed to get AI suggestions:', error)
      setAIError('Unable to generate suggestions. Please try again later.')
    } finally {
      setIsLoadingAI(false)
    }
  }

  const handleSelectAIMeals = (selectedRecipes) => {
    console.log('🍽️ Selected AI meals:', selectedRecipes)
    // Add default scaling factor of 1 to each recipe
    const mealsWithScaling = selectedRecipes.map(recipe => ({
      ...recipe,
      scaling: recipe.scaling || 1
    }))
    setWeeklyPlan(prev => ({
      ...prev,
      meals: mealsWithScaling
    }))
    // Clear currentPlanId since this is now a new unsaved selection
    setCurrentPlanId(null)
    setShowAIModal(false)
  }

  const handleCloseAIModal = () => {
    setShowAIModal(false)
    setAISuggestions([])
    setAIError(null)
    setIsLoadingAI(false)
  }

  // Mark meal as eaten from current plan
  const handleMarkMealAsEaten = async (meal) => {
    try {
      const eatenDate = new Date().toISOString().split('T')[0] // Today
      await mealHistoryService.addMealToHistory(meal.id, eatenDate)

      console.log(`✅ Marked "${meal.name}" as eaten from current plan`)

      // Optional: Remove from current plan or show visual feedback
      // For now, just log success
    } catch (error) {
      console.error('Failed to mark meal as eaten:', error)
      alert('Failed to mark meal as eaten. Please try again.')
    }
  }

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Weekly Planner</h2>

      {/* AI Suggestion Section */}
      <div className="card mb-6">
        <h3 className="text-lg font-semibold mb-4">🤖 AI-Powered Meal Suggestions</h3>
        <p className="text-gray-600 mb-4">
          Get personalized meal recommendations based on your history and preferences
        </p>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Weekly Preferences (optional)
          </label>
          <textarea
            value={weekPreferences}
            onChange={(e) => setWeekPreferences(e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            rows="3"
            placeholder="Any preferences for this week? (e.g., 'feeling like healthy meals', 'have chicken in fridge', 'want something quick')"
          />
        </div>

        <button
          onClick={handleGetAISuggestions}
          disabled={isLoadingAI}
          className="btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoadingAI ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2 inline-block"></div>
              Generating Suggestions...
            </>
          ) : (
            <>🤖 Get AI Suggestions</>
          )}
        </button>
      </div>


      {/* Selected Meals and Shopping List Section - Side by Side */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        <div className="card">
          <h3 className="text-lg font-semibold mb-4">Selected Meals</h3>
          {weeklyPlan.meals.length === 0 ? (
            <p className="text-gray-500">No meals selected yet.</p>
          ) : (
            <div className="space-y-2">
              {weeklyPlan.meals.map((meal) => (
                <div key={meal.id} className="p-3 bg-gray-50 rounded">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex-1">
                      <h4 className="font-medium">{meal.name}</h4>
                      {mealEatenCounts[meal.id] !== undefined && (
                        <div className="text-sm text-gray-500 mt-1">
                          Eaten {mealEatenCounts[meal.id]} times in last 8 weeks
                        </div>
                      )}
                      <div className="flex items-center mt-2">
                        <label className="text-sm text-gray-600 mr-2">Servings:</label>
                        <select
                          value={meal.scaling || 1}
                          onChange={(e) => handleScalingChange(meal.id, e.target.value)}
                          className="text-sm border border-gray-300 rounded px-2 py-1 bg-white"
                        >
                          <option value={1}>1x</option>
                          <option value={2}>2x</option>
                          <option value={3}>3x</option>
                          <option value={4}>4x</option>
                        </select>
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <button
                        onClick={() => handleRemoveMeal(meal.id)}
                        className="text-red-600 hover:text-red-800 text-sm"
                      >
                        Remove
                      </button>
                    </div>
                  </div>

                  <CategorizedTags recipe={meal} className="mb-3" />

                  {/* Recipe Links */}
                  <div className="flex items-center space-x-3">
                    <button
                      onClick={() => setSidebarRecipe(meal)}
                      className="text-blue-600 hover:text-blue-800 text-sm px-2 py-1 bg-blue-50 rounded hover:bg-blue-100 transition-colors"
                    >
                      View Recipe
                    </button>
                    {meal.url && (
                      <a
                        href={meal.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-gray-600 hover:text-gray-800 text-sm flex items-center gap-1"
                        title="Open original recipe in new window"
                      >
                        Open Original
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
          <button
            onClick={() => setIsRecipeSelectorOpen(true)}
            className="btn-secondary mt-4"
          >
            Select Meals
          </button>
        </div>

        {/* Shopping List Card */}
        <ShoppingListCard
          recipes={weeklyPlan.meals}
          weeklyPlanId={currentPlanId}
        />
      </div>

      {/* Notes Section - Full Width */}
      <div className="card">
        <h3 className="text-lg font-semibold mb-4">Notes</h3>
        <textarea
          value={weeklyPlan.notes}
          onChange={(e) => setWeeklyPlan(prev => ({ ...prev, notes: e.target.value }))}
          placeholder="Add any notes about your meal plan..."
          className="w-full h-32 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      <RecipeSelector
        isOpen={isRecipeSelectorOpen}
        onClose={() => setIsRecipeSelectorOpen(false)}
        onSelectRecipes={handleSelectRecipes}
        selectedMealIds={weeklyPlan.meals.map(meal => meal.id).filter(Boolean)}
      />

      <AISuggestionModal
        isOpen={showAIModal}
        onClose={handleCloseAIModal}
        suggestions={aiSuggestions}
        onSelectMeals={handleSelectAIMeals}
        isLoading={isLoadingAI}
        error={aiError}
      />

      {/* Save Plan Button at Bottom */}
      <div className="mt-8 text-center">
        <button onClick={handleSavePlan} className="btn-primary">
          Save Plan
        </button>
      </div>

      {/* Recipe Sidebar */}
      {sidebarRecipe && (
        <div className="fixed inset-y-0 right-0 w-96 bg-white shadow-xl z-50 overflow-y-auto border-l border-gray-200">
          <div className="p-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Recipe Details</h3>
              <button
                onClick={() => setSidebarRecipe(null)}
                className="text-gray-400 hover:text-gray-600 text-2xl"
              >
                ×
              </button>
            </div>
            <RecipeCard
              recipe={sidebarRecipe}
              showDetails={true}
            />
          </div>
        </div>
      )}

      {/* Sidebar Backdrop */}
      {sidebarRecipe && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={() => setSidebarRecipe(null)}
        ></div>
      )}

    </div>
  )
}

export default WeeklyPlanner