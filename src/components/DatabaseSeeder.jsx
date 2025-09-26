import { useState } from 'react'
import { seedDatabase, clearAllRecipes, reseedDatabase } from '../utils/seedDatabase.js'
import { seedSupabaseRecipes, checkExistingRecipes } from '../utils/seedSupabaseRecipes.js'
import { isSupabaseConfigured } from '../lib/supabase.js'

function DatabaseSeeder() {
  const [isSeeding, setIsSeeding] = useState(false)
  const [isClearing, setIsClearing] = useState(false)
  const [isReseeding, setIsReseeding] = useState(false)
  const [isCheckingSupabase, setIsCheckingSupabase] = useState(false)
  const [isSeedingSupabase, setIsSeedingSupabase] = useState(false)
  
  const [seedingResult, setSeedingResult] = useState(null)
  const [clearingResult, setClearingResult] = useState(null)
  const [reseedingResult, setReseedingResult] = useState(null)
  const [supabaseResult, setSupabaseResult] = useState(null)
  const [existingRecipes, setExistingRecipes] = useState(null)

  const supabaseConfigured = isSupabaseConfigured()

  // IndexedDB Functions
  const handleSeedDatabase = async () => {
    setIsSeeding(true)
    setSeedingResult(null)
    
    try {
      const result = await seedDatabase()
      setSeedingResult(result)
    } catch (error) {
      setSeedingResult({ success: false, error: error.message })
    } finally {
      setIsSeeding(false)
    }
  }

  const handleClearDatabase = async () => {
    if (!confirm('Are you sure you want to delete all recipes? This cannot be undone.')) {
      return
    }

    setIsClearing(true)
    setClearingResult(null)
    
    try {
      const result = await clearAllRecipes()
      setClearingResult(result)
    } catch (error) {
      setClearingResult({ success: false, error: error.message })
    } finally {
      setIsClearing(false)
    }
  }

  const handleReseedDatabase = async () => {
    if (!confirm('Are you sure you want to clear all recipes and reseed? This cannot be undone.')) {
      return
    }

    setIsReseeding(true)
    setReseedingResult(null)
    
    try {
      const result = await reseedDatabase()
      setReseedingResult(result)
    } catch (error) {
      setReseedingResult({ success: false, error: error.message })
    } finally {
      setIsReseeding(false)
    }
  }

  // Supabase Functions
  const handleCheckSupabaseRecipes = async () => {
    setIsCheckingSupabase(true)
    setSupabaseResult(null)
    
    try {
      const result = await checkExistingRecipes()
      setExistingRecipes(result)
    } catch (error) {
      setExistingRecipes({ success: false, error: error.message })
    } finally {
      setIsCheckingSupabase(false)
    }
  }

  const handleSeedSupabaseRecipes = async () => {
    setIsSeedingSupabase(true)
    setSupabaseResult(null)
    
    try {
      const result = await seedSupabaseRecipes()
      setSupabaseResult(result)
      
      // Refresh the existing recipes count
      if (result.success) {
        await handleCheckSupabaseRecipes()
      }
    } catch (error) {
      setSupabaseResult({ success: false, error: error.message })
    } finally {
      setIsSeedingSupabase(false)
    }
  }

  const ResultDisplay = ({ result, title }) => {
    if (!result) return null

    return (
      <div className={`mt-4 p-4 rounded-lg ${result.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
        <h4 className={`font-medium ${result.success ? 'text-green-800' : 'text-red-800'}`}>
          {title}
        </h4>
        <p className={`text-sm mt-1 ${result.success ? 'text-green-700' : 'text-red-700'}`}>
          {result.success ? result.message : result.error}
        </p>
        {result.addedCount && (
          <p className="text-sm text-green-600 mt-1">Added {result.addedCount} recipes</p>
        )}
        {result.deletedCount && (
          <p className="text-sm text-green-600 mt-1">Deleted {result.deletedCount} recipes</p>
        )}
        {result.existingCount && (
          <p className="text-sm text-green-600 mt-1">Found {result.existingCount} existing recipes</p>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="mb-6">
        <h2 className="font-heading text-display-2 uppercase text-black">Database Seeder</h2>
        <p className="text-gray-600 mt-2">
          Manage your recipe database with sample data for testing and development.
        </p>
      </div>

      {/* IndexedDB Section */}
      <div className="card">
        <h3 className="text-lg font-semibold mb-4">📦 IndexedDB (Local Storage)</h3>
        <p className="text-gray-600 mb-4">
          Manage sample recipes in your local browser database.
        </p>

        <div className="space-y-4">
          <div className="flex flex-wrap gap-3">
            <button
              onClick={handleSeedDatabase}
              disabled={isSeeding}
              className="btn-secondary"
            >
              {isSeeding ? 'Seeding...' : '🌱 Seed Sample Recipes'}
            </button>

            <button
              onClick={handleClearDatabase}
              disabled={isClearing}
              className="btn-danger-outline-sm"
            >
              {isClearing ? 'Clearing...' : '🗑️ Clear All Recipes'}
            </button>

            <button
              onClick={handleReseedDatabase}
              disabled={isReseeding}
              className="btn-outline-black"
            >
              {isReseeding ? 'Reseeding...' : '🔄 Clear & Reseed'}
            </button>
          </div>

          <ResultDisplay result={seedingResult} title="Seeding Result" />
          <ResultDisplay result={clearingResult} title="Clearing Result" />
          <ResultDisplay result={reseedingResult} title="Reseeding Result" />
        </div>
      </div>

      {/* Supabase Section */}
      {supabaseConfigured && (
        <div className="card">
          <h3 className="text-lg font-semibold mb-4">☁️ Supabase (Cloud Database)</h3>
          <p className="text-gray-600 mb-4">
            Manage sample recipes in your cloud database.
          </p>

          <div className="space-y-4">
            <div className="flex flex-wrap gap-3">
              <button
                onClick={handleCheckSupabaseRecipes}
                disabled={isCheckingSupabase}
                className="btn-outline-black"
              >
                {isCheckingSupabase ? 'Checking...' : '🔍 Check Existing Recipes'}
              </button>

              <button
                onClick={handleSeedSupabaseRecipes}
                disabled={isSeedingSupabase}
                className="btn-secondary"
              >
                {isSeedingSupabase ? 'Seeding...' : '🌱 Seed Supabase Recipes'}
              </button>
            </div>

            {existingRecipes && (
              <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <h4 className="font-medium text-blue-800">Existing Recipes Check</h4>
                {existingRecipes.success ? (
                  <p className="text-sm text-blue-700 mt-1">
                    Found {existingRecipes.count} recipes in Supabase
                  </p>
                ) : (
                  <p className="text-sm text-red-700 mt-1">{existingRecipes.error}</p>
                )}
              </div>
            )}

            <ResultDisplay result={supabaseResult} title="Supabase Seeding Result" />
          </div>
        </div>
      )}

      {/* Information Section */}
      <div className="card bg-blue-50">
        <h3 className="text-lg font-semibold mb-4 text-blue-800">ℹ️ Information</h3>
        <div className="space-y-2 text-sm text-blue-700">
          <p>• <strong>Seed Sample Recipes:</strong> Adds sample recipes if the database is empty</p>
          <p>• <strong>Clear All Recipes:</strong> Removes all recipes from the database</p>
          <p>• <strong>Clear & Reseed:</strong> Removes all recipes and adds fresh sample data</p>
          {supabaseConfigured && (
            <>
              <p>• <strong>Check Existing Recipes:</strong> Shows how many recipes are in Supabase</p>
              <p>• <strong>Seed Supabase Recipes:</strong> Adds sample recipes to your cloud database</p>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default DatabaseSeeder
