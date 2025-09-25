import { useState, useRef } from 'react'
import Papa from 'papaparse'
import { recipeService } from '../database/recipeService.js'

function CSVUpload({ onUploadComplete }) {
  const [isUploading, setIsUploading] = useState(false)
  const [uploadStatus, setUploadStatus] = useState('')
  const fileInputRef = useRef(null)

  const handleFileSelect = (event) => {
    const file = event.target.files[0]
    if (!file) return

    if (!file.name.toLowerCase().endsWith('.csv')) {
      setUploadStatus('Please select a CSV file')
      return
    }

    processCSVFile(file)
  }

  const processCSVFile = (file) => {
    setIsUploading(true)
    setUploadStatus('Processing CSV file...')

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        try {
          if (results.errors.length > 0) {
            console.warn('CSV parsing warnings:', results.errors)
          }

          const recipes = results.data
            .filter(row => row.name && row.name.trim())
            .map(row => ({
              name: row.name?.trim() || '',
              url: row.url?.trim() || '',
              tags: row.tags ? row.tags.split(',').map(tag => tag.trim()).filter(Boolean) : [],
              ingredients: row.ingredients ? row.ingredients.split('|').map(ing => ing.trim()).filter(Boolean) : [],
              instructions: row.instructions ? row.instructions.split('|').map(inst => inst.trim()).filter(Boolean) : [],
              prep_time: row.prep_time ? parseInt(row.prep_time) : null,
              cook_time: row.cook_time ? parseInt(row.cook_time) : null,
              servings: row.servings ? parseInt(row.servings) : null
            }))

          if (recipes.length === 0) {
            setUploadStatus('No valid recipes found in CSV file')
            setIsUploading(false)
            return
          }

          setUploadStatus(`Importing ${recipes.length} recipes...`)

          const insertedIds = await recipeService.bulkInsert(recipes)

          setUploadStatus(`Successfully imported ${insertedIds.length} recipes!`)
          setIsUploading(false)

          if (onUploadComplete) {
            onUploadComplete(insertedIds.length)
          }

          // Clear file input
          if (fileInputRef.current) {
            fileInputRef.current.value = ''
          }

        } catch (error) {
          console.error('Failed to import recipes:', error)
          setUploadStatus('Failed to import recipes. Please check the console for details.')
          setIsUploading(false)
        }
      },
      error: (error) => {
        console.error('CSV parsing error:', error)
        setUploadStatus('Failed to parse CSV file')
        setIsUploading(false)
      }
    })
  }

  return (
    <div className="card">
      <h3 className="text-lg font-semibold mb-4">Import Recipes from CSV</h3>

      <div className="mb-4">
        <p className="text-sm text-gray-600 mb-2">
          CSV format: name, url, tags, ingredients, instructions, prep_time, cook_time, servings
        </p>
        <p className="text-xs text-gray-500 mb-2">
          • Tags: comma-separated (e.g., "pasta,italian,quick")
        </p>
        <p className="text-xs text-gray-500 mb-2">
          • Ingredients: pipe-separated (e.g., "2 cups flour|1 tbsp oil|salt to taste")
        </p>
        <p className="text-xs text-gray-500">
          • Instructions: pipe-separated (e.g., "Preheat oven|Mix ingredients|Bake 30 min")
        </p>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept=".csv"
        onChange={handleFileSelect}
        disabled={isUploading}
        className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-green-50 file:text-green-700 hover:file:bg-green-100 disabled:opacity-50"
      />

      {uploadStatus && (
        <div className={`mt-4 p-3 rounded-lg ${
          uploadStatus.includes('Successfully')
            ? 'bg-green-50 text-green-800'
            : uploadStatus.includes('Failed')
            ? 'bg-red-50 text-red-800'
            : 'bg-green-50 text-green-800'
        }`}>
          {isUploading && (
            <div className="flex items-center">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-green-600 mr-2"></div>
              {uploadStatus}
            </div>
          )}
          {!isUploading && uploadStatus}
        </div>
      )}
    </div>
  )
}

export default CSVUpload