import { useState, useEffect } from 'react'
import { recipeService } from '../database/recipeService.js'
import CSVUpload from './CSVUpload'
import RecipeCard from './RecipeCard'
import RecipeForm from './RecipeForm'

function RecipeList() {
  const [recipes, setRecipes] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [editingRecipe, setEditingRecipe] = useState(null)

  const loadRecipes = async () => {
    const loadedRecipes = await recipeService.getAll()
    setRecipes(loadedRecipes)
  }

  useEffect(() => {
    loadRecipes()
  }, [])

  const handleUploadComplete = (count) => {
    loadRecipes()
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

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Recipes</h2>
        <button onClick={handleAddRecipe} className="btn-primary">Add Recipe</button>
      </div>

      <div className="mb-6">
        <CSVUpload onUploadComplete={handleUploadComplete} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {recipes.length === 0 ? (
          <div className="col-span-full text-center py-12">
            <p className="text-gray-500">No recipes yet. Add your first recipe to get started!</p>
          </div>
        ) : (
          recipes.map((recipe) => (
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
    </div>
  )
}

export default RecipeList