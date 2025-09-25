import { useState, useEffect } from 'react'
import { serviceSelector } from '../services/serviceSelector.js'

function MealHistory() {
  const [mealStats, setMealStats] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadMealHistory()
  }, [])

  const loadMealHistory = async () => {
    setLoading(true)
    try {
      const mealHistoryService = await serviceSelector.getMealHistoryService()
      
      // Load meal statistics
      const { regular, lessRegular } = await mealHistoryService.categorizeRecipesByFrequency()
      setMealStats({ regular, lessRegular })

    } catch (error) {
      console.error('Failed to load meal history:', error)
    } finally {
      setLoading(false)
    }
  }

  const allMealsSorted = () => {
    if (!mealStats) return []
    const combined = [...(mealStats.regular || []), ...(mealStats.lessRegular || [])]
    return combined
      .map(m => ({ id: m.id, name: m.name, frequency: m.frequency || 0 }))
      .sort((a, b) => b.frequency - a.frequency || a.name.localeCompare(b.name))
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
        <span className="ml-3 text-gray-600">Loading meal history...</span>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <h1 className="font-heading text-display-2 uppercase text-black">Meal History</h1>

      {mealStats ? (
        <div className="card">
          <ul className="divide-y divide-black/10">
            {allMealsSorted().map((meal) => (
              <li key={meal.id} className="flex justify-between items-center py-2">
                <span className="text-black font-medium">{meal.name}</span>
                <span className="text-black font-bold">{meal.frequency}x</span>
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <div className="text-center py-8 text-black">No meal history yet</div>
      )}
    </div>
  )
}

export default MealHistory