import { useState } from 'react'
import { seedSupabaseRecipes, checkExistingRecipes } from '../utils/seedSupabaseRecipes.js'

function RecipeSeeder() {
  const [isSeeding, setIsSeeding] = useState(false)
  const [seedingResult, setSeedingResult] = useState(null)
  const [existingRecipes, setExistingRecipes] = useState(null)
  const [isChecking, setIsChecking] = useState(false)

  const handleCheckRecipes = async () => {
    setIsChecking(true)
    setSeedingResult(null)
    
    try {
      const result = await checkExistingRecipes()
      setExistingRecipes(result)
    } catch (error) {
      console.error('Error checking recipes:', error)
      setExistingRecipes({ success: false, error: error.message })
    } finally {
      setIsChecking(false)
    }
  }

  const handleSeedRecipes = async () => {
    setIsSeeding(true)
    setSeedingResult(null)
    
    try {
      const result = await seedSupabaseRecipes()
      setSeedingResult(result)
      
      // Refresh the existing recipes count
      if (result.success) {
        await handleCheckRecipes()
      }
    } catch (error) {
      console.error('Error seeding recipes:', error)
      setSeedingResult({ success: false, error: error.message })
    } finally {
      setIsSeeding(false)
    }
  }

  return (
    <div className="card">
      <h3 className="text-lg font-semibold mb-4">🌱 Recipe Database Seeder</h3>
      <p className="text-gray-600 mb-4">
        Add comprehensive sample recipes with full ingredients and instructions to your database.
      </p>

      <div className="space-y-4">
        {/* Check existing recipes */}
        <div>
          <button
            onClick={handleCheckRecipes}
            disabled={isChecking}
            className="btn-secondary mr-4"
          >
            {isChecking ? 'Checking...' : 'Check Existing Recipes'}
          </button>
          
          {existingRecipes && (
            <div className={`mt-2 p-3 rounded ${
              existingRecipes.success 
                ? 'bg-green-50 text-green-800' 
                : 'bg-red-50 text-red-800'
            }`}>
              {existingRecipes.success ? (
                <p>✅ Found {existingRecipes.count} existing recipes in your database</p>
              ) : (
                <p>❌ Error checking recipes: {existingRecipes.error}</p>
              )}
            </div>
          )}
        </div>

        {/* Seed recipes */}
        <div>
          <button
            onClick={handleSeedRecipes}
            disabled={isSeeding}
            className="btn-primary"
          >
            {isSeeding ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2 inline-block"></div>
                Seeding Recipes...
              </>
            ) : (
              '🌱 Seed Sample Recipes'
            )}
          </button>
        </div>

        {/* Results */}
        {seedingResult && (
          <div className={`p-4 rounded-lg ${
            seedingResult.success 
              ? 'bg-green-50 border border-green-200' 
              : 'bg-red-50 border border-red-200'
          }`}>
            <h4 className="font-semibold mb-2">
              {seedingResult.success ? '✅ Seeding Complete!' : '❌ Seeding Failed'}
            </h4>
            
            {seedingResult.success ? (
              <div>
                <p className="mb-2">
                  Successfully added {seedingResult.successful} out of {seedingResult.total} recipes.
                </p>
                {seedingResult.failed > 0 && (
                  <p className="text-orange-600 mb-2">
                    {seedingResult.failed} recipes failed to insert.
                  </p>
                )}
                
                <details className="mt-2">
                  <summary className="cursor-pointer text-sm font-medium">
                    View detailed results
                  </summary>
                  <div className="mt-2 text-sm">
                    {seedingResult.results.map((result, index) => (
                      <div key={index} className="flex justify-between items-center py-1">
                        <span>{result.recipe}</span>
                        <span className={result.success ? 'text-green-600' : 'text-red-600'}>
                          {result.success ? '✅' : '❌'}
                        </span>
                      </div>
                    ))}
                  </div>
                </details>
              </div>
            ) : (
              <p className="text-red-600">Error: {seedingResult.error}</p>
            )}
          </div>
        )}

        {/* Sample recipes info */}
        <div className="bg-blue-50 p-4 rounded-lg">
          <h4 className="font-semibold text-blue-900 mb-2">Sample Recipes Include:</h4>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Classic Spaghetti Carbonara (Italian)</li>
            <li>• Perfect Grilled Salmon with Lemon Herb Butter (Mediterranean)</li>
            <li>• Authentic Chicken Tikka Masala (Indian)</li>
            <li>• Decadent Chocolate Lava Cake (Dessert)</li>
            <li>• Mediterranean Quinoa Bowl (Healthy Vegetarian)</li>
            <li>• Beef and Broccoli Stir-Fry (Asian)</li>
          </ul>
          <p className="text-xs text-blue-700 mt-2">
            Each recipe includes complete ingredients lists, detailed step-by-step instructions, 
            prep/cook times, serving sizes, and categorized tags.
          </p>
        </div>
      </div>
    </div>
  )
}

export default RecipeSeeder
