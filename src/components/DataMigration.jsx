import { useState, useEffect } from 'react'
import { databaseMigrationService } from '../services/databaseMigrationService.js'
import { isSupabaseConfigured } from '../lib/supabase.js'

function DataMigration() {
  const [migrationStatus, setMigrationStatus] = useState(null)
  const [isMigrating, setIsMigrating] = useState(false)
  const [migrationResult, setMigrationResult] = useState(null)
  const supabaseConfigured = isSupabaseConfigured()

  useEffect(() => {
    if (supabaseConfigured) {
      checkMigrationStatus()
    }
  }, [supabaseConfigured])

  const checkMigrationStatus = async () => {
    const status = await databaseMigrationService.checkMigrationStatus()
    setMigrationStatus(status)
  }

  const handleMigrate = async () => {
    setIsMigrating(true)
    setMigrationResult(null)

    try {
      const result = await databaseMigrationService.migrateAllData()
      setMigrationResult(result)
      
      if (result.success) {
        // Refresh migration status
        await checkMigrationStatus()
      }
    } catch (error) {
      setMigrationResult({ success: false, error: error.message })
    } finally {
      setIsMigrating(false)
    }
  }

  const handleClearLocal = async () => {
    if (confirm('Are you sure you want to clear all local data? This cannot be undone.')) {
      const result = await databaseMigrationService.clearLocalData()
      if (result.success) {
        await checkMigrationStatus()
        alert('Local data cleared successfully!')
      } else {
        alert('Failed to clear local data: ' + result.error)
      }
    }
  }

  // Don't render if Supabase is not configured
  if (!supabaseConfigured) {
    return null
  }

  if (!migrationStatus) {
    return (
      <div className="card">
        <div className="text-center py-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p>Checking migration status...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="card">
      <h3 className="text-lg font-semibold mb-4">Data Migration</h3>
      
      <div className="space-y-4">
        {/* Migration Status */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <h4 className="font-medium mb-2">Current Status</h4>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-gray-600">Local Data:</p>
              <p>Recipes: {migrationStatus.local.recipes}</p>
              <p>Plans: {migrationStatus.local.plans}</p>
              <p>History: {migrationStatus.local.history}</p>
            </div>
            <div>
              <p className="text-gray-600">Cloud Data:</p>
              <p>Recipes: {migrationStatus.cloud.recipes}</p>
              <p>Plans: {migrationStatus.cloud.plans}</p>
              <p>History: {migrationStatus.cloud.history}</p>
            </div>
          </div>
        </div>

        {/* Migration Actions */}
        {migrationStatus.needsMigration && (
          <div className="space-y-3">
            <p className="text-sm text-gray-600">
              You have local data that hasn't been migrated to the cloud yet.
            </p>
            <button
              onClick={handleMigrate}
              disabled={isMigrating}
              className="btn-primary w-full"
            >
              {isMigrating ? 'Migrating...' : 'Migrate to Cloud'}
            </button>
          </div>
        )}

        {/* Migration Result */}
        {migrationResult && (
          <div className={`p-3 rounded-lg ${
            migrationResult.success 
              ? 'bg-green-50 text-green-800' 
              : 'bg-red-50 text-red-800'
          }`}>
            {migrationResult.success ? (
              <p>✅ {migrationResult.message}</p>
            ) : (
              <p>❌ Migration failed: {migrationResult.error}</p>
            )}
          </div>
        )}

        {/* Clear Local Data */}
        {migrationStatus.local.recipes > 0 && migrationStatus.cloud.recipes > 0 && (
          <div className="border-t pt-4">
            <p className="text-sm text-gray-600 mb-2">
              You have data in both local storage and cloud. You can clear local data after confirming migration.
            </p>
            <button
              onClick={handleClearLocal}
              className="btn-secondary w-full"
            >
              Clear Local Data
            </button>
          </div>
        )}

        {/* Refresh Button */}
        <button
          onClick={checkMigrationStatus}
          className="btn-secondary w-full"
        >
          Refresh Status
        </button>
      </div>
    </div>
  )
}

export default DataMigration
