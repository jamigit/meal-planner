import { useState, useEffect } from 'react'
import { shoppingListService } from '../services/shoppingListService.js'

function ShoppingList({ recipes, weeklyPlanId, isOpen, onClose }) {
  const [shoppingList, setShoppingList] = useState({})
  const [loading, setLoading] = useState(false)
  const [groupByRecipe, setGroupByRecipe] = useState(false)
  const [excludePantry, setExcludePantry] = useState(true)
  const [copySuccess, setCopySuccess] = useState(false)

  useEffect(() => {
    if (isOpen && recipes && recipes.length > 0) {
      generateShoppingList()
    }
  }, [isOpen, recipes, excludePantry])

  const generateShoppingList = async () => {
    setLoading(true)
    try {
      const list = await shoppingListService.generateShoppingList(recipes, excludePantry)
      setShoppingList(list)

      // Save to database if we have a weekly plan ID
      if (weeklyPlanId) {
        await shoppingListService.saveShoppingList(weeklyPlanId, list)
      }
    } catch (error) {
      console.error('Failed to generate shopping list:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCopyToClipboard = async () => {
    try {
      const text = shoppingListService.generateCopyText(shoppingList, groupByRecipe)
      await navigator.clipboard.writeText(text)
      setCopySuccess(true)
      setTimeout(() => setCopySuccess(false), 2000)
    } catch (error) {
      console.error('Failed to copy to clipboard:', error)
      // Fallback: create a text area and select the text
      const textArea = document.createElement('textarea')
      textArea.value = shoppingListService.generateCopyText(shoppingList, groupByRecipe)
      document.body.appendChild(textArea)
      textArea.select()
      document.execCommand('copy')
      document.body.removeChild(textArea)
      setCopySuccess(true)
      setTimeout(() => setCopySuccess(false), 2000)
    }
  }

  const getTotalItems = () => {
    return Object.values(shoppingList).reduce((total, items) => total + items.length, 0)
  }

  const getRecipeBasedView = () => {
    const byRecipe = {}

    for (const [category, items] of Object.entries(shoppingList)) {
      for (const item of items) {
        for (const source of item.sources) {
          if (!byRecipe[source.recipe]) {
            byRecipe[source.recipe] = []
          }
          byRecipe[source.recipe].push({
            ...item,
            displayText: source.original,
            category
          })
        }
      }
    }

    return byRecipe
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-screen overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 border-b flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Shopping List</h2>
            {!loading && (
              <p className="text-gray-600 mt-1">
                {getTotalItems()} items from {recipes?.length || 0} recipes
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl"
          >
            ×
          </button>
        </div>

        {/* Controls */}
        <div className="p-4 border-b bg-gray-50 flex flex-wrap gap-4 items-center justify-between">
          <div className="flex flex-wrap gap-4 items-center">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={groupByRecipe}
                onChange={(e) => setGroupByRecipe(e.target.checked)}
                className="mr-2"
              />
              <span className="text-sm font-medium">Group by recipe</span>
            </label>

            <label className="flex items-center">
              <input
                type="checkbox"
                checked={excludePantry}
                onChange={(e) => setExcludePantry(e.target.checked)}
                className="mr-2"
              />
              <span className="text-sm font-medium">Exclude pantry staples</span>
            </label>
          </div>

          <button
            onClick={handleCopyToClipboard}
            disabled={loading || getTotalItems() === 0}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              copySuccess
                ? 'bg-green-600 text-white'
                : 'bg-blue-600 hover:bg-blue-700 text-white disabled:bg-gray-300 disabled:cursor-not-allowed'
            }`}
          >
            {copySuccess ? '✓ Copied!' : '📋 Copy All'}
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="text-center py-8">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <p className="text-gray-600 mt-2">Generating shopping list...</p>
            </div>
          ) : getTotalItems() === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">No ingredients found for the selected recipes.</p>
            </div>
          ) : (
            <div className="space-y-6">
              {groupByRecipe ? (
                // Recipe-based view
                Object.entries(getRecipeBasedView()).map(([recipe, items]) => (
                  <div key={recipe} className="bg-gray-50 rounded-lg p-4">
                    <h3 className="font-semibold text-gray-900 mb-3">{recipe}</h3>
                    <div className="space-y-1">
                      {items.map((item, index) => (
                        <div key={index} className="text-sm text-gray-700 flex">
                          <span className="mr-2">•</span>
                          <span>{item.displayText}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))
              ) : (
                // Category-based view
                Object.entries(shoppingList).map(([category, items]) => {
                  if (items.length === 0) return null

                  return (
                    <div key={category} className="bg-gray-50 rounded-lg p-4">
                      <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
                        <span className="mr-2">{getCategoryIcon(category)}</span>
                        {category}
                        <span className="ml-2 text-sm font-normal text-gray-500">
                          ({items.length} items)
                        </span>
                      </h3>
                      <div className="space-y-2">
                        {items.map((item, index) => (
                          <div key={index} className="bg-white rounded p-3 text-sm">
                            <div className="font-medium text-gray-900">
                              {shoppingListService.formatQuantity(item.quantity, item.unit)} {item.item}
                            </div>
                            <div className="text-gray-600 text-xs mt-1">
                              From: {item.sources.map(s => `${s.recipe} (${s.original})`).join(', ')}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t bg-gray-50 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}

function getCategoryIcon(category) {
  const icons = {
    'Produce': '🥬',
    'Meat & Seafood': '🥩',
    'Dairy & Eggs': '🥛',
    'Pantry & Dry Goods': '🏺',
    'Canned & Jarred': '🥫',
    'Frozen': '🧊',
    'Other': '📦'
  }
  return icons[category] || '📦'
}

export default ShoppingList