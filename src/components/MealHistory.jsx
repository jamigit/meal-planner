import { useState, useEffect } from 'react'
import { mealHistoryService } from '../database/mealHistoryService.js'
import CategorizedTags from './CategorizedTags'

function MealHistory() {
  const [mealStats, setMealStats] = useState(null)
  const [recentHistory, setRecentHistory] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadMealHistory()
  }, [])

  const loadMealHistory = async () => {
    setLoading(true)
    try {
      // Load meal statistics
      const { regular, lessRegular } = await mealHistoryService.categorizeRecipesByFrequency()
      const recentMealIds = await mealHistoryService.getRecentMeals(2)

      setMealStats({
        regular,
        lessRegular,
        recentMealIds
      })

      // Load recent meal history with details
      const history = await mealHistoryService.getRecentHistoryWithDetails(30) // Last 30 days
      setRecentHistory(history)

    } catch (error) {
      console.error('Failed to load meal history:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  const getFrequencyColor = (frequency) => {
    if (frequency >= 5) return 'text-green-600 bg-green-100'
    if (frequency >= 3) return 'text-blue-600 bg-blue-100'
    if (frequency >= 1) return 'text-yellow-600 bg-yellow-100'
    return 'text-gray-600 bg-gray-100'
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-3 text-gray-600">Loading meal history...</span>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Meal History</h1>
        <p className="text-gray-600">Your eating patterns and statistics</p>
      </div>

      {/* Meal Frequency Statistics */}
      {mealStats && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Regular Meals */}
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <span className="mr-2">🔥</span>
              Frequently Eaten Meals
              <span className="ml-2 text-sm font-normal text-gray-500">
                (3+ times in 8 weeks)
              </span>
            </h3>
            {mealStats.regular.length === 0 ? (
              <p className="text-gray-500 italic">No frequently eaten meals yet</p>
            ) : (
              <div className="space-y-3">
                {mealStats.regular.map((meal) => (
                  <div key={meal.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                    <div>
                      <h4 className="font-medium text-gray-900">{meal.name}</h4>
                      <CategorizedTags recipe={meal} className="mt-1" />
                    </div>
                    <span className={`px-2 py-1 rounded-full text-sm font-medium ${getFrequencyColor(meal.frequency)}`}>
                      {meal.frequency}x
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Less Regular Meals */}
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <span className="mr-2">📊</span>
              Occasionally Eaten Meals
              <span className="ml-2 text-sm font-normal text-gray-500">
                (0-2 times in 8 weeks)
              </span>
            </h3>
            {mealStats.lessRegular.length === 0 ? (
              <p className="text-gray-500 italic">No occasional meals tracked</p>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {mealStats.lessRegular.map((meal) => (
                  <div key={meal.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                    <div>
                      <h4 className="font-medium text-gray-900">{meal.name}</h4>
                      <CategorizedTags recipe={meal} className="mt-1" />
                    </div>
                    <span className={`px-2 py-1 rounded-full text-sm font-medium ${getFrequencyColor(meal.frequency || 0)}`}>
                      {meal.frequency || 0}x
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Recent Meal History */}
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <span className="mr-2">📅</span>
          Recent Meal History
          <span className="ml-2 text-sm font-normal text-gray-500">
            (Last 30 days)
          </span>
        </h3>

        {recentHistory.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500 mb-4">No meal history yet</p>
            <p className="text-sm text-gray-400">
              Start marking meals as eaten to see your history here
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {recentHistory.map((entry, index) => (
              <div key={index} className="flex justify-between items-center p-3 border border-gray-200 rounded-lg">
                <div>
                  <h4 className="font-medium text-gray-900">{entry.recipe_name}</h4>
                  <div className="text-sm text-gray-600 mt-1">
                    Eaten on {formatDate(entry.eaten_date)}
                  </div>
                  <CategorizedTags recipe={entry} className="mt-2" />
                </div>
                <div className="text-right text-sm text-gray-500">
                  {Math.floor((new Date() - new Date(entry.eaten_date)) / (1000 * 60 * 60 * 24))} days ago
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Summary Stats */}
      {mealStats && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="card text-center">
            <div className="text-3xl font-bold text-blue-600">
              {mealStats.regular.length}
            </div>
            <div className="text-sm text-gray-600 mt-1">Frequent Favorites</div>
          </div>

          <div className="card text-center">
            <div className="text-3xl font-bold text-green-600">
              {mealStats.lessRegular.length}
            </div>
            <div className="text-sm text-gray-600 mt-1">Occasional Meals</div>
          </div>

          <div className="card text-center">
            <div className="text-3xl font-bold text-purple-600">
              {recentHistory.length}
            </div>
            <div className="text-sm text-gray-600 mt-1">Meals Last 30 Days</div>
          </div>
        </div>
      )}
    </div>
  )
}

export default MealHistory