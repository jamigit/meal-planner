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
    // First filter out unknown/placeholder recipes
    let filtered = recipes.filter(recipe => {
      const isUnknownRecipe = 
        recipe.name?.includes('Unknown Recipe') ||
        recipe.name?.includes('placeholder') ||
        recipe.name?.toLowerCase().includes('unknown') ||
        recipe.tags?.includes('placeholder') ||
        recipe.ingredient_tags?.includes('placeholder') ||
        recipe.convenience_tags?.includes('placeholder') ||
        recipe.cuisine_tags?.includes('placeholder') ||
        recipe.dietary_tags?.includes('placeholder') ||
        // Check for recipes with placeholder ingredients/instructions
        (recipe.ingredients?.length === 1 && recipe.ingredients[0] === 'Recipe data not available') ||
        (recipe.instructions?.length === 1 && recipe.instructions[0]?.includes('original recipe data is not available'))
      
      return !isUnknownRecipe
    })

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
      <div className="surface-elevated rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-3 border-b border-gray-200">
          <h2 className="text-h3 font-heading font-black">Browse All Recipes</h2>
          <button
            onClick={onClose}
            className="text-text-tertiary hover:text-text-secondary focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-md p-1"
            aria-label="Close modal"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {/* Filters */}
          <div className="p-4 border-b border-gray-200 bg-white">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label htmlFor="search" className="block text-sm font-medium text-black mb-2">
                  Search Recipes
                </label>
                <input
                  id="search"
                  type="text"
                  placeholder="Search by name, ingredients, or tags..."
                  className="w-full input-standard"
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

          {/* Recipe List */}
          <div className="p-6">
          {isLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-text-secondary">Loading recipes...</p>
            </div>
          ) : filteredRecipes.length === 0 ? (
            <div className="text-center py-8 text-text-secondary">
              <div className="text-4xl mb-4">🔍</div>
              <h3 className="text-lg font-medium mb-2">No recipes found</h3>
              <p>Try adjusting your search terms or filters</p>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredRecipes.map((recipe) => {
                const isSelected = selectedMealIds.includes(recipe.id)
                return (
                  <div key={recipe.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:shadow-sm transition-shadow">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-gray-900 truncate">{recipe.name}</h3>
                        {recipe.prep_time && (
                          <span className="text-xs text-text-secondary bg-gray-100 px-2 py-1 rounded-full whitespace-nowrap">
                            {recipe.prep_time} min prep
                          </span>
                        )}
                        {recipe.cook_time && (
                          <span className="text-xs text-text-secondary bg-gray-100 px-2 py-1 rounded-full whitespace-nowrap">
                            {recipe.cook_time} min cook
                          </span>
                        )}
                      </div>
                      
                      <div className="text-xs text-gray-600">
                        {recipe.cuisine_tags?.length > 0 && (
                          <span className="mr-3">
                            <span className="font-medium">Cuisine:</span> {recipe.cuisine_tags.join(', ')}
                          </span>
                        )}
                        {recipe.ingredient_tags?.length > 0 && (
                          <span className="mr-3">
                            <span className="font-medium">Tags:</span> {recipe.ingredient_tags.slice(0, 3).join(', ')}
                          </span>
                        )}
                      </div>
                    </div>
                    
                    <div className="ml-4 flex-shrink-0">
                      <button
                        onClick={() => handleAddMeal(recipe)}
                        disabled={isSelected}
                        className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                          isSelected
                            ? 'bg-gray-400 text-gray-600 cursor-not-allowed'
                            : 'btn-secondary'
                        }`}
                      >
                        {isSelected ? 'Added' : 'Add'}
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end p-3 border-t border-gray-200 bg-white">
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
