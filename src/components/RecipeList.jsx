import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { serviceSelector } from '../services/serviceSelector.js'
import { TAG_TAXONOMY, getCategoryDisplayName, getCategoryColorClasses } from '../constants/recipeTags.js'
import CSVUpload from './CSVUpload'
import RecipeCard from './RecipeCard'
import RecipeForm from './RecipeForm'
import TagMigrationModal from './TagMigrationModal'
import MultiSelectDropdown from './ui/MultiSelectDropdown.jsx'
import { PageContainer, PageHeader, PageSection } from './layout'

function RecipeList() {
  const [recipes, setRecipes] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [editingRecipe, setEditingRecipe] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCuisineTags, setSelectedCuisineTags] = useState([])
  const [selectedIngredientTags, setSelectedIngredientTags] = useState([])
  const [selectedConvenienceTags, setSelectedConvenienceTags] = useState([])
  const [selectedDietaryTags, setSelectedDietaryTags] = useState([])
  const [showMigrationModal, setShowMigrationModal] = useState(false)
  const [showImportSidebar, setShowImportSidebar] = useState(false)

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
    cuisine_tags: [...new Set(recipes.flatMap(recipe => recipe.cuisine_tags || []))].sort(),
    ingredient_tags: [...new Set(recipes.flatMap(recipe => recipe.ingredient_tags || []))].sort(),
    convenience_tags: [...new Set(recipes.flatMap(recipe => recipe.convenience_tags || []))].sort(),
    dietary_tags: [...new Set(recipes.flatMap(recipe => recipe.dietary_tags || []))].sort(),
    legacy: [...new Set(recipes.flatMap(recipe => recipe.tags || []))].sort()
  }

  // Get all tags for filtering (fallback)
  const allTags = [
    ...categorizedTags.cuisine_tags,
    ...categorizedTags.ingredient_tags,
    ...categorizedTags.convenience_tags,
    ...categorizedTags.dietary_tags,
    ...categorizedTags.legacy
  ]

  // Filter recipes based on search and tag selection
  const filteredRecipes = recipes.filter(recipe => {
    // Hide unknown/placeholder recipes
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
    
    if (isUnknownRecipe) return false

    const matchesSearch = recipe.name.toLowerCase().includes(searchTerm.toLowerCase())

    // Check if any tags are selected
    const hasAnySelectedTags = selectedCuisineTags.length > 0 || 
                             selectedIngredientTags.length > 0 || 
                             selectedConvenienceTags.length > 0 || 
                             selectedDietaryTags.length > 0

    if (!hasAnySelectedTags) return matchesSearch

    // Check if recipe matches any of the selected tags (OR logic across all categories)
    const matchesCuisineTags = selectedCuisineTags.length === 0 || 
                              selectedCuisineTags.some(tag => recipe.cuisine_tags?.includes(tag))
    
    const matchesIngredientTags = selectedIngredientTags.length === 0 || 
                                 selectedIngredientTags.some(tag => recipe.ingredient_tags?.includes(tag))
    
    const matchesConvenienceTags = selectedConvenienceTags.length === 0 || 
                                  selectedConvenienceTags.some(tag => recipe.convenience_tags?.includes(tag))
    
    const matchesDietaryTags = selectedDietaryTags.length === 0 || 
                              selectedDietaryTags.some(tag => recipe.dietary_tags?.includes(tag))

    // Recipe matches if it has at least one tag from any selected category
    const matchesAnyTag = matchesCuisineTags || matchesIngredientTags || matchesConvenienceTags || matchesDietaryTags

    return matchesSearch && matchesAnyTag
  })

  const handleMigrationComplete = () => {
    setShowMigrationModal(false)
    loadRecipes() // Reload to show updated tags
  }


  return (
    <PageContainer>
      <PageHeader
        title="Recipes"
      />

      {/* Action Buttons - Below title on medium and smaller */}
      <div className="mb-6">
        <div className="flex flex-wrap gap-3">
          <button onClick={handleAddRecipe} className="btn-secondary">Add Recipe</button>
          <button onClick={() => setShowImportSidebar(true)} className="btn-outline-black">Import Recipes</button>
        </div>
      </div>

      {/* Search and Filter */}
      <PageSection>
        {/* Search Input */}
        <div className="mb-4">
          <input
            type="text"
            placeholder="Search recipes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full max-w-md input-standard"
          />
        </div>

        {/* Tag Filter Dropdowns */}
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Cuisine Tags */}
            <MultiSelectDropdown
              label="Cuisines"
              placeholder="All cuisines"
              options={categorizedTags.cuisine_tags}
              selectedValues={selectedCuisineTags}
              onChange={setSelectedCuisineTags}
            />

            {/* Ingredient Tags */}
            <MultiSelectDropdown
              label="Ingredients"
              placeholder="All ingredients"
              options={categorizedTags.ingredient_tags}
              selectedValues={selectedIngredientTags}
              onChange={setSelectedIngredientTags}
            />

            {/* Convenience Tags */}
            <MultiSelectDropdown
              label="Convenience"
              placeholder="All convenience"
              options={categorizedTags.convenience_tags}
              selectedValues={selectedConvenienceTags}
              onChange={setSelectedConvenienceTags}
            />

            {/* Dietary Tags */}
            <MultiSelectDropdown
              label="Dietary"
              placeholder="All dietary"
              options={categorizedTags.dietary_tags}
              selectedValues={selectedDietaryTags}
              onChange={setSelectedDietaryTags}
            />
          </div>

          {/* Clear All Filters Button */}
          {(selectedCuisineTags.length > 0 || selectedIngredientTags.length > 0 || 
            selectedConvenienceTags.length > 0 || selectedDietaryTags.length > 0) && (
            <div className="flex justify-center">
              <button
                onClick={() => {
                  setSelectedCuisineTags([])
                  setSelectedIngredientTags([])
                  setSelectedConvenienceTags([])
                  setSelectedDietaryTags([])
                }}
                className="btn-outline-black-sm"
              >
                Clear All Filters
              </button>
            </div>
          )}
        </div>

        {/* Results Summary */}
        {(searchTerm || selectedCuisineTags.length > 0 || selectedIngredientTags.length > 0 || 
          selectedConvenienceTags.length > 0 || selectedDietaryTags.length > 0) ? (
          <div className="mt-4 text-sm text-text-secondary">
            Showing {filteredRecipes.length} of {recipes.length} recipes
            {selectedCuisineTags.length > 0 && ` • Cuisines: ${selectedCuisineTags.join(', ')}`}
            {selectedIngredientTags.length > 0 && ` • Ingredients: ${selectedIngredientTags.join(', ')}`}
            {selectedConvenienceTags.length > 0 && ` • Convenience: ${selectedConvenienceTags.join(', ')}`}
            {selectedDietaryTags.length > 0 && ` • Dietary: ${selectedDietaryTags.join(', ')}`}
          </div>
        ) : null}
      </PageSection>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredRecipes.length === 0 ? (
          <div className="col-span-full text-center py-12">
            {recipes.length === 0 ? (
              <p className="text-black">No recipes yet. Add your first recipe to get started!</p>
            ) : (
              <p className="text-black">
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
      <AnimatePresence>
        {showImportSidebar && (
          <motion.div 
            className="fixed inset-y-0 right-0 w-96 bg-brand-surface shadow-xl z-50 overflow-y-auto border-l border-gray-200"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ 
              type: "spring", 
              damping: 25, 
              stiffness: 300,
              duration: 0.4 
            }}
          >
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-semibold text-black">Import Recipes</h3>
                <button
                  onClick={() => setShowImportSidebar(false)}
                  className="text-black hover:text-black/80 text-2xl"
                >
                  ×
                </button>
              </div>
              <CSVUpload onUploadComplete={handleUploadComplete} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Sidebar Backdrop */}
      <AnimatePresence>
        {showImportSidebar && (
          <motion.div
            className="fixed inset-0 bg-black bg-opacity-50 z-[55]"
            onClick={() => setShowImportSidebar(false)}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          />
        )}
      </AnimatePresence>
    </PageContainer>
  )
}

export default RecipeList