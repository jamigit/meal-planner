import { useState, useEffect } from 'react'
import { serviceSelector } from '../services/serviceSelector.js'
import { TAG_CATEGORIES, getCategoryDisplayName, getCategoryColorClasses } from '../constants/tagCategories.js'
import CategorizedTags from './CategorizedTags'

function RecipeSelector({ isOpen, onClose, onSelectRecipes, selectedMealIds = [] }) {
  const [recipes, setRecipes] = useState([])
  const [selectedRecipes, setSelectedRecipes] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedTag, setSelectedTag] = useState('')
  const [eatenCounts, setEatenCounts] = useState({})
  const [isTagFilterExpanded, setIsTagFilterExpanded] = useState(false)
  // Removed expandedRecipeTags state as we're using CategorizedTags component now

  useEffect(() => {
    if (isOpen) {
      const loadRecipes = async () => {
        const recipeService = await serviceSelector.getRecipeService()
        const mealHistoryService = await serviceSelector.getMealHistoryService()
        
        const allRecipes = await recipeService.getAll()
        setRecipes(allRecipes)

        // Load eaten counts for all recipes
        const recipeIds = allRecipes.map(recipe => recipe.id)
        const counts = await mealHistoryService.getRecipeEatenCounts(recipeIds)
        setEatenCounts(counts)

        // Clear selection first, then pre-select if needed
        if (selectedMealIds && selectedMealIds.length > 0) {
          const alreadySelected = allRecipes.filter(recipe =>
            selectedMealIds.includes(recipe.id)
          )
          setSelectedRecipes(alreadySelected)
        } else {
          setSelectedRecipes([])
        }
      }

      loadRecipes()

      // Reset search and filters when opening
      setSearchTerm('')
      setSelectedTag('')
    }
  }, [isOpen, selectedMealIds])

  // Lock/unlock body scroll when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      // Lock body scroll
      document.body.style.overflow = 'hidden'
    } else {
      // Unlock body scroll
      document.body.style.overflow = 'unset'
    }

    // Cleanup function to ensure scroll is unlocked when component unmounts
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  // Get categorized tags for filtering
  const categorizedTags = {
    [TAG_CATEGORIES.CUISINE]: [...new Set(recipes.flatMap(recipe => recipe.cuisine_tags || []))].sort(),
    [TAG_CATEGORIES.INGREDIENTS]: [...new Set(recipes.flatMap(recipe => recipe.ingredient_tags || []))].sort(),
    [TAG_CATEGORIES.CONVENIENCE]: [...new Set(recipes.flatMap(recipe => recipe.convenience_tags || []))].sort(),
    legacy: [...new Set(recipes.flatMap(recipe => recipe.tags || []))].sort()
  }

  const filteredRecipes = recipes.filter(recipe => {
    const matchesSearch = recipe.name.toLowerCase().includes(searchTerm.toLowerCase())

    if (!selectedTag) return matchesSearch

    // Check if tag matches any category
    const matchesTag =
      recipe.tags?.includes(selectedTag) ||
      recipe.cuisine_tags?.includes(selectedTag) ||
      recipe.ingredient_tags?.includes(selectedTag) ||
      recipe.convenience_tags?.includes(selectedTag)

    return matchesSearch && matchesTag
  })

  const toggleRecipeSelection = (recipe) => {
    setSelectedRecipes(prev => {
      const isCurrentlySelected = prev.some(r => r.id === recipe.id)

      if (isCurrentlySelected) {
        // Remove if already selected
        return prev.filter(r => r.id !== recipe.id)
      } else {
        // Add if not selected and under limit
        if (prev.length >= 4) {
          return prev
        }
        return [...prev, recipe]
      }
    })
  }

  // Removed toggleRecipeTags function as we're using CategorizedTags component now


  const handleSave = () => {
    onSelectRecipes(selectedRecipes)
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg p-6 max-w-4xl w-full max-h-[90vh] flex flex-col">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">Select Meals ({selectedRecipes.length}/4)</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl"
          >
            ×
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="overflow-y-auto flex-1 mb-6">
          {/* Search and Filter */}
          <div className="mb-6 space-y-4">
            <input
              type="text"
              placeholder="Search recipes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />

            {/* Filter Accordion */}
            <div>
              {/* Filter Toggle Button */}
              <button
                onClick={() => setIsTagFilterExpanded(!isTagFilterExpanded)}
                className="w-full flex items-center justify-between p-3 bg-gray-50 rounded-lg text-sm font-medium text-gray-700 mb-2 hover:bg-gray-100 transition-colors"
              >
                <span>Filter by Tags {selectedTag && `(${selectedTag})`}</span>
                <span className="text-lg">{isTagFilterExpanded ? '▼' : '▶'}</span>
              </button>

              {/* Categorized Tag Filters - Collapsible */}
              {isTagFilterExpanded && (
                <div className="space-y-3 p-4 border-2 border-gray-300 rounded-lg bg-white">
                  {/* All Tags Button */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setSelectedTag('')}
                      className={`px-4 py-2 rounded-lg text-sm font-medium ${
                        !selectedTag
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      All Recipes ({recipes.length})
                    </button>
                  </div>

                  {/* Category Sections */}
                  {Object.entries(categorizedTags).map(([category, tags]) => {
                    if (tags.length === 0) return null

                    const isLegacy = category === 'legacy'
                    const displayName = isLegacy ? 'Other Tags' : getCategoryDisplayName(category)
                    const colorClasses = isLegacy ? 'bg-gray-100 text-gray-800 border-gray-200' : getCategoryColorClasses(category)

                    return (
                      <div key={category} className="space-y-2">
                        <h4 className="text-sm font-medium text-gray-700 flex items-center gap-2">
                          <span className={`w-3 h-3 rounded-full ${colorClasses.split(' ')[0]}`}></span>
                          {displayName} ({tags.length})
                        </h4>
                        <div className="flex flex-wrap gap-2 ml-5">
                          {tags.map(tag => (
                            <button
                              key={tag}
                              onClick={() => setSelectedTag(tag)}
                              className={`px-3 py-1 rounded-full text-sm border transition-colors ${
                                selectedTag === tag
                                  ? colorClasses
                                  : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'
                              }`}
                            >
                              {tag}
                            </button>
                          ))}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Recipe Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredRecipes.map(recipe => {
              const isSelected = selectedRecipes.some(r => r.id === recipe.id)
              const canSelect = selectedRecipes.length < 4 || isSelected



              // More explicit class building
              const baseClasses = 'border rounded-lg p-4 cursor-pointer transition-colors'
              let specificClasses = ''

              if (isSelected) {
                specificClasses = 'border-blue-500 bg-blue-50'
              } else if (canSelect) {
                specificClasses = 'border-gray-200 hover:border-gray-300 bg-white'
              } else {
                specificClasses = 'border-gray-100 bg-gray-50 cursor-not-allowed'
              }

              const cardClasses = `${baseClasses} ${specificClasses}`

              return (
                <div
                  key={recipe.id}
                  className={cardClasses}
                  onClick={() => canSelect && toggleRecipeSelection(recipe)}
                >
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex-1">
                      <h3 className={`font-semibold ${!canSelect ? 'text-gray-400' : ''}`}>
                        {recipe.name}
                      </h3>
                      {eatenCounts[recipe.id] !== undefined && (
                        <div className="text-sm text-gray-500 mt-1">
                          Eaten {eatenCounts[recipe.id]} times in last 8 weeks
                        </div>
                      )}
                    </div>
                    {isSelected && (
                      <span className="text-blue-600 text-xl">✓</span>
                    )}
                  </div>

                  {recipe.url && (
                    <a
                      href={recipe.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800 text-sm inline-block mb-2"
                      onClick={(e) => e.stopPropagation()}
                    >
                      View Recipe →
                    </a>
                  )}

                  {/* Categorized Tags */}
                  <CategorizedTags recipe={recipe} />
                </div>
              )
            })}
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end space-x-4 flex-shrink-0 pt-4 border-t border-gray-200">
          <button onClick={onClose} className="btn-secondary">
            Cancel
          </button>
          <button onClick={handleSave} className="btn-primary">
            Save Selection ({selectedRecipes.length} meals)
          </button>
        </div>
      </div>
    </div>
  )
}

export default RecipeSelector