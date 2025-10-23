import { useState, useEffect } from 'react'
import { serviceSelector } from '../services/serviceSelector.js'

// @ai-technical-debt(low, low, low) - Debug component bypasses service layer for direct access
// This is acceptable for debug utilities but should be documented

function MealHistoryDebug() {
  const [stats, setStats] = useState(null)
  const [categories, setCategories] = useState({ regular: [], lessRegular: [] })
  const [recentHistory, setRecentHistory] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadData = async () => {
      try {
        // @ai-context: Debug component needs direct database access for analytics
        // Using serviceSelector would require authentication checks that aren't needed here
        const mealHistoryService = await serviceSelector.getMealHistoryService()
        
        // Load statistics
        const statsData = await mealHistoryService.getStatistics()
        setStats(statsData)

        // Load categorization
        const categoriesData = await mealHistoryService.categorizeRecipesByFrequency()
        setCategories(categoriesData)

        // Load recent history with recipes
        const historyData = await mealHistoryService.getHistoryWithRecipes(2)
        setRecentHistory(historyData)

        setLoading(false)
        console.log('Meal History Debug Data:', { statsData, categoriesData, historyData })
      } catch (error) {
        console.error('Failed to load meal history data:', error)
        setLoading(false)
      }
    }

    loadData()
  }, [])

  if (loading) {
    return (
      <div className="card">
        <h3 className="text-lg font-semibold mb-4">🔍 Meal History Debug</h3>
        <p>Loading meal history data...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="card">
        <h3 className="text-lg font-semibold mb-4">🔍 Meal History Debug</h3>

        {/* Statistics */}
        <div className="mb-6">
          <h4 className="font-medium mb-2">Statistics</h4>
          {stats ? (
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
              <div className="bg-blue-50 p-2 rounded">
                <div className="font-medium text-blue-800">{stats.totalEntries}</div>
                <div className="text-blue-600">Total Entries</div>
              </div>
              <div className="bg-green-50 p-2 rounded">
                <div className="font-medium text-green-800">{stats.uniqueRecipes}</div>
                <div className="text-green-600">Unique Recipes</div>
              </div>
              <div className="bg-purple-50 p-2 rounded">
                <div className="font-medium text-purple-800">{stats.regularRecipes}</div>
                <div className="text-purple-600">Regular (3+)</div>
              </div>
              <div className="bg-orange-50 p-2 rounded">
                <div className="font-medium text-orange-800">{stats.lessRegularRecipes}</div>
                <div className="text-orange-600">Less Regular</div>
              </div>
              <div className="bg-gray-50 p-2 rounded">
                <div className="font-medium text-gray-800">{stats.averageFrequency.toFixed(1)}</div>
                <div className="text-gray-600">Avg Frequency</div>
              </div>
            </div>
          ) : (
            <p className="text-gray-500">No statistics available</p>
          )}
        </div>

        {/* Regular Recipes */}
        <div className="mb-6">
          <h4 className="font-medium mb-2">Regular Recipes (3+ times)</h4>
          {categories.regular.length > 0 ? (
            <div className="space-y-2">
              {categories.regular.map(recipe => (
                <div key={recipe.id} className="flex justify-between items-center p-2 bg-green-50 rounded">
                  <span className="font-medium">{recipe.name}</span>
                  <span className="text-sm text-green-600">{recipe.frequency}x</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500">No regular recipes found</p>
          )}
        </div>

        {/* Less Regular Recipes */}
        <div className="mb-6">
          <h4 className="font-medium mb-2">Less Regular Recipes (0-2 times)</h4>
          {categories.lessRegular.length > 0 ? (
            <div className="space-y-2">
              {categories.lessRegular.slice(0, 5).map(recipe => (
                <div key={recipe.id} className="flex justify-between items-center p-2 bg-orange-50 rounded">
                  <span className="font-medium">{recipe.name}</span>
                  <span className="text-sm text-orange-600">{recipe.frequency}x</span>
                </div>
              ))}
              {categories.lessRegular.length > 5 && (
                <p className="text-sm text-gray-500">... and {categories.lessRegular.length - 5} more</p>
              )}
            </div>
          ) : (
            <p className="text-gray-500">No less regular recipes found</p>
          )}
        </div>

        {/* Recent History */}
        <div>
          <h4 className="font-medium mb-2">Recent History (Last 2 weeks)</h4>
          {recentHistory.length > 0 ? (
            <div className="space-y-2">
              {recentHistory.slice(0, 8).map((entry, index) => (
                <div key={entry.id || index} className="flex justify-between items-center p-2 bg-blue-50 rounded text-sm">
                  <span className="font-medium">{entry.recipe?.name || 'Unknown Recipe'}</span>
                  <span className="text-blue-600">{entry.eaten_date}</span>
                </div>
              ))}
              {recentHistory.length > 8 && (
                <p className="text-sm text-gray-500">... and {recentHistory.length - 8} more entries</p>
              )}
            </div>
          ) : (
            <p className="text-gray-500">No recent history found</p>
          )}
        </div>
      </div>
    </div>
  )
}

export default MealHistoryDebug