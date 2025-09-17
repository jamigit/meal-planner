import { useState, useEffect } from 'react'
import { weeklyPlanStorage } from '../utils/localStorage'

function WeeklyPlanner() {
  const [weeklyPlan, setWeeklyPlan] = useState({
    meals: [],
    notes: ''
  })

  useEffect(() => {
    const currentPlan = weeklyPlanStorage.getCurrent()
    if (currentPlan) {
      setWeeklyPlan({
        meals: currentPlan.meals || [],
        notes: currentPlan.notes || ''
      })
    }
  }, [])

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
              {weeklyPlan.meals.map((meal, index) => (
                <div key={index} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                  <span>{meal.name}</span>
                  <button className="text-red-600 hover:text-red-800 text-sm">Remove</button>
                </div>
              ))}
            </div>
          )}
          <button className="btn-primary mt-4">Select Meals</button>
        </div>

        <div className="card">
          <h3 className="text-lg font-semibold mb-4">Notes</h3>
          <textarea
            value={weeklyPlan.notes}
            onChange={(e) => setWeeklyPlan(prev => ({ ...prev, notes: e.target.value }))}
            placeholder="Add any notes about your meal plan..."
            className="w-full h-32 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <button className="btn-primary mt-4">Save Plan</button>
        </div>
      </div>
    </div>
  )
}

export default WeeklyPlanner