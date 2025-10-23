import { useState } from 'react'
import { seedDatabase, clearAllRecipes, reseedDatabase } from '../utils/seedDatabase.js'
import { migrateAllRecipes, analyzeExistingTags } from '../utils/tagMigration.js'
import { serviceSelector } from '../services/serviceSelector.js'

// @ai-technical-debt(medium, low, medium) - DevUtils bypasses service layer for direct database access
// This is acceptable for development utilities but should be documented

function DevUtils() {
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState('')

  const handleAction = async (action, actionName) => {
    setLoading(true)
    setResult('')
    try {
      const result = await action()
      setResult(`✅ ${actionName}: ${result.message || 'Success'}`)
      console.log(`${actionName} result:`, result)
    } catch (error) {
      setResult(`❌ ${actionName} failed: ${error.message}`)
      console.error(`${actionName} error:`, error)
    } finally {
      setLoading(false)
    }
  }

  const handleExportData = async () => {
    try {
      // @ai-context: DevUtils needs direct database access for export functionality
      // Using serviceSelector would require authentication checks that aren't needed here
      const recipeService = await serviceSelector.getRecipeService()
      const recipes = await recipeService.getAll()
      const dataStr = JSON.stringify(recipes, null, 2)
      const dataBlob = new Blob([dataStr], { type: 'application/json' })
      const url = URL.createObjectURL(dataBlob)
      const link = document.createElement('a')
      link.href = url
      link.download = `meal-planner-recipes-${new Date().toISOString().split('T')[0]}.json`
      link.click()
      URL.revokeObjectURL(url)
      setResult('✅ Recipe data exported successfully')
    } catch (error) {
      setResult(`❌ Export failed: ${error.message}`)
    }
  }

  const handleCountRecipes = async () => {
    try {
      // @ai-context: DevUtils needs direct database access for count functionality
      const recipeService = await serviceSelector.getRecipeService()
      const recipes = await recipeService.getAll()
      setResult(`📊 Database contains ${recipes.length} recipes`)
    } catch (error) {
      setResult(`❌ Count failed: ${error.message}`)
    }
  }

  // Don't show in production
  if (import.meta.env.PROD) {
    return null
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {!isOpen ? (
        <button
          onClick={() => setIsOpen(true)}
          className="bg-purple-600 text-white px-3 py-2 rounded-full shadow-lg hover:bg-purple-700 transition-colors text-sm"
          title="Developer Utils"
        >
          🔧 Dev
        </button>
      ) : (
        <div className="bg-white rounded-lg shadow-xl border border-gray-200 p-4 w-80">
          <div className="flex justify-between items-center mb-3">
            <h3 className="font-semibold text-gray-900">🔧 Developer Utils</h3>
            <button
              onClick={() => setIsOpen(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              ×
            </button>
          </div>

          <div className="space-y-2 mb-4">
            <button
              onClick={() => handleAction(seedDatabase, 'Seed Database')}
              disabled={loading}
              className="w-full btn-secondary text-sm disabled:opacity-50"
            >
              🌱 Seed Sample Data
            </button>

            <button
              onClick={() => handleAction(reseedDatabase, 'Reseed Database')}
              disabled={loading}
              className="w-full btn-primary text-sm disabled:opacity-50"
            >
              🔄 Clear & Reseed
            </button>

            <button
              onClick={() => handleAction(clearAllRecipes, 'Clear Recipes')}
              disabled={loading}
              className="w-full text-red-600 bg-red-50 hover:bg-red-100 px-3 py-2 rounded border border-red-200 text-sm disabled:opacity-50"
            >
              🗑️ Clear All Recipes
            </button>

            <button
              onClick={() => handleAction(migrateAllRecipes, 'Migrate Tags')}
              disabled={loading}
            className="w-full bg-green-50 text-green-700 hover:bg-green-100 px-3 py-2 rounded border border-green-200 text-sm disabled:opacity-50"
            >
              🏷️ Migrate to Categorized Tags
            </button>

            <div className="border-t pt-2 mt-2">
              <button
                onClick={handleCountRecipes}
                disabled={loading}
                className="w-full bg-gray-50 text-gray-600 hover:bg-gray-100 px-3 py-2 rounded border border-gray-200 text-sm disabled:opacity-50"
              >
                📊 Count Recipes
              </button>

              <button
                onClick={handleExportData}
                disabled={loading}
                className="w-full bg-green-50 text-green-600 hover:bg-green-100 px-3 py-2 rounded border border-green-200 text-sm disabled:opacity-50 mt-2"
              >
                💾 Export Recipe Data
              </button>
            </div>
          </div>

          {loading && (
            <div className="text-center">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-purple-600 mx-auto"></div>
              <p className="text-sm text-gray-500 mt-1">Processing...</p>
            </div>
          )}

          {result && (
            <div className="text-xs p-2 bg-gray-50 rounded border">
              {result}
            </div>
          )}

          <div className="mt-3 text-xs text-gray-500">
            <p><strong>Tip:</strong> Use browser DevTools → Application → IndexedDB → MealPlannerDB to inspect your data directly.</p>
          </div>
        </div>
      )}

    </div>
  )
}

export default DevUtils