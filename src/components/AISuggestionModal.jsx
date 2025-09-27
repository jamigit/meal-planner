import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import CategorizedTags from './CategorizedTags'
import { serviceSelector } from '../services/serviceSelector.js'

function AISuggestionModal({
  isOpen,
  onClose,
  suggestions,
  onSelectMeals,
  isLoading,
  error,
  setSidebarRecipe
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
      const recipeService = await serviceSelector.getRecipeService()
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
    <AnimatePresence>
      {isOpen && (
        <motion.div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-[60]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={onClose}
        >
          <motion.div 
            className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] sm:max-h-[85vh] flex flex-col mx-2 sm:mx-4"
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            transition={{ 
              type: "spring", 
              damping: 25, 
              stiffness: 300,
              duration: 0.3 
            }}
            onClick={(e) => e.stopPropagation()}
          >

        {/* Header */}
        <div className="px-4 sm:px-6 py-3 sm:py-4 border-b">
          {/* Title and Close button in line */}
          <div className="flex justify-between items-center">
            <h2 className="text-h3 font-heading font-black text-text-primary truncate pr-2">
              🤖 AI Meal Suggestions
            </h2>
            <button
              onClick={onClose}
              className="btn-outline-black-sm flex items-center gap-1 sm:gap-2 flex-shrink-0"
            >
              <span>×</span>
              <span className="hidden sm:inline">Close</span>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          {isLoading ? (
            // Loading State
            <div className="text-center py-12">
              <motion.div 
                className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-6"
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              />
              <motion.h3 
                className="text-lg font-semibold mb-2"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                Generating Personalized Suggestions
              </motion.h3>
              <motion.p 
                className="text-gray-600"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
              >
                Analyzing your meal history and preferences...
              </motion.p>
            </div>
          ) : error ? (
            // Error State
            <div className="text-center py-12">
              <div className="text-red-600 text-6xl mb-4">⚠️</div>
              <h3 className="text-lg font-semibold mb-2 text-red-800">Unable to Generate Suggestions</h3>
              <p className="text-red-600 mb-4">{error}</p>
              <button onClick={onClose} className="inline-flex items-center justify-center rounded-lg font-heading font-black uppercase text-[20px] px-4 py-2 bg-green-600 text-white hover:bg-green-700">
                Close
              </button>
            </div>
          ) : selectedSet ? (
            // Selected Set View
            <div>
              <div className="mb-6">
                <div className="text-center mb-6">
                  <h3 className="text-xl font-semibold mb-1">
                    Selected Meal Plan - Option {selectedSet.set_number}
                  </h3>
                  <p className="text-gray-600">{selectedSet.explanation}</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mb-6">
                  {selectedSet.meals.map((meal, index) => {
                    const isSelected = selectedMeals.includes(index)
                    return (
                      <div 
                        key={index} 
                        className={`border-2 rounded-lg p-3 sm:p-4 transition-colors cursor-pointer relative ${
                          isSelected 
                            ? 'border-green-600 bg-green-100' 
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                        onClick={() => handleToggleMealSelection(index)}
                      >
                        <button
                          onClick={(e) => {
                              e.stopPropagation()
                              handleSwapMeal(index)
                            }}
                          className="absolute top-2 right-2 inline-flex items-center justify-center rounded-lg font-heading font-black uppercase text-xs px-2 py-1 bg-green-600 text-white hover:bg-green-700 z-10"
                          >
                          Swap
                        </button>
                        
                        <div className="flex items-start space-x-3 mb-3 pr-16">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => handleToggleMealSelection(index)}
                            className="mt-1 h-4 w-4 text-green-700 focus:ring-green-600 border-gray-300 rounded flex-shrink-0"
                          />
                          <h4 className="font-semibold text-gray-900 text-sm sm:text-base">{meal.recipe.name}</h4>
                        </div>

                        <p className="text-xs sm:text-sm text-gray-600 mb-2 sm:mb-3 ml-7">{meal.reason}</p>

                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            if (setSidebarRecipe) {
                              setSidebarRecipe(meal.recipe)
                            }
                          }}
                          className="inline-flex items-center gap-1 text-xs sm:text-sm border-2 border-black text-black rounded px-2 py-1 mb-2 ml-7 hover:bg-gray-50 transition-colors"
                        >
                          View Recipe
                          <span className="material-symbols-rounded text-sm">arrow_forward</span>
                        </button>

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
                      className="card hover:shadow-lg transition-shadow cursor-pointer"
                      onClick={() => handleSelectSet(suggestion)}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="text-xl font-heading font-black text-black">
                          Option {suggestion.set_number}
                        </h3>
                        <span className="text-sm text-gray-500">
                          {suggestion.meals.length} meals
                        </span>
                      </div>

                      <p className="text-gray-700 mb-4">{suggestion.explanation}</p>

                      {/* Mobile: Vertical List */}
                      <div className="space-y-2 mb-4 md:hidden">
                        {suggestion.meals.map((meal, mealIndex) => (
                          <div key={mealIndex} className="bg-gray-50 rounded-lg p-2 border border-gray-200">
                            <div className="flex items-start space-x-2">
                              {/* Recipe Image */}
                              {meal.recipe.image && (
                                <img 
                                  src={meal.recipe.image} 
                                  alt={meal.recipe.name}
                                  className="w-8 h-8 rounded object-cover flex-shrink-0"
                                />
                              )}
                              
                              <div className="flex-1 min-w-0">
                                {/* Recipe Name */}
                                <h4 className="font-medium text-gray-900 mb-1 truncate text-sm">
                                  {meal.recipe.name}
                                </h4>
                                
                                {/* AI Reason */}
                                <p className="text-xs text-gray-600">
                                  {meal.reason}
                                </p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Desktop: Horizontal Rectangles */}
                      <div className="hidden md:grid md:grid-cols-4 gap-3 mb-4">
                        {suggestion.meals.map((meal, mealIndex) => (
                          <div key={mealIndex} className="bg-gray-50 rounded-lg p-2 border border-gray-200 h-24 flex flex-col">
                            {/* Recipe Image */}
                            {meal.recipe.image && (
                              <img 
                                src={meal.recipe.image} 
                                alt={meal.recipe.name}
                                className="w-full h-12 rounded object-cover mb-1 flex-shrink-0"
                              />
                            )}
                            
                            <div className="flex-1 flex flex-col justify-center">
                              {/* Recipe Name */}
                              <h4 className="font-medium text-gray-900 text-xs line-clamp-2 text-center">
                                {meal.recipe.name}
                              </h4>
                            </div>
                          </div>
                        ))}
                      </div>

                      <button 
                        onClick={() => handleSelectSet(suggestion)}
                        className="inline-flex items-center justify-center rounded-lg font-heading font-black uppercase text-[20px] px-4 py-2 bg-green-600 text-white hover:bg-green-700 w-full shadow-[0_4px_0_0_#15803d] hover:shadow-[0_2px_0_0_#15803d] hover:translate-y-[2px] transition-all"
                      >
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
          <div className="border-t p-4 sm:p-6 bg-gray-50">
            <div className="flex flex-row gap-3 justify-center">
              <button 
                onClick={handleBackToOptions}
                className="btn-outline-black flex-1 text-sm"
              >
                Back
              </button>
              <button 
                onClick={handleConfirmSelection} 
                className="inline-flex items-center justify-center rounded-lg font-heading font-black uppercase text-sm px-4 py-2 bg-green-600 text-white hover:bg-green-700 flex-1 shadow-[0_4px_0_0_#000000] hover:shadow-[0_2px_0_0_#000000] hover:translate-y-[2px] transition-all"
                disabled={selectedMeals.length === 0}
              >
                Use Selected
              </button>
            </div>
          </div>
        )}

        {/* Swap Modal */}
        {swapModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-[70]">
            <div className="bg-white rounded-lg max-w-2xl w-full max-h-[80vh] flex flex-col">
              <div className="flex justify-between items-center p-6 border-b">
                <div>
                  <h3 className="text-h3 font-heading font-black text-text-primary">Choose Replacement Recipe</h3>
                  {selectedSet && swapIndex !== null && (
                    <p className="text-sm text-gray-600 mt-1">
                      Replacing: {selectedSet.meals[swapIndex]?.recipe?.name}
                    </p>
                  )}
                </div>
                <button
                  onClick={() => setSwapModalOpen(false)}
                  className="text-gray-400 hover:text-gray-600 text-2xl font-bold leading-none"
                >
                  ×
                </button>
              </div>
              
              <div className="flex-1 overflow-y-auto p-4">
                <div className="space-y-2">
                  {availableRecipes.map((recipe) => (
                    <div
                      key={recipe.id}
                      className="border border-gray-200 rounded-lg p-3 hover:border-green-500 hover:bg-green-50 hover:shadow-md cursor-pointer transition-all duration-200"
                      onClick={() => handleConfirmSwap(recipe)}
                    >
                      <h4 className="font-medium text-gray-900 text-sm mb-1">{recipe.name}</h4>
                      <div className="text-xs">
                        <CategorizedTags recipe={recipe} />
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          if (setSidebarRecipe) {
                            setSidebarRecipe(recipe)
                          }
                        }}
                        className="inline-flex items-center gap-1 text-xs border-2 border-black text-black rounded px-2 py-1 mt-1 hover:bg-gray-50 transition-colors"
                      >
                        View Recipe
                        <span className="material-symbols-rounded text-sm">arrow_forward</span>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export default AISuggestionModal