import { useState } from 'react'
import { motion } from 'framer-motion'

function BulkRecipeScraper({ isOpen, onClose }) {
  const [input, setInput] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [progress, setProgress] = useState({ current: 0, total: 0 })
  const [results, setResults] = useState([])
  const [csvData, setCsvData] = useState('')

  const processInput = async () => {
    if (!input.trim()) return

    const lines = input.split('\n').filter(line => line.trim())
    setIsProcessing(true)
    setProgress({ current: 0, total: lines.length })
    setResults([])

    const processedRecipes = []

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim()
      setProgress({ current: i + 1, total: lines.length })

      try {
        console.log(`🔄 Processing ${i + 1}/${lines.length}: ${line}`)
        
        const result = await processLine(line)
        if (result) {
          processedRecipes.push(result)
          setResults(prev => [...prev, result])
        }

      } catch (error) {
        console.error(`❌ Failed to process: ${line}`, error)
        const failedResult = {
          name: line.startsWith('http') ? 'Failed to scrape' : line,
          url: line.startsWith('http') ? line : '',
          error: error.message,
          status: 'error',
          source: line.startsWith('http') ? 'scraped' : 'ai-generated'
        }
        processedRecipes.push(failedResult)
        setResults(prev => [...prev, failedResult])
      }

      // Small delay to be respectful to servers and AI API
      await new Promise(resolve => setTimeout(resolve, 1000))
    }

    // Generate CSV
    const csv = generateCSV(processedRecipes.filter(r => r.status === 'success'))
    setCsvData(csv)
    setIsProcessing(false)
    console.log('✅ Bulk processing completed!')
  }

  const processLine = async (line) => {
    const isUrl = /^https?:\/\//.test(line)
    
    if (isUrl) {
      console.log(`🌐 Scraping URL: ${line}`)
      return await processUrl(line)
    } else {
      console.log(`📝 Generating recipe for: ${line}`)
      return await processRecipeName(line)
    }
  }

  const processUrl = async (url) => {
    try {
      // Scrape recipe data
      const scrapedData = await scrapeRecipe(url)
      
      // Generate AI tags for scraped data
      const aiTags = await generateAITags(scrapedData)
      
      return {
        name: scrapedData.name || 'Unknown Recipe',
        url: url,
        ingredients: scrapedData.ingredients || [],
        instructions: scrapedData.instructions || [],
        prep_time: scrapedData.prep_time || '',
        cook_time: scrapedData.cook_time || '',
        servings: scrapedData.servings || '',
        cuisine_tags: aiTags.cuisine_tags || [],
        ingredient_tags: aiTags.ingredient_tags || [],
        convenience_tags: aiTags.convenience_tags || [],
        status: 'success',
        source: 'scraped'
      }
    } catch (error) {
      throw new Error(`Scraping failed: ${error.message}`)
    }
  }

  const processRecipeName = async (recipeName) => {
    try {
      // Use AI to generate recipe data from name only
      const aiData = await generateRecipeData(recipeName)
      
      return {
        name: recipeName,
        url: '', // No URL for name-only recipes
        ingredients: aiData.ingredients || [],
        instructions: [], // Empty for name-only recipes as requested
        prep_time: aiData.prep_time || '',
        cook_time: aiData.cook_time || '',
        servings: aiData.servings || '',
        cuisine_tags: aiData.cuisine_tags || [],
        ingredient_tags: aiData.ingredient_tags || [],
        convenience_tags: aiData.convenience_tags || [],
        status: 'success',
        source: 'ai-generated'
      }
    } catch (error) {
      throw new Error(`AI generation failed: ${error.message}`)
    }
  }

  const scrapeRecipe = async (url) => {
    const response = await fetch('/api/scrape-recipe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url })
    })

    if (!response.ok) {
      throw new Error(`Scraping failed: ${response.status}`)
    }

    return await response.json()
  }

  const generateAITags = async (recipeData) => {
    try {
      const response = await fetch('/api/generate-tags', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: recipeData.name,
          ingredients: recipeData.ingredients,
          instructions: recipeData.instructions,
          prep_time: recipeData.prep_time,
          cook_time: recipeData.cook_time
        })
      })

      if (!response.ok) {
        throw new Error(`AI tagging failed: ${response.status}`)
      }

      return await response.json()
    } catch (error) {
      console.warn('AI tagging failed, using fallback tags:', error)
      return {
        cuisine_tags: [],
        ingredient_tags: [],
        convenience_tags: []
      }
    }
  }

  const generateRecipeData = async (recipeName) => {
    try {
      const response = await fetch('/api/generate-recipe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: recipeName })
      })

      if (!response.ok) {
        throw new Error(`Recipe generation failed: ${response.status}`)
      }

      return await response.json()
    } catch (error) {
      throw new Error(`AI recipe generation failed: ${error.message}`)
    }
  }

  const generateCSV = (recipes) => {
    const headers = [
      'name', 'url', 'ingredients', 'instructions', 'prep_time', 'cook_time', 'servings',
      'cuisine_tags', 'ingredient_tags', 'convenience_tags'
    ]

    const rows = recipes.map(recipe => [
      `"${recipe.name.replace(/"/g, '""')}"`,
      `"${recipe.url || ''}"`,
      `"${Array.isArray(recipe.ingredients) ? recipe.ingredients.join('; ') : ''}"`,
      `"${Array.isArray(recipe.instructions) ? recipe.instructions.join('; ') : ''}"`,
      `"${recipe.prep_time || ''}"`,
      `"${recipe.cook_time || ''}"`,
      `"${recipe.servings || ''}"`,
      `"${Array.isArray(recipe.cuisine_tags) ? recipe.cuisine_tags.join(', ') : ''}"`,
      `"${Array.isArray(recipe.ingredient_tags) ? recipe.ingredient_tags.join(', ') : ''}"`,
      `"${Array.isArray(recipe.convenience_tags) ? recipe.convenience_tags.join(', ') : ''}"`
    ])

    return [headers.join(','), ...rows.map(row => row.join(','))].join('\n')
  }

  const downloadCSV = () => {
    const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `bulk-recipes-${new Date().toISOString().split('T')[0]}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const resetForm = () => {
    setInput('')
    setResults([])
    setCsvData('')
    setProgress({ current: 0, total: 0 })
  }

  const getStats = () => {
    const successful = results.filter(r => r.status === 'success')
    const aiGenerated = successful.filter(r => r.source === 'ai-generated').length
    const scraped = successful.filter(r => r.source === 'scraped').length
    const failed = results.filter(r => r.status === 'error').length
    
    return { total: results.length, successful: successful.length, aiGenerated, scraped, failed }
  }

  if (!isOpen) return null

  const stats = getStats()
  const inputLines = input.split('\n').filter(line => line.trim())

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-[60]">
      <motion.div 
        className="bg-white rounded-lg max-w-5xl w-full max-h-[90vh] flex flex-col"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold text-gray-900">
              🤖 Bulk Recipe Processor
            </h2>
            <button
              onClick={onClose}
              className="btn-outline-black-sm flex items-center gap-2"
            >
              <span>×</span>
              <span>Close</span>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {!isProcessing && results.length === 0 && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Recipe Names or URLs (one per line):
                </label>
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  className="w-full h-64 p-3 border border-gray-300 rounded-lg resize-none font-mono text-sm"
                  placeholder={`Chicken Parmesan
https://allrecipes.com/recipe/beef-stroganoff
Thai Green Curry
https://foodnetwork.com/recipe/lasagna
Mushroom Risotto`}
                />
              </div>
              
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="font-semibold text-blue-900 mb-2">How it works:</h3>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• <strong>Recipe Names:</strong> AI generates key ingredients and tags</li>
                  <li>• <strong>URLs:</strong> Scrapes full recipe data + AI-generated tags</li>
                  <li>• <strong>Mixed Input:</strong> Handles both types in the same list</li>
                  <li>• <strong>CSV Export:</strong> Download results for easy import</li>
                </ul>
              </div>

              <button
                onClick={processInput}
                disabled={!input.trim()}
                className="btn-primary w-full"
              >
                🚀 Process Recipes ({inputLines.length} items)
              </button>
            </div>
          )}

          {isProcessing && (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
              <h3 className="text-lg font-semibold mb-2">
                Processing Recipes...
              </h3>
              <p className="text-gray-600 mb-4">
                {progress.current} of {progress.total} items processed
              </p>
              <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
                <div 
                  className="bg-green-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${(progress.current / progress.total) * 100}%` }}
                ></div>
              </div>
              {results.length > 0 && (
                <p className="text-sm text-gray-500">
                  Latest: {results[results.length - 1]?.name}
                </p>
              )}
            </div>
          )}

          {results.length > 0 && !isProcessing && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-lg font-semibold">
                    Results ({stats.successful} successful, {stats.failed} failed)
                  </h3>
                  <p className="text-sm text-gray-600">
                    {stats.aiGenerated} AI-generated • {stats.scraped} scraped from URLs
                  </p>
                </div>
                <div className="space-x-2">
                  <button onClick={resetForm} className="btn-outline-black">
                    Start Over
                  </button>
                  {csvData && (
                    <button onClick={downloadCSV} className="btn-primary">
                      📥 Download CSV ({stats.successful} recipes)
                    </button>
                  )}
                </div>
              </div>

              <div className="max-h-64 overflow-y-auto space-y-2">
                {results.map((recipe, index) => (
                  <div 
                    key={index} 
                    className={`p-3 rounded-lg border ${
                      recipe.status === 'success' 
                        ? 'border-green-200 bg-green-50' 
                        : 'border-red-200 bg-red-50'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span>{recipe.status === 'success' ? '✅' : '❌'}</span>
                          <h4 className="font-medium">{recipe.name}</h4>
                          <span className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-600">
                            {recipe.source === 'ai-generated' ? '🤖 AI' : '🌐 Scraped'}
                          </span>
                        </div>
                        
                        {recipe.url && (
                          <p className="text-sm text-gray-600 mb-1">{recipe.url}</p>
                        )}
                        
                        {recipe.status === 'success' && (
                          <div className="text-xs text-gray-500">
                            <div className="mb-1">
                              <strong>Ingredients:</strong> {recipe.ingredients?.slice(0, 3).join(', ')}{recipe.ingredients?.length > 3 ? '...' : ''}
                            </div>
                            <div>
                              <strong>Tags:</strong> {[
                                ...(recipe.cuisine_tags || []),
                                ...(recipe.ingredient_tags || []),
                                ...(recipe.convenience_tags || [])
                              ].join(', ') || 'None'}
                            </div>
                          </div>
                        )}
                        
                        {recipe.status === 'error' && (
                          <p className="text-sm text-red-600">{recipe.error}</p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  )
}

export default BulkRecipeScraper
