import { useState } from 'react'

function RecipeCard({ recipe, onEdit, onDelete, showDetails = false }) {
  const [expanded, setExpanded] = useState(showDetails)

  const formatTime = (minutes) => {
    if (!minutes) return null
    if (minutes < 60) return `${minutes}m`
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`
  }

  return (
    <div className="card">
      {/* Header */}
      <div className="flex justify-between items-start mb-3">
        <h3 className="text-lg font-semibold flex-1">{recipe.name}</h3>
        <div className="flex space-x-2 ml-4">
          {onEdit && (
            <button
              onClick={() => onEdit(recipe)}
              className="text-gray-500 hover:text-blue-600 transition-colors"
              title="Edit recipe"
            >
              ✏️
            </button>
          )}
          {onDelete && (
            <button
              onClick={() => onDelete(recipe.id)}
              className="text-gray-500 hover:text-red-600 transition-colors"
              title="Delete recipe"
            >
              🗑️
            </button>
          )}
        </div>
      </div>

      {/* Quick Info */}
      <div className="flex flex-wrap gap-4 text-sm text-gray-600 mb-3">
        {recipe.prep_time && (
          <span className="flex items-center gap-1">
            ⏱️ Prep: {formatTime(recipe.prep_time)}
          </span>
        )}
        {recipe.cook_time && (
          <span className="flex items-center gap-1">
            🔥 Cook: {formatTime(recipe.cook_time)}
          </span>
        )}
        {recipe.servings && (
          <span className="flex items-center gap-1">
            👥 Serves: {recipe.servings}
          </span>
        )}
      </div>

      {/* URL */}
      {recipe.url && (
        <a
          href={recipe.url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 hover:text-blue-800 text-sm mb-3 block"
        >
          View Original Recipe →
        </a>
      )}

      {/* Tags */}
      <div className="flex flex-wrap mb-4">
        {recipe.tags?.map((tag) => (
          <span key={tag} className="tag">{tag}</span>
        ))}
      </div>

      {/* Expandable Details */}
      {(recipe.ingredients?.length > 0 || recipe.instructions?.length > 0) && (
        <>
          <button
            onClick={() => setExpanded(!expanded)}
            className="w-full text-left text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors mb-3"
          >
            {expanded ? '▼ Hide Details' : '▶ Show Recipe Details'}
          </button>

          {expanded && (
            <div className="border-t pt-4 space-y-4">
              {/* Ingredients */}
              {recipe.ingredients?.length > 0 && (
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Ingredients</h4>
                  <ul className="space-y-1">
                    {recipe.ingredients.map((ingredient, index) => (
                      <li key={index} className="text-sm text-gray-700 flex">
                        <span className="mr-2">•</span>
                        <span>{ingredient}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Instructions */}
              {recipe.instructions?.length > 0 && (
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Instructions</h4>
                  <ol className="space-y-2">
                    {recipe.instructions.map((step, index) => (
                      <li key={index} className="text-sm text-gray-700 flex">
                        <span className="font-medium text-gray-500 mr-3 flex-shrink-0">
                          {index + 1}.
                        </span>
                        <span>{step}</span>
                      </li>
                    ))}
                  </ol>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  )
}

export default RecipeCard