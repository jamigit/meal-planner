import { useState } from 'react'
import { analyzeExistingTags, migrateAllRecipes } from '../utils/tagMigration.js'

function TagMigrationModal({ isOpen, onClose, onMigrationComplete }) {
  const [analysis, setAnalysis] = useState(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [isMigrating, setIsMigrating] = useState(false)
  const [migrationComplete, setMigrationComplete] = useState(false)

  if (!isOpen) return null

  const handleAnalyze = async () => {
    setIsAnalyzing(true)
    try {
      const result = await analyzeExistingTags()
      setAnalysis(result)
    } catch (error) {
      console.error('Failed to analyze tags:', error)
      alert('Failed to analyze existing tags. Please try again.')
    } finally {
      setIsAnalyzing(false)
    }
  }

  const handleMigrate = async () => {
    setIsMigrating(true)
    try {
      await migrateAllRecipes()
      setMigrationComplete(true)
      if (onMigrationComplete) {
        onMigrationComplete()
      }
    } catch (error) {
      console.error('Failed to migrate recipes:', error)
      alert('Failed to migrate recipes. Please try again.')
    } finally {
      setIsMigrating(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60] p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-screen overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900">
              Migrate to Categorized Tags
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-2xl"
            >
              ×
            </button>
          </div>

          <div className="space-y-6">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="font-semibold text-blue-900 mb-2">
                🎯 New Tag Categories
              </h3>
              <p className="text-sm text-blue-800 mb-3">
                Your recipes will now use three organized tag categories:
              </p>
              <ul className="text-sm text-blue-800 space-y-1">
                <li><span className="font-medium text-blue-600">🌍 Cuisine:</span> Italian, Mexican, Japanese, etc.</li>
                <li><span className="font-medium text-green-600">🥘 Main Ingredients:</span> Chicken, Pasta, Fish, etc.</li>
                <li><span className="font-medium text-purple-600">⚡ Convenience:</span> Quick, One-Pot, Make-Ahead, etc.</li>
              </ul>
            </div>

            {!analysis ? (
              <div className="text-center">
                <p className="text-gray-600 mb-4">
                  Analyze your existing tags to see how they'll be categorized.
                </p>
                <button
                  onClick={handleAnalyze}
                  disabled={isAnalyzing}
                  className="btn-secondary disabled:opacity-50"
                >
                  {isAnalyzing ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2 inline-block"></div>
                      Analyzing...
                    </>
                  ) : (
                    'Analyze Existing Tags'
                  )}
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-semibold mb-3">Migration Analysis</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium">Total Recipes:</span> {analysis.totalRecipes}
                    </div>
                    <div>
                      <span className="font-medium">Unique Tags:</span> {analysis.totalUniqueTags}
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="border border-blue-200 rounded-lg p-3">
                    <h5 className="font-medium text-blue-800 mb-2">
                      🌍 Cuisine Tags ({analysis.categorized.cuisine.length})
                    </h5>
                    <div className="flex flex-wrap gap-1">
                      {analysis.categorized.cuisine.map(tag => (
                        <span key={tag} className="tag-cuisine text-xs">{tag}</span>
                      ))}
                    </div>
                  </div>

                  <div className="border border-green-200 rounded-lg p-3">
                    <h5 className="font-medium text-green-800 mb-2">
                      🥘 Ingredient Tags ({analysis.categorized.ingredients.length})
                    </h5>
                    <div className="flex flex-wrap gap-1">
                      {analysis.categorized.ingredients.map(tag => (
                        <span key={tag} className="tag-ingredients text-xs">{tag}</span>
                      ))}
                    </div>
                  </div>

                  <div className="border border-purple-200 rounded-lg p-3">
                    <h5 className="font-medium text-purple-800 mb-2">
                      ⚡ Convenience Tags ({analysis.categorized.convenience.length})
                    </h5>
                    <div className="flex flex-wrap gap-1">
                      {analysis.categorized.convenience.map(tag => (
                        <span key={tag} className="tag-convenience text-xs">{tag}</span>
                      ))}
                    </div>
                  </div>

                  {analysis.unmapped.length > 0 && (
                    <div className="border border-gray-200 rounded-lg p-3">
                      <h5 className="font-medium text-gray-800 mb-2">
                        🏷️ Other Tags ({analysis.unmapped.length})
                      </h5>
                      <p className="text-xs text-gray-600 mb-2">
                        These tags will remain as "Other Tags" for dietary restrictions, special occasions, etc.
                      </p>
                      <div className="flex flex-wrap gap-1">
                        {analysis.unmapped.map(tag => (
                          <span key={tag} className="tag-legacy text-xs">{tag}</span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {migrationComplete ? (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
                    <div className="text-green-600 text-4xl mb-2">✅</div>
                    <h3 className="font-semibold text-green-900 mb-2">Migration Complete!</h3>
                    <p className="text-sm text-green-800">
                      All {analysis.totalRecipes} recipes have been updated with categorized tags.
                    </p>
                  </div>
                ) : (
                  <div className="text-center">
                    <p className="text-gray-600 mb-4">
                      Ready to migrate your recipes to the new tag system?
                    </p>
                    <button
                      onClick={handleMigrate}
                      disabled={isMigrating}
                      className="btn-primary disabled:opacity-50"
                    >
                      {isMigrating ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2 inline-block"></div>
                          Migrating Recipes...
                        </>
                      ) : (
                        `Migrate ${analysis.totalRecipes} Recipes`
                      )}
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="flex justify-end mt-8 pt-6 border-t">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 transition-colors"
            >
              {migrationComplete ? 'Done' : 'Cancel'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default TagMigrationModal