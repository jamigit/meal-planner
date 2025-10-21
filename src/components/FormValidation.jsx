/**
 * @fileoverview Form validation components
 * 
 * Provides React components for form validation with real-time feedback,
 * error display, and validation state management.
 */

import React from 'react'
import { useFormValidation, VALIDATION_RULES } from '../utils/dataValidation.js'

/**
 * Form field wrapper with validation
 * @param {Object} props - Component props
 * @returns {JSX.Element}
 */
export function ValidatedField({ 
  name, 
  label, 
  type = 'text', 
  value, 
  onChange, 
  onBlur,
  error, 
  touched, 
  required = false,
  placeholder = '',
  className = '',
  ...props 
}) {
  const hasError = touched && error

  return (
    <div className={`validated-field ${className}`}>
      <label htmlFor={name} className="block text-sm font-medium text-gray-700 mb-1">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      
      <input
        id={name}
        name={name}
        type={type}
        value={value || ''}
        onChange={(e) => onChange(name, e.target.value)}
        onBlur={() => onBlur && onBlur(name)}
        placeholder={placeholder}
        className={`
          w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
          ${hasError 
            ? 'border-red-300 focus:ring-red-500 focus:border-red-500' 
            : 'border-gray-300'
          }
        `}
        {...props}
      />
      
      {hasError && (
        <p className="mt-1 text-sm text-red-600" role="alert">
          {error}
        </p>
      )}
    </div>
  )
}

/**
 * Textarea field with validation
 * @param {Object} props - Component props
 * @returns {JSX.Element}
 */
export function ValidatedTextarea({ 
  name, 
  label, 
  value, 
  onChange, 
  onBlur,
  error, 
  touched, 
  required = false,
  placeholder = '',
  rows = 3,
  className = '',
  ...props 
}) {
  const hasError = touched && error

  return (
    <div className={`validated-field ${className}`}>
      <label htmlFor={name} className="block text-sm font-medium text-gray-700 mb-1">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      
      <textarea
        id={name}
        name={name}
        value={value || ''}
        onChange={(e) => onChange(name, e.target.value)}
        onBlur={() => onBlur && onBlur(name)}
        placeholder={placeholder}
        rows={rows}
        className={`
          w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
          ${hasError 
            ? 'border-red-300 focus:ring-red-500 focus:border-red-500' 
            : 'border-gray-300'
          }
        `}
        {...props}
      />
      
      {hasError && (
        <p className="mt-1 text-sm text-red-600" role="alert">
          {error}
        </p>
      )}
    </div>
  )
}

/**
 * Number input field with validation
 * @param {Object} props - Component props
 * @returns {JSX.Element}
 */
export function ValidatedNumberField({ 
  name, 
  label, 
  value, 
  onChange, 
  onBlur,
  error, 
  touched, 
  required = false,
  min,
  max,
  step = 1,
  placeholder = '',
  className = '',
  ...props 
}) {
  const hasError = touched && error

  return (
    <div className={`validated-field ${className}`}>
      <label htmlFor={name} className="block text-sm font-medium text-gray-700 mb-1">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      
      <input
        id={name}
        name={name}
        type="number"
        value={value || ''}
        onChange={(e) => onChange(name, e.target.value ? Number(e.target.value) : null)}
        onBlur={() => onBlur && onBlur(name)}
        placeholder={placeholder}
        min={min}
        max={max}
        step={step}
        className={`
          w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
          ${hasError 
            ? 'border-red-300 focus:ring-red-500 focus:border-red-500' 
            : 'border-gray-300'
          }
        `}
        {...props}
      />
      
      {hasError && (
        <p className="mt-1 text-sm text-red-600" role="alert">
          {error}
        </p>
      )}
    </div>
  )
}

/**
 * Array field for ingredients, instructions, tags, etc.
 * @param {Object} props - Component props
 * @returns {JSX.Element}
 */
