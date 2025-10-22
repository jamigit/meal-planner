import React, { useState, useEffect, useCallback } from 'react'
import { recipeService } from '../database/recipeService.js'
import { debounce } from '../utils/performance.js'
import MultiSelectDropdown from './ui/MultiSelectDropdown.jsx'
import { TAG_TAXONOMY } from '../constants/recipeTags.js'

export default function RecipeListModal({ isOpen, onClose, onAddMeal, selectedMealIds = [] }) {
  const [recipes, setRecipes] = useState([])
  const [filteredRecipes, setFilteredRecipes] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCuisines, setSelectedCuisines] = useState([])
  const [selectedIngredientTags, setSelectedIngredientTags] = useState([])
  const [selectedConvenienceTags, setSelectedConvenienceTags] = useState([])
  const [selectedDietary, setSelectedDietary] = useState([])
  const [isLoading, setIsLoading] = useState(false)

  // Load recipes when modal opens
  useEffect(() => {
    if (isOpen) {
      loadRecipes()
    }
  }, [isOpen])

  // Filter recipes when search term or filters change
  useEffect(() => {
    filterRecipes()
  }, [recipes, searchTerm, selectedCuisines, selectedIngredientTags, selectedConvenienceTags, selectedDietary])

  const loadRecipes = async () => {
    setIsLoading(true)
    try {
      const allRecipes = await recipeService.getAll()
      setRecipes(allRecipes)
    } catch (error) {
      console.error('Failed to load recipes:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const filterRecipes = useCallback(() => {
    let filtered = recipes

    // Filter by search term
    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      filtered = filtered.filter(recipe =>
        recipe.name.toLowerCase().includes(term) ||
        recipe.ingredients?.some(ing => ing.toLowerCase().includes(term)) ||
        recipe.tags?.some(tag => tag.toLowerCase().includes(term))
      )
    }

    // Filter by cuisines (OR logic - recipe matches if it has ANY of the selected cuisines)
    if (selectedCuisines.length > 0) {
      filtered = filtered.filter(recipe =>
        recipe.cuisine_tags?.some(cuisine => selectedCuisines.includes(cuisine))
      )
    }

    // Filter by ingredient tags (OR logic - recipe matches if it has ANY of the selected ingredient tags)
    if (selectedIngredientTags.length > 0) {
      filtered = filtered.filter(recipe =>
        recipe.ingredient_tags?.some(tag => selectedIngredientTags.includes(tag))
      )
    }

    // Filter by convenience tags (OR logic - recipe matches if it has ANY of the selected convenience tags)
    if (selectedConvenienceTags.length > 0) {
      filtered = filtered.filter(recipe =>
        recipe.convenience_tags?.some(tag => selectedConvenienceTags.includes(tag))
      )
    }

    // Filter by dietary tags (OR logic - recipe matches if it has ANY of the selected dietary options)
    if (selectedDietary.length > 0) {
      filtered = filtered.filter(recipe =>
        recipe.dietary_tags?.some(tag => selectedDietary.includes(tag))
      )
    }

    setFilteredRecipes(filtered)
  }, [recipes, searchTerm, selectedCuisines, selectedIngredientTags, selectedConvenienceTags, selectedDietary])

  // Debounced search
  const debouncedSearch = useCallback(
    debounce((term) => {
      setSearchTerm(term)
    }, 300),
    []
  )

  const handleSearchChange = (e) => {
    debouncedSearch(e.target.value)
  }

  const handleAddMeal = (recipe) => {
    onAddMeal(recipe)
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      onClose()
    }
  }

  // Get unique cuisines, ingredient tags, convenience tags, and dietary options for filter dropdowns
  // Use taxonomy as source of truth, but also include any tags found in recipes
  const cuisines = [...new Set([
    ...TAG_TAXONOMY.cuisine_tags,
    ...recipes.flatMap(r => r.cuisine_tags || [])
  ])].sort()
  
  const ingredientTags = [...new Set([
    ...TAG_TAXONOMY.ingredient_tags,
    ...recipes.flatMap(r => r.ingredient_tags || [])
  ])].sort()
  
  const convenienceTags = [...new Set([
    ...TAG_TAXONOMY.convenience_tags,
    ...recipes.flatMap(r => r.convenience_tags || [])
  ])].sort()
  
  const dietaryOptions = [...new Set([
    ...TAG_TAXONOMY.dietary_tags,
    ...recipes.flatMap(r => r.dietary_tags || [])
  ])].sort()

  if (!isOpen) return null

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
      onKeyDown={handleKeyDown}
      tabIndex={-1}
    >
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-h3 font-heading font-black">Browse All Recipes</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-md p-1"
            aria-label="Close modal"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Filters */}
        <div className="p-6 border-b border-gray-200 bg-gray-50">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label htmlFor="search" className="block text-sm font-medium text-black mb-2">
                Search Recipes
              </label>
              <input
                id="search"
                type="text"
                placeholder="Search by name, ingredients, or tags..."
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                onChange={handleSearchChange}
              />
            </div>
            
            <MultiSelectDropdown
              label="Filter by Cuisine"
              placeholder="All cuisines"
              options={cuisines}
              selectedValues={selectedCuisines}
              onChange={setSelectedCuisines}
            />
            
            <MultiSelectDropdown
              label="Filter by Ingredient"
              placeholder="All ingredients"
              options={ingredientTags}
              selectedValues={selectedIngredientTags}
              onChange={setSelectedIngredientTags}
            />
            
            <MultiSelectDropdown
              label="Filter by Convenience"
              placeholder="All convenience"
              options={convenienceTags}
              selectedValues={selectedConvenienceTags}
              onChange={setSelectedConvenienceTags}
            />
            
            <MultiSelectDropdown
              label="Filter by Dietary"
              placeholder="All dietary"
              options={dietaryOptions}
              selectedValues={selectedDietary}
              onChange={setSelectedDietary}
            />
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {isLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading recipes...</p>
            </div>
          ) : filteredRecipes.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <div className="text-4xl mb-4">🔍</div>
              <h3 className="text-lg font-medium mb-2">No recipes found</h3>
              <p>Try adjusting your search terms or filters</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredRecipes.map((recipe) => {
                const isSelected = selectedMealIds.includes(recipe.id)
                return (
                  <div key={recipe.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                    <h3 className="font-semibold text-gray-900 mb-2">{recipe.name}</h3>
                    
                    <div className="text-sm text-gray-600 mb-3">
                      {recipe.cuisine_tags?.length > 0 && (
                        <div className="mb-1">
                          <span className="font-medium">Cuisine:</span> {recipe.cuisine_tags.join(', ')}
                        </div>
                      )}
                      {recipe.ingredient_tags?.length > 0 && (
                        <div className="mb-1">
                          <span className="font-medium">Tags:</span> {recipe.ingredient_tags.slice(0, 3).join(', ')}
                        </div>
                      )}
                      {recipe.prep_time && (
                        <div className="mb-1">
                          <span className="font-medium">Prep:</span> {recipe.prep_time} min
                        </div>
                      )}
                      {recipe.cook_time && (
                        <div className="mb-1">
                          <span className="font-medium">Cook:</span> {recipe.cook_time} min
                        </div>
                      )}
                    </div>
                    
                    <button
                      onClick={() => handleAddMeal(recipe)}
                      disabled={isSelected}
                      className={`w-full px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                        isSelected
                          ? 'bg-gray-400 text-gray-600 cursor-not-allowed'
                          : 'btn-secondary'
                      }`}
                    >
                      {isSelected ? 'Already Added' : 'Add to Plan'}
                    </button>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end p-6 border-t border-gray-200 bg-gray-50">
          <button
            onClick={onClose}
            className="btn-tertiary"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
