import { useState, useEffect } from 'react'
import { recipeStorage } from '../utils/localStorage'

function RecipeList() {
  const [recipes, setRecipes] = useState([])

  useEffect(() => {
    const loadedRecipes = recipeStorage.getAll()
    setRecipes(loadedRecipes)
  }, [])

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Recipes</h2>
        <button className="btn-primary">Add Recipe</button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {recipes.length === 0 ? (
          <div className="col-span-full text-center py-12">
            <p className="text-gray-500">No recipes yet. Add your first recipe to get started!</p>
          </div>
        ) : (
          recipes.map((recipe) => (
            <div key={recipe.id} className="card">
              <h3 className="text-lg font-semibold mb-2">{recipe.name}</h3>
              {recipe.url && (
                <a
                  href={recipe.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-800 text-sm mb-3 block"
                >
                  View Recipe →
                </a>
              )}
              <div className="flex flex-wrap">
                {recipe.tags?.map((tag) => (
                  <span key={tag} className="tag">{tag}</span>
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

export default RecipeList