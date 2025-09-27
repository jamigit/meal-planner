import { useState } from 'react'
import { motion } from 'framer-motion'
import CategorizedTags from './CategorizedTags'

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
    <motion.div 
      className="card"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Header */}
      <div className="flex justify-between items-start mb-3">
        <h3 className="text-h5 font-heading font-black text-text-primary flex-1">{recipe.name}</h3>
        <div className="flex space-x-2 ml-4">
          {onEdit && (
            <button
              onClick={() => onEdit(recipe)}
              className="text-black hover:text-green-700 transition-colors"
              title="Edit recipe"
            >
              <span className="material-symbols-rounded text-[20px]">edit</span>
            </button>
          )}
          {onDelete && (
            <button
              onClick={() => onDelete(recipe.id)}
              className="text-black hover:text-red-600 transition-colors"
              title="Delete recipe"
            >
              <span className="material-symbols-rounded text-[20px]">delete</span>
            </button>
          )}
        </div>
      </div>

      {/* Quick Info */}
      <div className="flex flex-wrap gap-4 text-sm text-black mb-3">
        {recipe.prep_time && (
          <span className="flex items-center gap-1">
            <span className="material-symbols-rounded text-[18px] align-middle">timer</span>
            <span>Prep: {formatTime(recipe.prep_time)}</span>
          </span>
        )}
        {recipe.cook_time && (
          <span className="flex items-center gap-1">
            <span className="material-symbols-rounded text-[18px] align-middle">local_fire_department</span>
            <span>Cook: {formatTime(recipe.cook_time)}</span>
          </span>
        )}
        {recipe.servings && (
          <span className="flex items-center gap-1">
            <span className="material-symbols-rounded text-[18px] align-middle">group</span>
            <span>Serves: {recipe.servings}</span>
          </span>
        )}
      </div>

      {/* URL */}
      {recipe.url && (
        <a
          href={recipe.url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-green-700 hover:text-green-800 text-sm mb-3 inline-block"
        >
          View Original Recipe →
        </a>
      )}

      {/* Categorized Tags */}
      <CategorizedTags recipe={recipe} className="mb-4" />

      {/* Expandable Details */}
      {(recipe.ingredients?.length > 0 || recipe.instructions?.length > 0) && (
        <>
          <button
            onClick={() => setExpanded(!expanded)}
            className="w-full text-left text-sm font-medium text-black transition-colors mb-3 flex items-center gap-2 border-2 border-black rounded-lg px-3 py-2 bg-transparent hover:bg-transparent"
          >
            <span className="material-symbols-rounded text-[18px]">{expanded ? 'expand_less' : 'expand_more'}</span>
            <span>{expanded ? 'Hide Details' : 'Show Recipe Details'}</span>
          </button>

          {expanded && (
            <div className="pt-4 space-y-4">
              {/* Ingredients */}
              {recipe.ingredients?.length > 0 && (
                <div>
                  <h4 className="text-h6 font-heading font-black text-text-primary mb-2">Ingredients</h4>
                  <ul className="space-y-1">
                    {recipe.ingredients.map((ingredient, index) => (
                      <li key={index} className="text-sm text-black flex">
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
                  <h4 className="font-semibold text-black mb-2">Instructions</h4>
                  <ol className="space-y-2">
                    {recipe.instructions.map((step, index) => (
                      <li key={index} className="text-sm text-black flex">
                        <span className="font-medium text-black mr-3 flex-shrink-0">
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
    </motion.div>
  )
}

export default RecipeCard