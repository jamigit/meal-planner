import { useState, useEffect } from 'react'
import { weeklyPlanService } from '../database/weeklyPlanService.js'

function SavedPlans() {
  const [savedPlans, setSavedPlans] = useState([])

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

              {/* Meals */}
              {plan.meals && plan.meals.length > 0 && (
                <div className="mb-4">
                  <h4 className="font-medium text-gray-900 mb-2">Meals:</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {plan.meals.map((meal, index) => (
                      <div key={meal.id || index} className="flex items-center space-x-2 p-2 bg-gray-50 rounded">
                        <span className="font-medium">{meal.name}</span>
                        {meal.url && (
                          <a
                            href={meal.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-800 text-sm"
                          >
                            →
                          </a>
                        )}
                      </div>
                    ))}
                  </div>
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