export function ValidatedArrayField({ 
  name, 
  label, 
  value = [], 
  onChange, 
  onBlur,
  error, 
  touched, 
  required = false,
  placeholder = 'Add item...',
  addButtonText = 'Add',
  className = '',
  ...props 
}) {
  const hasError = touched && error
  const [newItem, setNewItem] = React.useState('')

  const addItem = () => {
    if (newItem.trim()) {
      const updatedValue = [...value, newItem.trim()]
      onChange(name, updatedValue)
      setNewItem('')
    }
  }

  const removeItem = (index) => {
    const updatedValue = value.filter((_, i) => i !== index)
    onChange(name, updatedValue)
  }

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      addItem()
    }
  }

  return (
    <div className={`validated-field ${className}`}>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      
      <div className="space-y-2">
        {/* Existing items */}
        {value.map((item, index) => (
          <div key={index} className="flex items-center justify-between bg-gray-50 px-3 py-2 rounded-md">
            <span className="text-sm text-gray-700">{item}</span>
            <button
              type="button"
              onClick={() => removeItem(index)}
              className="text-red-500 hover:text-red-700 text-sm font-medium"
            >
              Remove
            </button>
          </div>
        ))}
        
        {/* Add new item */}
        <div className="flex space-x-2">
          <input
            type="text"
            value={newItem}
            onChange={(e) => setNewItem(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={placeholder}
            className="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
          <button
            type="button"
            onClick={addItem}
            className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            {addButtonText}
          </button>
        </div>
      </div>
      
      {hasError && (
        <p className="mt-1 text-sm text-red-600" role="alert">
          {error}
        </p>
      )}
    </div>
  )
}

/**
 * Form validation wrapper
 * @param {Object} props - Component props
 * @returns {JSX.Element}
 */
export function ValidatedForm({ 
  children, 
  onSubmit, 
  initialData, 
  schema, 
  className = '',
  ...props 
}) {
  const {
    data,
    errors,
    touched,
    isValid,
    updateField,
    touchField,
    resetForm,
    validateForm
  } = useFormValidation(initialData, schema)

  const handleSubmit = (e) => {
    e.preventDefault()
    
    if (isValid) {
      onSubmit(data)
    } else {
      // Mark all fields as touched to show errors
      const allTouched = Object.keys(schema).reduce((acc, key) => {
        acc[key] = true
        return acc
      }, {})
      // This would need to be implemented in the hook
      console.warn('Form is invalid, please fix errors before submitting')
    }
  }

  const formContext = {
    data,
    errors,
    touched,
    isValid,
    updateField,
    touchField,
    resetForm,
    validateForm
  }

  return (
    <form onSubmit={handleSubmit} className={className} {...props}>
      {typeof children === 'function' ? children(formContext) : children}
    </form>
  )
}

/**
 * Recipe form with validation
 * @param {Object} props - Component props
 * @returns {JSX.Element}
 */
export function RecipeForm({ onSubmit, initialData = {}, onCancel }) {
  const recipeSchema = VALIDATION_RULES.recipe

  return (
    <ValidatedForm
      initialData={{
        name: '',
        url: '',
        prep_time: null,
        cook_time: null,
        servings: null,
        ingredients: [],
        instructions: [],
        tags: [],
        ...initialData
      }}
      schema={recipeSchema}
      onSubmit={onSubmit}
      className="space-y-6"
    >
      {({ data, errors, touched, updateField, touchField }) => (
        <>
          <ValidatedField
            name="name"
            label="Recipe Name"
            value={data.name}
            onChange={updateField}
            onBlur={touchField}
            error={errors.name}
            touched={touched.name}
            required
            placeholder="Enter recipe name"
          />

          <ValidatedField
            name="url"
            label="Recipe URL"
            type="url"
            value={data.url}
            onChange={updateField}
            onBlur={touchField}
            error={errors.url}
            touched={touched.url}
            placeholder="https://example.com/recipe"
          />

          <div className="grid grid-cols-3 gap-4">
            <ValidatedNumberField
              name="prep_time"
              label="Prep Time (minutes)"
              value={data.prep_time}
              onChange={updateField}
              onBlur={touchField}
              error={errors.prep_time}
              touched={touched.prep_time}
              min={0}
              max={1440}
              placeholder="15"
            />

            <ValidatedNumberField
              name="cook_time"
              label="Cook Time (minutes)"
              value={data.cook_time}
              onChange={updateField}
              onBlur={touchField}
              error={errors.cook_time}
              touched={touched.cook_time}
              min={0}
              max={1440}
              placeholder="30"
            />

            <ValidatedNumberField
              name="servings"
              label="Servings"
              value={data.servings}
              onChange={updateField}
              onBlur={touchField}
              error={errors.servings}
              touched={touched.servings}
              min={1}
              max={50}
              placeholder="4"
            />
          </div>

          <ValidatedArrayField
            name="ingredients"
            label="Ingredients"
            value={data.ingredients}
            onChange={updateField}
            onBlur={touchField}
            error={errors.ingredients}
            touched={touched.ingredients}
            placeholder="Add ingredient..."
            addButtonText="Add Ingredient"
          />

          <ValidatedArrayField
            name="instructions"
            label="Instructions"
            value={data.instructions}
            onChange={updateField}
            onBlur={touchField}
            error={errors.instructions}
            touched={touched.instructions}
            placeholder="Add instruction step..."
            addButtonText="Add Step"
          />

          <ValidatedArrayField
            name="tags"
            label="Tags"
            value={data.tags}
            onChange={updateField}
            onBlur={touchField}
            error={errors.tags}
            touched={touched.tags}
            placeholder="Add tag..."
            addButtonText="Add Tag"
          />

          <div className="flex justify-end space-x-3">
            {onCancel && (
              <button
                type="button"
                onClick={onCancel}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                Cancel
              </button>
            )}
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Save Recipe
            </button>
          </div>
        </>
      )}
    </ValidatedForm>
  )
}

/**
 * Weekly plan form with validation
 * @param {Object} props - Component props
 * @returns {JSX.Element}
 */
export function WeeklyPlanForm({ onSubmit, initialData = {}, onCancel }) {
  const planSchema = VALIDATION_RULES.weeklyPlan

  return (
    <ValidatedForm
      initialData={{
        name: '',
        notes: '',
        meals: [],
        ...initialData
      }}
      schema={planSchema}
      onSubmit={onSubmit}
      className="space-y-6"
    >
      {({ data, errors, touched, updateField, touchField }) => (
        <>
          <ValidatedField
            name="name"
            label="Plan Name"
            value={data.name}
            onChange={updateField}
            onBlur={touchField}
            error={errors.name}
            touched={touched.name}
            placeholder="e.g., Week of Jan 15"
          />

          <ValidatedTextarea
            name="notes"
            label="Notes"
            value={data.notes}
            onChange={updateField}
            onBlur={touchField}
            error={errors.notes}
            touched={touched.notes}
            placeholder="Add any notes about this week's plan..."
            rows={4}
          />

          <div className="flex justify-end space-x-3">
            {onCancel && (
              <button
                type="button"
                onClick={onCancel}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                Cancel
              </button>
            )}
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Save Plan
            </button>
          </div>
        </>
      )}
    </ValidatedForm>
  )
}
