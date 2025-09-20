import { useState, useEffect } from 'react'
import { serviceSelector } from '../services/serviceSelector.js'
import { TAG_CATEGORIES, getCategoryDisplayName, getCategoryColorClasses } from '../constants/tagCategories.js'
import CSVUpload from './CSVUpload'
import RecipeCard from './RecipeCard'
import RecipeForm from './RecipeForm'
import TagMigrationModal from './TagMigrationModal'

function RecipeList() {
  const [recipes, setRecipes] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [editingRecipe, setEditingRecipe] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedTag, setSelectedTag] = useState('')
  const [showMigrationModal, setShowMigrationModal] = useState(false)
  const [showImportSidebar, setShowImportSidebar] = useState(false)
  const [isFilterExpanded, setIsFilterExpanded] = useState(false)

  const loadRecipes = async () => {
    const recipeService = await serviceSelector.getRecipeService()
    const loadedRecipes = await recipeService.getAll()
    setRecipes(loadedRecipes)
  }

  useEffect(() => {
    loadRecipes()
  }, [])

  const handleUploadComplete = (count) => {
    loadRecipes()
    setShowImportSidebar(false)
    console.log(`Imported ${count} recipes, refreshing list`)
  }

  const handleAddRecipe = () => {
    setEditingRecipe(null)
    setShowForm(true)
  }

  const handleEditRecipe = (recipe) => {
    setEditingRecipe(recipe)
    setShowForm(true)
  }

  const handleDeleteRecipe = async (id) => {
    if (window.confirm('Are you sure you want to delete this recipe?')) {
      try {
        const recipeService = await serviceSelector.getRecipeService()
        await recipeService.delete(id)
        loadRecipes()
      } catch (error) {
        console.error('Failed to delete recipe:', error)
        alert('Failed to delete recipe. Please try again.')
      }
    }
  }

  const handleSaveRecipe = async (recipeData) => {
    try {
      const recipeService = await serviceSelector.getRecipeService()
      if (editingRecipe) {
        await recipeService.update(editingRecipe.id, recipeData)
      } else {
        await recipeService.add(recipeData)
      }
      loadRecipes()
      setShowForm(false)
      setEditingRecipe(null)
    } catch (error) {
      console.error('Failed to save recipe:', error)
      throw error
    }
  }

  const handleCancelForm = () => {
    setShowForm(false)
    setEditingRecipe(null)
  }

  // Get categorized tags for filtering
  const categorizedTags = {
    [TAG_CATEGORIES.CUISINE]: [...new Set(recipes.flatMap(recipe => recipe.cuisine_tags || []))].sort(),
    [TAG_CATEGORIES.INGREDIENTS]: [...new Set(recipes.flatMap(recipe => recipe.ingredient_tags || []))].sort(),
    [TAG_CATEGORIES.CONVENIENCE]: [...new Set(recipes.flatMap(recipe => recipe.convenience_tags || []))].sort(),
    legacy: [...new Set(recipes.flatMap(recipe => recipe.tags || []))].sort()
  }

  // Get all tags for filtering (fallback)
  const allTags = [
    ...categorizedTags[TAG_CATEGORIES.CUISINE],
    ...categorizedTags[TAG_CATEGORIES.INGREDIENTS],
    ...categorizedTags[TAG_CATEGORIES.CONVENIENCE],
    ...categorizedTags.legacy
  ]

  // Filter recipes based on search and tag selection
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

  const handleMigrationComplete = () => {
    setShowMigrationModal(false)
    loadRecipes() // Reload to show updated tags
  }


  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Recipes</h2>
        <div className="flex gap-3">
          <button onClick={() => setShowImportSidebar(true)} className="btn-secondary">
            Import Recipes
          </button>
          <button onClick={handleAddRecipe} className="btn-primary">Add Recipe</button>
        </div>
      </div>


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
            onClick={() => setIsFilterExpanded(!isFilterExpanded)}
            className="w-full flex items-center justify-between p-3 bg-gray-50 rounded-lg text-sm font-medium text-gray-700 mb-2 hover:bg-gray-100 transition-colors"
          >
            <span>Filter by Tags {selectedTag && `(${selectedTag})`}</span>
            <span className="text-lg">{isFilterExpanded ? '▼' : '▶'}</span>
          </button>

          {/* Categorized Tag Filters - Collapsible */}
          {isFilterExpanded && (
            <div className="space-y-3 p-4 border border-gray-200 rounded-lg bg-white">
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

        {searchTerm || selectedTag ? (
          <p className="text-sm text-gray-600">
            Showing {filteredRecipes.length} of {recipes.length} recipes
            {searchTerm && ` matching "${searchTerm}"`}
            {selectedTag && ` tagged with "${selectedTag}"`}
          </p>
        ) : null}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredRecipes.length === 0 ? (
          <div className="col-span-full text-center py-12">
            {recipes.length === 0 ? (
              <p className="text-gray-500">No recipes yet. Add your first recipe to get started!</p>
            ) : (
              <p className="text-gray-500">
                No recipes match your current filters. Try adjusting your search or tag selection.
              </p>
            )}
          </div>
        ) : (
          filteredRecipes.map((recipe) => (
            <RecipeCard
              key={recipe.id}
              recipe={recipe}
              onEdit={handleEditRecipe}
              onDelete={handleDeleteRecipe}
            />
          ))
        )}
      </div>

      {/* Recipe Form Modal */}
      <RecipeForm
        recipe={editingRecipe}
        isOpen={showForm}
        onSave={handleSaveRecipe}
        onCancel={handleCancelForm}
      />

      {/* Tag Migration Modal */}
      <TagMigrationModal
        isOpen={showMigrationModal}
        onClose={() => setShowMigrationModal(false)}
        onMigrationComplete={handleMigrationComplete}
      />

      {/* Import Recipes Sidebar */}
      {showImportSidebar && (
        <div className="fixed inset-y-0 right-0 w-96 bg-white shadow-xl z-50 overflow-y-auto border-l border-gray-200">
          <div className="p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-semibold text-gray-900">Import Recipes</h3>
              <button
                onClick={() => setShowImportSidebar(false)}
                className="text-gray-400 hover:text-gray-600 text-2xl"
              >
                ×
              </button>
            </div>
            <CSVUpload onUploadComplete={handleUploadComplete} />
          </div>
        </div>
      )}

      {/* Sidebar Backdrop */}
      {showImportSidebar && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={() => setShowImportSidebar(false)}
        ></div>
      )}
    </div>
  )
}

export default RecipeList