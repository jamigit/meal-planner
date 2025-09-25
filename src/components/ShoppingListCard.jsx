import { useState, useEffect } from 'react'
import { shoppingListService } from '../services/shoppingListService.js'

function ShoppingListCard({ recipes, weeklyPlanId, className = '', showTitle = false }) {
  const [shoppingList, setShoppingList] = useState({})
  const [loading, setLoading] = useState(false)
  const [groupByRecipe, setGroupByRecipe] = useState(false)
  const [excludePantry, setExcludePantry] = useState(true)
  const [copySuccess, setCopySuccess] = useState(false)

  useEffect(() => {
    if (recipes && recipes.length > 0) {
      generateShoppingList()
    } else {
      setShoppingList({})
    }
  }, [recipes, excludePantry])

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

          // Use scaled quantity if available, otherwise use original
          const displayText = source.scaled
            ? `${shoppingListService.formatQuantity(source.quantity, source.unit)} ${item.item} (${source.scaling}x)`
            : source.original

          byRecipe[source.recipe].push({
            ...item,
            displayText,
            category,
            scaled: source.scaled,
            scaling: source.scaling
          })
        }
      }
    }

    return byRecipe
  }

  if (!recipes || recipes.length === 0) {
    return (
      <div className={`card ${className}`}>
        {showTitle && (
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-black">Shopping List</h3>
          </div>
        )}
        <div className="text-center py-8 text-black">
          Add meals to generate shopping list
        </div>
      </div>
    )
  }

  return (
    <div className={`card ${className}`}>
      {showTitle && (
        <div className="mb-2">
          <h3 className="text-lg font-semibold text-black">Shopping List</h3>
        </div>
      )}

      {/* Controls */}
      <div className="flex flex-wrap gap-3 mb-4 text-sm items-center">
        {/* View toggle */}
        <div className="inline-flex items-center rounded-full border-2 border-black overflow-hidden">
          <button
            type="button"
            onClick={() => setGroupByRecipe(true)}
            className={`px-3 py-1 text-xs font-medium ${groupByRecipe ? 'bg-black text-white' : 'bg-white text-black'}`}
          >
            By recipe
          </button>
          <button
            type="button"
            onClick={() => setGroupByRecipe(false)}
            className={`px-3 py-1 text-xs font-medium border-l-2 border-black ${!groupByRecipe ? 'bg-black text-white' : 'bg-white text-black'}`}
          >
            By item
          </button>
        </div>

        <label className="flex items-center">
          <input
            type="checkbox"
            checked={excludePantry}
            onChange={(e) => setExcludePantry(e.target.checked)}
            className="mr-1 scale-75"
          />
          <span>Hide pantry</span>
        </label>

        <button
          onClick={handleCopyToClipboard}
          disabled={loading || getTotalItems() === 0}
          className={`ml-auto px-3 py-1 text-sm rounded-md font-medium transition-colors border-2 border-black bg-white text-black disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed ${
            copySuccess ? 'opacity-80' : 'hover:bg-gray-50'
          }`}
        >
          {copySuccess ? (
            '✓ Copied!'
          ) : (
            <span className="inline-flex items-center gap-1"><span className="material-symbols-rounded text-sm">content_copy</span>Copy</span>
          )}
        </button>
      </div>

      {/* Content */}
      <div className="max-h-96 overflow-y-auto bg-brand-surface p-3 space-y-6 rounded-lg">
        {loading ? (
          <div className="text-center py-6">
            <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
            <p className="text-black text-sm mt-2">Generating list...</p>
          </div>
        ) : getTotalItems() === 0 ? (
          <div className="text-center py-6">
            <p className="text-black text-sm">No ingredients found.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {groupByRecipe ? (
              // Recipe-based view
              Object.entries(getRecipeBasedView()).map(([recipe, items]) => (
                <div key={recipe} className="bg-brand-surface rounded-lg p-3">
                  <h4 className="font-medium text-black text-sm mb-2">{recipe}</h4>
                  <div className="space-y-1">
                    {items.map((item, index) => (
                      <div key={index} className="text-xs text-black flex">
                        <span className="mr-1">•</span>
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
                  <div key={category} className="border-b border-gray-200 last:border-b-0 pb-3 last:pb-0">
                    <h4 className="font-medium text-black text-sm mb-2 flex items-center">
                      <span className="mr-1 text-xs">{getCategoryIcon(category)}</span>
                      {category}
                      <span className="ml-1 text-xs font-normal text-black">
                        ({items.length})
                      </span>
                    </h4>
                    <div className="space-y-2">
                      {items.map((item, index) => {
                        const showSources = item.sources.length > 1

                        return (
                          <div key={index} className="text-xs">
                            <div className="font-medium text-black flex">
                              <span className="mr-2">•</span>
                              <div>
                                {shoppingListService.formatQuantity(item.quantity, item.unit)} {item.item}
                                {showSources && (
                                  <div className="text-black text-xs mt-1">
                                    ({item.sources.map(source => {
                                      // Extract amount from original string or use item name if no amount
                                      const match = source.original.match(/^([\d\/\.\s]+(?:cup|tablespoon|tbsp|teaspoon|tsp|pound|lb|ounce|oz|can|bottle|jar|bag|bunch|head|clove|cloves)?)\s*/i)
                                      if (match && match[1].trim()) {
                                        return match[1].trim()
                                      } else {
                                        // If no amount found, use the item name
                                        return item.item
                                      }
                                    }).join(' | ')})
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )
              })
            )}
          </div>
        )}
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

export default ShoppingListCard