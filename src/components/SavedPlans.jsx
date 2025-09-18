import { useState, useEffect } from 'react'
import { weeklyPlanService } from '../database/weeklyPlanService.js'
import { mealHistoryService } from '../database/mealHistoryService.js'
import ShoppingListCard from './ShoppingListCard'

function SavedPlans() {
  const [savedPlans, setSavedPlans] = useState([])
  const [eatenMeals, setEatenMeals] = useState(new Set()) // Track which meals are marked as eaten
  const [activeTabs, setActiveTabs] = useState({}) // Track active tab for each plan (meals/list)

  const loadPlans = async () => {
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
      await weeklyPlanService.delete(planId)
      loadPlans()
    }
  }

  const handleSetAsCurrent = async (planId) => {
    await weeklyPlanService.setAsCurrent(planId)
    loadPlans()
  }

  const handleMarkAsEaten = async (recipe, planCreatedAt) => {
    try {
      // Use plan creation date as the week reference
      const eatenDate = new Date().toISOString().split('T')[0] // Today

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
    <div>
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
                          {meal.url && (
                            <a
                              href={meal.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:text-blue-800 text-sm"
                            >
                              View Recipe →
                            </a>
                          )}
                          {meal.tags && meal.tags.length > 0 && (
                            <div className="flex flex-wrap">
                              {meal.tags.slice(0, 3).map(tag => (
                                <span key={tag} className="tag text-xs">{tag}</span>
                              ))}
                            </div>
                          )}
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
    </div>
  )
}

export default SavedPlans