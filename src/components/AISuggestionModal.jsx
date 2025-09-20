import { useState, useEffect } from 'react'
import CategorizedTags from './CategorizedTags'
import { recipeService } from '../database/recipeService.js'

function AISuggestionModal({
  isOpen,
  onClose,
  suggestions,
  onSelectMeals,
  isLoading,
  error
}) {
  const [selectedSet, setSelectedSet] = useState(null)
  const [swapModalOpen, setSwapModalOpen] = useState(false)
  const [swapIndex, setSwapIndex] = useState(null)
  const [availableRecipes, setAvailableRecipes] = useState([])
  const [selectedMeals, setSelectedMeals] = useState([])

  if (!isOpen) return null

  const handleSelectSet = (suggestionSet) => {
    setSelectedSet(suggestionSet)
    // Initialize all meals as selected by default
    setSelectedMeals(suggestionSet.meals.map((_, index) => index))
  }

  const handleSwapMeal = async (index) => {
    setSwapIndex(index)
    // Load all available recipes for swapping
    try {
      const recipes = await recipeService.getAll()
      setAvailableRecipes(recipes)
      setSwapModalOpen(true)
    } catch (error) {
      console.error('Failed to load recipes for swapping:', error)
      alert('Failed to load recipes for swapping. Please try again.')
    }
  }

  const handleConfirmSwap = (newRecipe) => {
    if (selectedSet && swapIndex !== null) {
      const updatedMeals = [...selectedSet.meals]
      updatedMeals[swapIndex] = {
        recipe: newRecipe,
        reason: 'User selected replacement'
      }
      setSelectedSet({ ...selectedSet, meals: updatedMeals })
    }
    setSwapModalOpen(false)
    setSwapIndex(null)
  }

  const handleToggleMealSelection = (index) => {
    setSelectedMeals(prev => {
      if (prev.includes(index)) {
        return prev.filter(i => i !== index)
      } else {
        return [...prev, index]
      }
    })
  }

  const handleConfirmSelection = () => {
    if (selectedSet && selectedMeals.length > 0) {
      // Only include selected meals
      const selectedRecipes = selectedMeals
        .map(index => selectedSet.meals[index])
        .map(meal => meal.recipe)
      onSelectMeals(selectedRecipes)
      onClose()
    }
  }

  const handleBackToOptions = () => {
    setSelectedSet(null)
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] flex flex-col">

        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-2xl font-bold text-gray-900">
            🤖 AI Meal Suggestions
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl font-bold leading-none"
          >
            ×
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {isLoading ? (
            // Loading State
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-6"></div>
              <h3 className="text-lg font-semibold mb-2">Generating Personalized Suggestions</h3>
              <p className="text-gray-600">
                Analyzing your meal history and preferences...
              </p>
            </div>
          ) : error ? (
            // Error State
            <div className="text-center py-12">
              <div className="text-red-600 text-6xl mb-4">⚠️</div>
              <h3 className="text-lg font-semibold mb-2 text-red-800">Unable to Generate Suggestions</h3>
              <p className="text-red-600 mb-4">{error}</p>
              <button onClick={onClose} className="btn-secondary">
                Close
              </button>
            </div>
          ) : selectedSet ? (
            // Selected Set View
            <div>
              <button
                onClick={handleBackToOptions}
                className="btn-secondary mb-6"
              >
                ← Back to Options
              </button>

              <div className="card">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-xl font-semibold mb-2">
                      Selected Meal Plan - Option {selectedSet.set_number}
                    </h3>
                    <p className="text-gray-600">{selectedSet.explanation}</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  {selectedSet.meals.map((meal, index) => {
                    const isSelected = selectedMeals.includes(index)
                    return (
                      <div 
                        key={index} 
                        className={`border-2 rounded-lg p-4 transition-colors cursor-pointer ${
                          isSelected 
                            ? 'border-blue-500 bg-blue-50' 
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                        onClick={() => handleToggleMealSelection(index)}
                      >
                        <div className="flex justify-between items-start mb-3">
                          <div className="flex items-start space-x-3">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => handleToggleMealSelection(index)}
                              className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                            />
                            <h4 className="font-semibold text-gray-900">{meal.recipe.name}</h4>
                          </div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              handleSwapMeal(index)
                            }}
                            className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                          >
                            Swap
                          </button>
                        </div>

                        <p className="text-sm text-gray-600 mb-3 ml-7">{meal.reason}</p>

                        {meal.recipe.url && (
                          <a
                            href={meal.recipe.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="text-sm text-blue-600 hover:text-blue-800 block mb-2 ml-7"
                          >
                            View Recipe →
                          </a>
                        )}

                        <div className="ml-7">
                          <CategorizedTags recipe={meal.recipe} />
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          ) : (
            // Options View
            <div className="space-y-6">
              {suggestions && suggestions.length > 0 ? (
                <>
                  <div className="text-center mb-6">
                    <h3 className="text-lg font-semibold mb-2">
                      Choose Your Preferred Meal Plan
                    </h3>
                    <p className="text-gray-600">
                      Each option balances your regular favorites with some variety
                    </p>
                  </div>

                  {suggestions.map((suggestion, index) => (
                    <div
                      key={index}
                      className="card hover:shadow-lg transition-shadow cursor-pointer border-2 border-transparent hover:border-blue-200"
                      onClick={() => handleSelectSet(suggestion)}
                    >
                      <div className="flex justify-between items-start mb-4">
                        <h3 className="text-xl font-semibold text-blue-600">
                          Option {suggestion.set_number}
                        </h3>
                        <span className="text-sm text-gray-500">
                          {suggestion.meals.length} meals
                        </span>
                      </div>

                      <p className="text-gray-700 mb-4">{suggestion.explanation}</p>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                        {suggestion.meals.map((meal, mealIndex) => (
                          <div key={mealIndex} className="text-sm">
                            <div className="font-medium text-gray-900 mb-1">
                              {meal.recipe.name}
                            </div>
                            <div className="text-gray-500 text-xs">
                              {meal.reason}
                            </div>
                          </div>
                        ))}
                      </div>

                      <button className="btn-primary w-full">
                        Select This Plan →
                      </button>
                    </div>
                  ))}
                </>
              ) : (
                <div className="text-center py-12">
                  <div className="text-gray-400 text-6xl mb-4">🍽️</div>
                  <h3 className="text-lg font-semibold mb-2 text-gray-700">
                    No Suggestions Available
                  </h3>
                  <p className="text-gray-600">
                    Try adding more recipes or adjusting your preferences.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer Actions (only show when set is selected) */}
        {selectedSet && !isLoading && !error && (
          <div className="border-t p-6 bg-gray-50">
            <div className="flex justify-between items-center">
              <div className="text-sm text-gray-600">
                {selectedMeals.length} of {selectedSet.meals.length} meals selected
              </div>
              <div className="flex space-x-3">
                <button onClick={handleBackToOptions} className="btn-secondary">
                  See Other Options
                </button>
                <button 
                  onClick={handleConfirmSelection} 
                  className="btn-primary"
                  disabled={selectedMeals.length === 0}
                >
                  Use Selected Meals ({selectedMeals.length})
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Swap Modal */}
        {swapModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-60">
            <div className="bg-white rounded-lg max-w-2xl w-full max-h-[80vh] flex flex-col">
              <div className="flex justify-between items-center p-6 border-b">
                <h3 className="text-xl font-semibold">Choose Replacement Recipe</h3>
                <button
                  onClick={() => setSwapModalOpen(false)}
                  className="text-gray-400 hover:text-gray-600 text-2xl font-bold leading-none"
                >
                  ×
                </button>
              </div>
              
              <div className="flex-1 overflow-y-auto p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {availableRecipes.map((recipe) => (
                    <div
                      key={recipe.id}
                      className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 cursor-pointer transition-colors"
                      onClick={() => handleConfirmSwap(recipe)}
                    >
                      <h4 className="font-semibold text-gray-900 mb-2">{recipe.name}</h4>
                      <CategorizedTags recipe={recipe} />
                      {recipe.url && (
                        <a
                          href={recipe.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-blue-600 hover:text-blue-800 block mt-2"
                        >
                          View Recipe →
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default AISuggestionModal