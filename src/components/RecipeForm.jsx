import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  TAG_CATEGORIES,
  CUISINE_TAGS,
  INGREDIENT_TAGS,
  CONVENIENCE_TAGS,
  getCategoryDisplayName,
  getCategoryColorClasses
} from '../constants/tagCategories.js'

function RecipeForm({ recipe = null, onSave, onCancel, isOpen }) {
  const [formData, setFormData] = useState({
    name: recipe?.name || '',
    url: recipe?.url || '',
    tags: recipe?.tags?.join(', ') || '',
    cuisine_tags: recipe?.cuisine_tags || [],
    ingredient_tags: recipe?.ingredient_tags || [],
    convenience_tags: recipe?.convenience_tags || [],
    ingredients: recipe?.ingredients && recipe?.ingredients.length > 0 ? recipe.ingredients : [''],
    instructions: recipe?.instructions && recipe?.instructions.length > 0 ? recipe.instructions : [''],
    prep_time: recipe?.prep_time || '',
    cook_time: recipe?.cook_time || '',
    servings: recipe?.servings || ''
  })

  const [errors, setErrors] = useState({})

  // Update form data when recipe prop changes
  useEffect(() => {
    if (recipe) {
      setFormData({
        name: recipe.name || '',
        url: recipe.url || '',
        tags: recipe.tags?.join(', ') || '',
        cuisine_tags: recipe.cuisine_tags || [],
        ingredient_tags: recipe.ingredient_tags || [],
        convenience_tags: recipe.convenience_tags || [],
        ingredients: recipe.ingredients && recipe.ingredients.length > 0 ? recipe.ingredients : [''],
        instructions: recipe.instructions && recipe.instructions.length > 0 ? recipe.instructions : [''],
        prep_time: recipe.prep_time || '',
        cook_time: recipe.cook_time || '',
        servings: recipe.servings || ''
      })
    } else {
      // Reset form for new recipe
      setFormData({
        name: '',
        url: '',
        tags: '',
        cuisine_tags: [],
        ingredient_tags: [],
        convenience_tags: [],
        ingredients: [''],
        instructions: [''],
        prep_time: '',
        cook_time: '',
        servings: ''
      })
    }
    // Clear any existing errors
    setErrors({})
  }, [recipe])

  if (!isOpen) return null

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }))
    }
  }

  const handleIngredientChange = (index, value) => {
    const newIngredients = [...formData.ingredients]
    newIngredients[index] = value
    setFormData(prev => ({ ...prev, ingredients: newIngredients }))
  }

  const addIngredient = () => {
    setFormData(prev => ({
      ...prev,
      ingredients: [...prev.ingredients, '']
    }))
  }

  const removeIngredient = (index) => {
    if (formData.ingredients.length > 1) {
      const newIngredients = formData.ingredients.filter((_, i) => i !== index)
      setFormData(prev => ({ ...prev, ingredients: newIngredients }))
    }
  }

  const handleInstructionChange = (index, value) => {
    const newInstructions = [...formData.instructions]
    newInstructions[index] = value
    setFormData(prev => ({ ...prev, instructions: newInstructions }))
  }

  const addInstruction = () => {
    setFormData(prev => ({
      ...prev,
      instructions: [...prev.instructions, '']
    }))
  }

  const removeInstruction = (index) => {
    if (formData.instructions.length > 1) {
      const newInstructions = formData.instructions.filter((_, i) => i !== index)
      setFormData(prev => ({ ...prev, instructions: newInstructions }))
    }
  }

  // Categorized tag handlers
  const handleTagToggle = (category, tag) => {
    const categoryField = `${category}_tags`
    const currentTags = formData[categoryField] || []

    const newTags = currentTags.includes(tag)
      ? currentTags.filter(t => t !== tag)
      : [...currentTags, tag]

    setFormData(prev => ({ ...prev, [categoryField]: newTags }))
  }

  const renderTagCategory = (category, availableTags) => {
    const categoryField = `${category}_tags`
    const selectedTags = formData[categoryField] || []

    return (
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-3">
          {getCategoryDisplayName(category)}
        </label>
        <div className="flex flex-wrap gap-2">
          {availableTags.map(tag => {
            const isSelected = selectedTags.includes(tag)
            const colorClasses = getCategoryColorClasses(category)

            return (
              <button
                key={tag}
                type="button"
                onClick={() => handleTagToggle(category, tag)}
                className={`px-3 py-1 rounded-full text-sm border transition-colors ${
                  isSelected
                    ? colorClasses
                    : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'
                }`}
              >
                {tag}
              </button>
            )
          })}
        </div>
      </div>
    )
  }

  const validateForm = () => {
    const newErrors = {}

    if (!formData.name.trim()) {
      newErrors.name = 'Recipe name is required'
    }

    const nonEmptyIngredients = formData.ingredients.filter(ing => ing.trim())
    if (nonEmptyIngredients.length === 0) {
      newErrors.ingredients = 'At least one ingredient is required'
    }

    const nonEmptyInstructions = formData.instructions.filter(inst => inst.trim())
    if (nonEmptyInstructions.length === 0) {
      newErrors.instructions = 'At least one instruction is required'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    const recipeData = {
      name: formData.name.trim(),
      url: formData.url.trim() || null,
      tags: formData.tags ? formData.tags.split(',').map(tag => tag.trim()).filter(tag => tag) : [],
      cuisine_tags: formData.cuisine_tags || [],
      ingredient_tags: formData.ingredient_tags || [],
      convenience_tags: formData.convenience_tags || [],
      ingredients: formData.ingredients.filter(ing => ing.trim()),
      instructions: formData.instructions.filter(inst => inst.trim()),
      prep_time: formData.prep_time ? parseInt(formData.prep_time) : null,
      cook_time: formData.cook_time ? parseInt(formData.cook_time) : null,
      servings: formData.servings ? parseInt(formData.servings) : null
    }

    try {
      await onSave(recipeData)
    } catch (error) {
      console.error('Failed to save recipe:', error)
      setErrors({ submit: 'Failed to save recipe. Please try again.' })
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 bg-black bg-opacity-50"
            style={{ zIndex: 1000 }}
            onClick={onCancel}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          />
          
          {/* Sidebar */}
          <motion.div 
            className="fixed inset-y-0 right-0 w-96 bg-white shadow-xl border-l border-gray-200 flex flex-col"
            style={{ zIndex: 1001 }}
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
            {/* Fixed Header */}
            <div className="sticky top-0 flex-shrink-0 p-4 border-b border-gray-200 bg-white z-10">
              <div className="flex justify-between items-center">
                <h2 className="text-lg font-semibold text-gray-900">
                  {recipe ? 'Edit Recipe' : 'Add New Recipe'}
                </h2>
                <button
                  type="button"
                  onClick={onCancel}
                  className="flex items-center gap-2 px-3 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <span className="text-lg">×</span>
                  <span className="text-sm font-medium">Close</span>
                </button>
              </div>
            </div>
            
            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-4">
              <form onSubmit={handleSubmit} className="space-y-6">

          {errors.submit && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
              {errors.submit}
            </div>
          )}

          <div className="space-y-6">
            {/* Basic Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Recipe Name *
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.name ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="Enter recipe name"
                />
                {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Recipe URL
                </label>
                <input
                  type="url"
                  name="url"
                  value={formData.url}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="https://example.com/recipe"
                />
              </div>
            </div>

            {/* Times and Servings */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Prep Time (minutes)
                </label>
                <input
                  type="number"
                  name="prep_time"
                  value={formData.prep_time}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="30"
                  min="0"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Cook Time (minutes)
                </label>
                <input
                  type="number"
                  name="cook_time"
                  value={formData.cook_time}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="45"
                  min="0"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Servings
                </label>
                <input
                  type="number"
                  name="servings"
                  value={formData.servings}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="4"
                  min="1"
                />
              </div>
            </div>

            {/* Legacy Tags */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Other Tags (comma-separated)
              </label>
              <input
                type="text"
                name="tags"
                value={formData.tags}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="gluten-free, dairy-free, special occasions"
              />
              <p className="text-xs text-gray-500 mt-1">
                For dietary restrictions, special occasions, or other tags not covered by the categories below
              </p>
            </div>

            {/* Categorized Tags */}
            <div className="space-y-6">
              <h3 className="text-lg font-medium text-gray-900 border-b border-gray-200 pb-2">
                Recipe Categories
              </h3>

              {renderTagCategory(TAG_CATEGORIES.CUISINE, CUISINE_TAGS)}
              {renderTagCategory(TAG_CATEGORIES.INGREDIENTS, INGREDIENT_TAGS)}
              {renderTagCategory(TAG_CATEGORIES.CONVENIENCE, CONVENIENCE_TAGS)}
            </div>

            {/* Ingredients */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="block text-sm font-medium text-gray-700">
                  Ingredients *
                </label>
                <button
                  type="button"
                  onClick={addIngredient}
                  className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                >
                  + Add Ingredient
                </button>
              </div>
              {errors.ingredients && <p className="text-red-500 text-sm mb-2">{errors.ingredients}</p>}
              <div className="space-y-2">
                {formData.ingredients.map((ingredient, index) => (
                  <div key={index} className="flex gap-2">
                    <input
                      type="text"
                      value={ingredient}
                      onChange={(e) => handleIngredientChange(index, e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder={`Ingredient ${index + 1}`}
                    />
                    {formData.ingredients.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeIngredient(index)}
                        className="text-red-600 hover:text-red-800 px-2"
                      >
                        ×
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Instructions */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="block text-sm font-medium text-gray-700">
                  Instructions *
                </label>
                <button
                  type="button"
                  onClick={addInstruction}
                  className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                >
                  + Add Step
                </button>
              </div>
              {errors.instructions && <p className="text-red-500 text-sm mb-2">{errors.instructions}</p>}
              <div className="space-y-2">
                {formData.instructions.map((instruction, index) => (
                  <div key={index} className="flex gap-2">
                    <span className="flex-shrink-0 w-8 h-10 bg-gray-100 rounded flex items-center justify-center text-sm font-medium text-gray-600">
                      {index + 1}
                    </span>
                    <textarea
                      value={instruction}
                      onChange={(e) => handleInstructionChange(index, e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                      placeholder={`Step ${index + 1}...`}
                      rows="2"
                    />
                    {formData.instructions.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeInstruction(index)}
                        className="text-red-600 hover:text-red-800 px-2 self-start mt-2"
                      >
                        ×
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

                {/* Form Actions */}
                <div className="flex justify-end space-x-3 pt-6 border-t">
                  <button
                    type="button"
                    onClick={onCancel}
                    className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn-primary"
                  >
                    {recipe ? 'Update Recipe' : 'Save Recipe'}
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

export default RecipeForm