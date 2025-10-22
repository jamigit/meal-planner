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
  const [selectedTags, setSelectedTags] = useState([])
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

    if (selectedTags.length === 0) return matchesSearch

    // Check if any of the selected tags match any category (OR logic)
    const matchesAnyTag = selectedTags.some(selectedTag =>
      recipe.tags?.includes(selectedTag) ||
      recipe.cuisine_tags?.includes(selectedTag) ||
      recipe.ingredient_tags?.includes(selectedTag) ||
      recipe.convenience_tags?.includes(selectedTag) ||
      recipe.dietary_tags?.includes(selectedTag)
    )

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
        {/* Search and Filter Controls - Side by Side */}
        <div className="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            placeholder="Search recipes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1 input-standard"
          />

          <MultiSelectDropdown
            label="Filter by Tags"
            placeholder="All tags"
            options={allTags}
            selectedValues={selectedTags}
            onChange={setSelectedTags}
          />
        </div>

        {/* Results Summary */}
        {searchTerm || selectedTags.length > 0 ? (
          <div className="mt-4 text-sm text-text-secondary">
            Showing {filteredRecipes.length} of {recipes.length} recipes
            {selectedTags.length > 0 && ` tagged with "${selectedTags.join(', ')}"`}
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