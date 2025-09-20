import { useState, useEffect } from 'react'
import { serviceSelector } from '../services/serviceSelector.js'
import ShoppingListCard from './ShoppingListCard'
import RecipeCard from './RecipeCard'

function SavedPlans() {
  const [savedPlans, setSavedPlans] = useState([])
  const [eatenMeals, setEatenMeals] = useState(new Set()) // Track which meals are marked as eaten
  const [activeTabs, setActiveTabs] = useState({}) // Track active tab for each plan (meals/list)
  const [sidebarRecipe, setSidebarRecipe] = useState(null) // Recipe to show in sidebar

  // Lock/unlock body scroll when sidebar opens/closes
  useEffect(() => {
    if (sidebarRecipe) {
      // Lock body scroll
      document.body.style.overflow = 'hidden'
    } else {
      // Unlock body scroll
      document.body.style.overflow = 'unset'
    }

    // Cleanup function to ensure scroll is unlocked when component unmounts
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [sidebarRecipe])

  const loadPlans = async () => {
    const weeklyPlanService = await serviceSelector.getWeeklyPlanService()
    const plans = await weeklyPlanService.getAllWithRecipes()
    setSavedPlans(plans)
  }

  useEffect(() => {
    loadPlans()
  }, [])

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const handleDeletePlan = async (planId) => {
    if (confirm('Are you sure you want to delete this plan?')) {
      const weeklyPlanService = await serviceSelector.getWeeklyPlanService()
      await weeklyPlanService.delete(planId)
      loadPlans()
    }
  }

  const handleSetAsCurrent = async (planId) => {
    const weeklyPlanService = await serviceSelector.getWeeklyPlanService()
    await weeklyPlanService.setAsCurrent(planId)
    loadPlans()
  }

  const handleMarkAsEaten = async (recipe, planCreatedAt) => {
    try {
      // Use plan creation date as the week reference
      const eatenDate = new Date().toISOString().split('T')[0] // Today

      const mealHistoryService = await serviceSelector.getMealHistoryService()
      await mealHistoryService.addMealToHistory(recipe.id, eatenDate)

      // Add to eaten meals set for UI feedback
      setEatenMeals(prev => new Set([...prev, `${recipe.id}-${planCreatedAt}`]))

      console.log(`✅ Marked "${recipe.name}" as eaten`)

      // Optional: Show success feedback
      // Could add a toast notification here in the future

    } catch (error) {
      console.error('Failed to mark meal as eaten:', error)
      alert('Failed to mark meal as eaten. Please try again.')
    }
  }

  const isMealEaten = (recipeId, planCreatedAt) => {
    return eatenMeals.has(`${recipeId}-${planCreatedAt}`)
  }

  const getActiveTab = (planId) => {
    return activeTabs[planId] || 'meals'
  }

  const setActiveTab = (planId, tab) => {
    setActiveTabs(prev => ({ ...prev, [planId]: tab }))
  }

  return (
    <div className="relative">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Saved Plans</h2>
        <p className="text-gray-600">{savedPlans.length} saved plan{savedPlans.length !== 1 ? 's' : ''}</p>
      </div>

      {savedPlans.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500 mb-4">No saved plans yet.</p>
          <p className="text-sm text-gray-400">
            Create a weekly plan and save it to see it here.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {savedPlans.map((plan) => (
            <div key={plan.id} className="card">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-lg font-semibold">
                      Plan from {formatDate(plan.created_at)}
                    </h3>
                    {plan.is_current && (
                      <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-medium">
                        Current
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-500">
                    {plan.meals?.length || 0} meal{(plan.meals?.length || 0) !== 1 ? 's' : ''}
                  </p>
                </div>

                <div className="flex space-x-2">
                  {!plan.is_current && (
                    <button
                      onClick={() => handleSetAsCurrent(plan.id)}
                      className="btn-secondary text-sm"
                    >
                      Set as Current
                    </button>
                  )}
                  <button
                    onClick={() => handleDeletePlan(plan.id)}
                    className="text-red-600 hover:text-red-800 text-sm px-3 py-1 rounded border border-red-200 hover:border-red-300"
                  >
                    Delete
                  </button>
                </div>
              </div>

              {/* Tabs */}
              <div className="flex border-b border-gray-200 mb-4">
                <button
                  onClick={() => setActiveTab(plan.id, 'meals')}
                  className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                    getActiveTab(plan.id) === 'meals'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Meals ({plan.meals?.length || 0})
                </button>
                <button
                  onClick={() => setActiveTab(plan.id, 'shopping')}
                  className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                    getActiveTab(plan.id) === 'shopping'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Shopping List
                </button>
              </div>

              {/* Tab Content */}
              {getActiveTab(plan.id) === 'meals' && plan.meals && plan.meals.length > 0 && (
                <div className="mb-4">
                  <div className="grid grid-cols-1 gap-3">
                    {plan.meals.map((meal, index) => (
                      <div key={meal.id || index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <span className="font-medium">{meal.name}</span>
                          <button
                            onClick={() => setSidebarRecipe(meal)}
                            className="text-blue-600 hover:text-blue-800 text-sm px-2 py-1 bg-blue-50 rounded hover:bg-blue-100 transition-colors"
                          >
                            View Recipe
                          </button>
                        </div>

                        <div className="flex items-center space-x-2">
                          {isMealEaten(meal.id, plan.created_at) ? (
                            <span className="text-green-600 text-sm font-medium flex items-center">
                              <span className="text-green-600 mr-1">✓</span>
                              Eaten
                            </span>
                          ) : (
                            <button
                              onClick={() => handleMarkAsEaten(meal, plan.created_at)}
                              className="text-sm px-3 py-1 bg-green-100 text-green-700 hover:bg-green-200 rounded-full transition-colors"
                            >
                              Mark as Eaten
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {getActiveTab(plan.id) === 'shopping' && (
                <div className="mb-4">
                  <ShoppingListCard
                    recipes={plan.meals || []}
                    weeklyPlanId={plan.id}
                    className="border-0 p-0 shadow-none bg-transparent"
                  />
                </div>
              )}

              {/* Notes */}
              {plan.notes && (
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Notes:</h4>
                  <p className="text-gray-700 bg-gray-50 p-3 rounded whitespace-pre-wrap">
                    {plan.notes}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Sidebar Backdrop */}
      {sidebarRecipe && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50"
          style={{ zIndex: 1000 }}
          onClick={() => setSidebarRecipe(null)}
        ></div>
      )}

      {/* Recipe Sidebar */}
      {sidebarRecipe && (
        <div 
          className="fixed inset-y-0 right-0 w-96 bg-white shadow-xl border-l border-gray-200 flex flex-col"
          style={{ zIndex: 1001 }}
        >
          {/* Fixed Header */}
          <div className="sticky top-0 flex-shrink-0 p-4 border-b border-gray-200 bg-white z-10">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-900">Recipe Details</h3>
              <button
                onClick={() => setSidebarRecipe(null)}
                className="flex items-center gap-2 px-3 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <span className="text-lg">×</span>
                <span className="text-sm font-medium">Close</span>
              </button>
            </div>
          </div>
          
          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto p-4">
            <RecipeCard
              recipe={sidebarRecipe}
              showDetails={true}
            />
          </div>
        </div>
      )}
    </div>
  )
}

export default SavedPlans