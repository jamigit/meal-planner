import { useState, useEffect } from 'react'
import { recipeService } from '../database/recipeService.js'

function RecipeSelector({ isOpen, onClose, onSelectRecipes, selectedMealIds = [] }) {
  const [recipes, setRecipes] = useState([])
  const [selectedRecipes, setSelectedRecipes] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedTag, setSelectedTag] = useState('')

  useEffect(() => {
    if (isOpen) {
      const loadRecipes = async () => {
        const allRecipes = await recipeService.getAll()
        setRecipes(allRecipes)

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

  const allTags = [...new Set(recipes.flatMap(recipe => recipe.tags || []))]

  const filteredRecipes = recipes.filter(recipe => {
    const matchesSearch = recipe.name.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesTag = !selectedTag || recipe.tags?.includes(selectedTag)
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

        {/* Search and Filter */}
        <div className="mb-6 space-y-4">
          <input
            type="text"
            placeholder="Search recipes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />

          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setSelectedTag('')}
              className={`px-3 py-1 rounded-full text-sm ${
                !selectedTag ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'
              }`}
            >
              All Tags
            </button>
            {allTags.map(tag => (
              <button
                key={tag}
                onClick={() => setSelectedTag(tag)}
                className={`px-3 py-1 rounded-full text-sm ${
                  selectedTag === tag ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'
                }`}
              >
                {tag}
              </button>
            ))}
          </div>
        </div>

        {/* Recipe Grid */}
        <div className="overflow-y-auto flex-1 mb-6">
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
                    <h3 className={`font-semibold ${!canSelect ? 'text-gray-400' : ''}`}>
                      {recipe.name}
                    </h3>
                    {isSelected && (
                      <span className="text-blue-600 text-xl">✓</span>
                    )}
                  </div>

                  {recipe.url && (
                    <a
                      href={recipe.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800 text-sm block mb-2"
                      onClick={(e) => e.stopPropagation()}
                    >
                      View Recipe →
                    </a>
                  )}

                  <div className="flex flex-wrap">
                    {recipe.tags?.map(tag => (
                      <span key={tag} className="tag text-xs">{tag}</span>
                    ))}
                  </div>
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