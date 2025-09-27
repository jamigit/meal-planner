import { useState, useEffect } from 'react'
import { serviceSelector } from '../services/serviceSelector.js'
import { TAG_CATEGORIES, getCategoryDisplayName, getCategoryColorClasses } from '../constants/tagCategories.js'
import CategorizedTags from './CategorizedTags'
import { getRecipeSelectionClasses, getTagFilterClasses, getModalClasses } from '../utils/colorMigration'
import { joinClasses, colors, typography } from '../utils/designSystem'

function RecipeSelector({ isOpen, onClose, onSelectRecipes, selectedMealIds = [] }) {
  const [recipes, setRecipes] = useState([])
  const [selectedRecipes, setSelectedRecipes] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedTag, setSelectedTag] = useState('')
  const [eatenCounts, setEatenCounts] = useState({})
  const [isTagFilterExpanded, setIsTagFilterExpanded] = useState(false)
  const [showOnlySelected, setShowOnlySelected] = useState(false)
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
        console.log('🔍 RecipeSelector: selectedMealIds prop:', selectedMealIds)
        console.log('🔍 RecipeSelector: allRecipes count:', allRecipes.length)
        console.log('🔍 RecipeSelector: all recipe IDs in database:', allRecipes.map(r => r.id))
        
        if (selectedMealIds && selectedMealIds.length > 0) {
          const alreadySelected = allRecipes.filter(recipe =>
            selectedMealIds.includes(recipe.id)
          )
          console.log('🔍 RecipeSelector: found alreadySelected:', alreadySelected.map(r => ({ id: r.id, name: r.name })))
          
          // Check for missing recipes
          const foundIds = alreadySelected.map(r => r.id)
          const missingIds = selectedMealIds.filter(id => !foundIds.includes(id))
          if (missingIds.length > 0) {
            console.warn('⚠️ RecipeSelector: Missing recipes with IDs:', missingIds)
          }
          
          setSelectedRecipes(alreadySelected)
        } else {
          console.log('🔍 RecipeSelector: no selectedMealIds, clearing selection')
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
    // First check if we should only show selected recipes
    if (showOnlySelected) {
      return selectedRecipes.some(r => r.id === recipe.id)
    }

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

  const modalClasses = getModalClasses()
  
  return (
    <div className={joinClasses('fixed inset-0 flex items-center justify-center z-[60] p-4', modalClasses.overlay)}>
      <div className="bg-white rounded-lg shadow-modal p-4 max-w-4xl w-full h-[90vh] flex flex-col">
        <div className="flex justify-between items-center mb-2">
          <h2 className="text-h3 font-heading font-black text-text-primary uppercase">
            Select Meals ({selectedRecipes.length}/4)
          </h2>
          <button
            onClick={onClose}
            className="inline-flex items-center gap-2 rounded border-2 border-border-primary text-text-primary bg-white hover:bg-state-hover text-sm px-3 py-1"
          >
            Close
          </button>
        </div>

        {/* View Toggle */}
        <div className="mb-4">
          <div className="inline-flex items-center rounded-full border-2 border-border-primary overflow-hidden">
            <button
              type="button"
              onClick={() => setShowOnlySelected(false)}
              className={`px-4 py-2 text-sm font-medium w-32 ${
                !showOnlySelected ? 'bg-text-primary text-text-inverse' : 'bg-white text-text-primary'
              }`}
            >
              All
            </button>
            <button
              type="button"
              onClick={() => setShowOnlySelected(true)}
              className={`px-4 py-2 text-sm font-medium border-l-2 border-border-primary w-32 ${
                showOnlySelected ? 'bg-text-primary text-text-inverse' : 'bg-white text-text-primary'
              }`}
            >
              Selected ({selectedRecipes.length})
            </button>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="overflow-y-auto flex-1 mb-6">
          {/* Search and Filter - only show when not filtering by selected */}
          {!showOnlySelected && (
            <div className="mb-6 space-y-4">
            <input
              type="text"
              placeholder="Search recipes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full p-3 border-2 border-border-secondary rounded-lg focus:ring-2 focus:ring-state-focus focus:border-transparent text-text-primary placeholder:text-text-tertiary"
            />

            {/* Filter Accordion */}
            <div>
              {/* Filter Toggle Button */}
              <button
                onClick={() => setIsTagFilterExpanded(!isTagFilterExpanded)}
                className="w-full flex items-center justify-between p-3 bg-white rounded-lg text-sm font-bold text-text-primary mb-2 hover:bg-state-hover transition-colors font-tag border-2 border-border-primary"
              >
                <span>Filter by Tags {selectedTag && `(${selectedTag})`}</span>
                <span className="material-symbols-rounded text-[20px]">{isTagFilterExpanded ? 'expand_less' : 'expand_more'}</span>
              </button>

              {/* Categorized Tag Filters - Collapsible */}
              {isTagFilterExpanded && (
                <div className="space-y-3 p-4 border-2 border-border-primary rounded-lg bg-white">
                  {/* All Tags Button */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setSelectedTag('')}
                      className={joinClasses(
                        'px-4 py-2 rounded-lg text-sm font-medium',
                        !selectedTag
                          ? 'bg-semantic-success text-text-inverse'
                          : 'bg-state-disabled text-text-primary hover:bg-state-hover'
                      )}
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
                        <h4 className="text-sm font-bold text-black flex items-center gap-2 font-tag">
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
          )}

          {/* Recipe Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredRecipes.map(recipe => {
              const isSelected = selectedRecipes.some(r => r.id === recipe.id)
              const canSelect = selectedRecipes.length < 4 || isSelected



              // Use design system classes for recipe selection - reduced padding for mobile
              const baseClasses = 'border rounded-lg p-3 md:p-4 cursor-pointer transition-colors'
              const specificClasses = getRecipeSelectionClasses(isSelected, canSelect)
              const cardClasses = joinClasses(baseClasses, specificClasses)

              return (
                <div
                  key={recipe.id}
                  className={cardClasses}
                  onClick={() => canSelect && toggleRecipeSelection(recipe)}
                >
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex-1">
                      <h3 className={joinClasses(
                        'text-sm md:text-base font-medium',
                        !canSelect ? colors.text.tertiary : isSelected ? colors.text.inverse : colors.text.primary
                      )}>
                        {recipe.name}
                      </h3>
                      {eatenCounts[recipe.id] !== undefined && (
                        <div className={joinClasses(
                          'text-xs md:text-sm mt-1',
                          isSelected ? colors.text.inverse : colors.text.secondary
                        )}>
                          Eaten {eatenCounts[recipe.id]} times in last 8 weeks
                        </div>
                      )}
                    </div>
                    {isSelected && (
                      <span className={joinClasses(colors.text.inverse, 'text-xl')}>✓</span>
                    )}
                  </div>

                  {recipe.url && (
                    <a
                      href={recipe.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={joinClasses(
                        'text-xs md:text-sm inline-block mb-2',
                        isSelected ? colors.text.inverse : 'text-semantic-success hover:text-semantic-success-light'
                      )}
                      onClick={(e) => e.stopPropagation()}
                    >
                      View Recipe →
                    </a>
                  )}

                  {/* Tags hidden for cleaner mobile view */}
                </div>
              )
            })}
          </div>
        </div>

        {/* Actions */}
        <div className={joinClasses('flex justify-end space-x-4 flex-shrink-0 pt-4', modalClasses.footer)}>
          <button onClick={onClose} className="btn-primary">
            Cancel
          </button>
          <button onClick={handleSave} className="btn-secondary">
            Save Selection ({selectedRecipes.length} meals)
          </button>
        </div>
      </div>
    </div>
  )
}

export default RecipeSelector