import { useState, useEffect } from 'react'
import { weeklyPlanService } from '../database/weeklyPlanService.js'
import { mealHistoryService } from '../database/mealHistoryService.js'
import { claudeAiService } from '../services/claudeAiService.js'
import RecipeSelector from './RecipeSelector'
import AISuggestionModal from './AISuggestionModal'
import ShoppingList from './ShoppingList'
import ShoppingListCard from './ShoppingListCard'

function WeeklyPlanner() {
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

  // Meal tracking state
  const [mealStats, setMealStats] = useState(null)

  // Shopping list state
  const [showShoppingList, setShowShoppingList] = useState(false)
  const [currentPlanId, setCurrentPlanId] = useState(null)

  useEffect(() => {
    const loadCurrentPlan = async () => {
      const currentPlan = await weeklyPlanService.getCurrentWithRecipes()
      if (currentPlan) {
        setWeeklyPlan({
          meals: currentPlan.meals || [],
          notes: currentPlan.notes || ''
        })
        setCurrentPlanId(currentPlan.id)
      }
    }

    const loadMealStats = async () => {
      try {
        const stats = await mealHistoryService.getStatistics()
        setMealStats(stats)
      } catch (error) {
        console.error('Failed to load meal stats:', error)
      }
    }

    loadCurrentPlan()
    loadMealStats()
  }, [])

  const handleSelectRecipes = (selectedRecipes) => {
    setWeeklyPlan(prev => ({
      ...prev,
      meals: selectedRecipes
    }))
  }

  const handleRemoveMeal = (mealId) => {
    setWeeklyPlan(prev => ({
      ...prev,
      meals: prev.meals.filter(meal => meal.id !== mealId)
    }))
  }

  const handleSavePlan = async () => {
    const savedPlan = await weeklyPlanService.save(weeklyPlan)
    if (savedPlan) {
      setCurrentPlanId(savedPlan.id)
      alert('Weekly plan saved successfully!')
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
    setWeeklyPlan(prev => ({
      ...prev,
      meals: selectedRecipes
    }))
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
          className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
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

      {/* Meal Statistics Dashboard */}
      {mealStats && (
        <div className="card mb-6">
          <h3 className="text-lg font-semibold mb-4">📊 Your Meal History</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div className="bg-blue-50 p-3 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{mealStats.totalMeals}</div>
              <div className="text-sm text-gray-600">Total Meals</div>
            </div>
            <div className="bg-green-50 p-3 rounded-lg">
              <div className="text-2xl font-bold text-green-600">{mealStats.uniqueRecipes}</div>
              <div className="text-sm text-gray-600">Unique Recipes</div>
            </div>
            <div className="bg-purple-50 p-3 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">{mealStats.averagePerWeek}</div>
              <div className="text-sm text-gray-600">Avg/Week</div>
            </div>
            <div className="bg-orange-50 p-3 rounded-lg">
              <div className="text-2xl font-bold text-orange-600">{mealStats.topRecipes?.[0]?.frequency || 0}</div>
              <div className="text-sm text-gray-600">Most Made</div>
            </div>
          </div>
          {mealStats.topRecipes && mealStats.topRecipes.length > 0 && (
            <div className="mt-4">
              <h4 className="font-medium text-gray-900 mb-2">Top Recipes:</h4>
              <div className="flex flex-wrap gap-2">
                {mealStats.topRecipes.slice(0, 5).map((recipe, index) => (
                  <span key={recipe.id} className="text-xs bg-gray-100 px-2 py-1 rounded">
                    {recipe.name} ({recipe.frequency}x)
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        <div className="card">
          <h3 className="text-lg font-semibold mb-4">Selected Meals</h3>
          {weeklyPlan.meals.length === 0 ? (
            <p className="text-gray-500">No meals selected yet.</p>
          ) : (
            <div className="space-y-2">
              {weeklyPlan.meals.map((meal) => (
                <div key={meal.id} className="p-3 bg-gray-50 rounded">
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-medium">{meal.name}</h4>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleMarkMealAsEaten(meal)}
                        className="text-green-600 hover:text-green-800 text-sm px-2 py-1 bg-green-100 rounded"
                        title="Mark as eaten"
                      >
                        ✓ Eaten
                      </button>
                      <button
                        onClick={() => handleRemoveMeal(meal.id)}
                        className="text-red-600 hover:text-red-800 text-sm"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                  {meal.url && (
                    <a
                      href={meal.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800 text-sm block mb-2"
                    >
                      View Recipe →
                    </a>
                  )}
                  {meal.tags && meal.tags.length > 0 && (
                    <div className="flex flex-wrap">
                      {meal.tags.map(tag => (
                        <span key={tag} className="tag text-xs">{tag}</span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
          <button
            onClick={() => setIsRecipeSelectorOpen(true)}
            className="btn-primary mt-4"
          >
            Select Meals
          </button>
        </div>

        <div className="card">
          <h3 className="text-lg font-semibold mb-4">Notes</h3>
          <textarea
            value={weeklyPlan.notes}
            onChange={(e) => setWeeklyPlan(prev => ({ ...prev, notes: e.target.value }))}
            placeholder="Add any notes about your meal plan..."
            className="w-full h-32 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <button onClick={handleSavePlan} className="btn-primary mt-4">
            Save Plan
          </button>
        </div>

        {/* Shopping List Card */}
        <ShoppingListCard
          recipes={weeklyPlan.meals}
          weeklyPlanId={currentPlanId}
          className="xl:col-span-1"
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

    </div>
  )
}

export default WeeklyPlanner