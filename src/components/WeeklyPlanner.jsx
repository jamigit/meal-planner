import { useState, useEffect } from 'react'
import { weeklyPlanService } from '../database/weeklyPlanService.js'
import RecipeSelector from './RecipeSelector'

function WeeklyPlanner() {
  const [weeklyPlan, setWeeklyPlan] = useState({
    meals: [],
    notes: ''
  })
  const [isRecipeSelectorOpen, setIsRecipeSelectorOpen] = useState(false)

  useEffect(() => {
    const loadCurrentPlan = async () => {
      const currentPlan = await weeklyPlanService.getCurrentWithRecipes()
      if (currentPlan) {
        setWeeklyPlan({
          meals: currentPlan.meals || [],
          notes: currentPlan.notes || ''
        })
      }
    }
    loadCurrentPlan()
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
      alert('Weekly plan saved successfully!')
    }
  }

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Weekly Planner</h2>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
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
                    <button
                      onClick={() => handleRemoveMeal(meal.id)}
                      className="text-red-600 hover:text-red-800 text-sm"
                    >
                      Remove
                    </button>
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
      </div>

      <RecipeSelector
        isOpen={isRecipeSelectorOpen}
        onClose={() => setIsRecipeSelectorOpen(false)}
        onSelectRecipes={handleSelectRecipes}
        selectedMealIds={weeklyPlan.meals.map(meal => meal.id).filter(Boolean)}
      />
    </div>
  )
}

export default WeeklyPlanner