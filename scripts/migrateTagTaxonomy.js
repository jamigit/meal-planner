#!/usr/bin/env node

/**
 * @fileoverview Tag taxonomy migration script
 * 
 * Migrates existing recipes from old tag taxonomy (74 tags) to new taxonomy (51 tags).
 * Handles consolidation, renaming, and removal of tags across both IndexedDB and Supabase.
 */

import { readFileSync, writeFileSync } from 'fs'
import { join } from 'path'
import { TAG_MIGRATION_MAP } from '../src/utils/tagMigrationMap.js'
import { TAG_TAXONOMY } from '../src/constants/recipeTags.js'

// Mock database services for Node.js environment
const mockServices = {
  async getAllRecipes() {
    console.log('📊 Loading recipes from database...')
    // In real implementation, this would load from IndexedDB/Supabase
    return []
  },
  
  async updateRecipe(recipe) {
    console.log(`📝 Updating recipe: ${recipe.name}`)
    // In real implementation, this would update the database
    return recipe
  },
  
  async backupRecipes(recipes) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
    const filename = `recipe-backup-${timestamp}.json`
    const filepath = join(process.cwd(), 'backups', filename)
    
    console.log(`💾 Creating backup: ${filepath}`)
    writeFileSync(filepath, JSON.stringify(recipes, null, 2))
    return filepath
  }
}

/**
 * Apply migration mapping to a single recipe
 * @param {Object} recipe - The recipe to migrate
 * @returns {Object} Migrated recipe with updated tags
 */
function migrateRecipeTags(recipe) {
  const migrated = { ...recipe }
  const changes = []
  
  // Migrate each tag category
  Object.entries(TAG_MIGRATION_MAP).forEach(([category, mappings]) => {
    if (!migrated[category]) {
      migrated[category] = []
    }
    
    const originalTags = [...migrated[category]]
    const migratedTags = []
    
    originalTags.forEach(tag => {
      if (tag in mappings) {
        const newTag = mappings[tag]
        if (newTag === null) {
          // Tag should be removed
          changes.push(`Removed ${category}: ${tag}`)
        } else {
          // Tag should be migrated
          if (!migratedTags.includes(newTag)) {
            migratedTags.push(newTag)
            changes.push(`${category}: ${tag} → ${newTag}`)
          }
        }
      } else {
        // Tag doesn't need migration
        migratedTags.push(tag)
      }
    })
    
    migrated[category] = migratedTags
  })
  
  // Handle dietary tags migration (move from convenience_tags to dietary_tags)
  if (migrated.convenience_tags) {
    const dietaryTags = ['Gluten-Free', 'Vegetarian', 'Low-Carb']
    const convenienceTags = migrated.convenience_tags.filter(tag => !dietaryTags.includes(tag))
    const newDietaryTags = migrated.convenience_tags.filter(tag => dietaryTags.includes(tag))
    
    if (newDietaryTags.length > 0) {
      migrated.convenience_tags = convenienceTags
      migrated.dietary_tags = [...(migrated.dietary_tags || []), ...newDietaryTags]
      changes.push(`Moved to dietary_tags: ${newDietaryTags.join(', ')}`)
    }
  }
  
  // Remove duplicates
  Object.keys(TAG_TAXONOMY).forEach(category => {
    if (migrated[category]) {
      migrated[category] = [...new Set(migrated[category])]
    }
  })
  
  return { recipe: migrated, changes }
}

/**
 * Generate migration report
 * @param {Array} results - Array of migration results
 * @returns {Object} Migration report
 */
function generateMigrationReport(results) {
  const report = {
    totalRecipes: results.length,
    recipesWithChanges: results.filter(r => r.changes.length > 0).length,
    totalChanges: results.reduce((sum, r) => sum + r.changes.length, 0),
    changesByType: {},
    tagUsageBefore: {},
    tagUsageAfter: {},
    errors: []
  }
  
  // Count changes by type
  results.forEach(result => {
    result.changes.forEach(change => {
      const type = change.includes('→') ? 'migration' : 
                   change.includes('Removed') ? 'removal' : 'other'
      report.changesByType[type] = (report.changesByType[type] || 0) + 1
    })
  })
  
  return report
}

/**
 * Run migration in dry-run mode
 * @param {Array} recipes - Array of recipes to analyze
 * @returns {Object} Dry-run report
 */
function dryRunMigration(recipes) {
  console.log('🔍 Running dry-run migration...')
  
  const results = recipes.map(recipe => {
    const { recipe: migrated, changes } = migrateRecipeTags(recipe)
    return {
      id: recipe.id,
      name: recipe.name,
      original: recipe,
      migrated,
      changes
    }
  })
  
  const report = generateMigrationReport(results)
  
  console.log('\n📊 DRY-RUN REPORT')
  console.log('================')
  console.log(`Total recipes: ${report.totalRecipes}`)
  console.log(`Recipes with changes: ${report.recipesWithChanges}`)
  console.log(`Total changes: ${report.totalChanges}`)
  console.log('\nChanges by type:')
  Object.entries(report.changesByType).forEach(([type, count]) => {
    console.log(`  ${type}: ${count}`)
  })
  
  // Show sample changes
  console.log('\n📝 Sample changes:')
  results.filter(r => r.changes.length > 0).slice(0, 5).forEach(result => {
    console.log(`\n${result.name}:`)
    result.changes.forEach(change => {
      console.log(`  - ${change}`)
    })
  })
  
  return { results, report }
}

/**
 * Execute actual migration
 * @param {Array} recipes - Array of recipes to migrate
 * @param {boolean} createBackup - Whether to create backup
 * @returns {Object} Migration results
 */
async function executeMigration(recipes, createBackup = true) {
  console.log('🚀 Executing migration...')
  
  // Create backup if requested
  if (createBackup) {
    await mockServices.backupRecipes(recipes)
  }
  
  const results = []
  
  for (const recipe of recipes) {
    try {
      const { recipe: migrated, changes } = migrateRecipeTags(recipe)
      
      if (changes.length > 0) {
        await mockServices.updateRecipe(migrated)
        console.log(`✅ Migrated: ${recipe.name} (${changes.length} changes)`)
      } else {
        console.log(`⏭️  No changes: ${recipe.name}`)
      }
      
      results.push({
        id: recipe.id,
        name: recipe.name,
        changes,
        success: true
      })
    } catch (error) {
      console.error(`❌ Error migrating ${recipe.name}:`, error.message)
      results.push({
        id: recipe.id,
        name: recipe.name,
        changes: [],
        success: false,
        error: error.message
      })
    }
  }
  
  const report = generateMigrationReport(results)
  
  console.log('\n✅ MIGRATION COMPLETE')
  console.log('====================')
  console.log(`Total recipes: ${report.totalRecipes}`)
  console.log(`Successfully migrated: ${results.filter(r => r.success).length}`)
  console.log(`Failed: ${results.filter(r => !r.success).length}`)
  console.log(`Total changes: ${report.totalChanges}`)
  
  return { results, report }
}

/**
 * Main migration function
 * @param {Object} options - Migration options
 */
async function runMigration(options = {}) {
  const {
    dryRun = true,
    createBackup = true,
    sampleSize = null
  } = options
  
  console.log('🏷️  Tag Taxonomy Migration Script')
  console.log('==================================')
  console.log(`Mode: ${dryRun ? 'DRY-RUN' : 'EXECUTE'}`)
  console.log(`Backup: ${createBackup ? 'YES' : 'NO'}`)
  console.log(`Sample size: ${sampleSize || 'ALL'}`)
  console.log('')
  
  try {
    // Load recipes
    const allRecipes = await mockServices.getAllRecipes()
    const recipes = sampleSize ? allRecipes.slice(0, sampleSize) : allRecipes
    
    if (recipes.length === 0) {
      console.log('⚠️  No recipes found to migrate')
      return
    }
    
    console.log(`📊 Found ${recipes.length} recipes to process`)
    
    if (dryRun) {
      const { results, report } = dryRunMigration(recipes)
      
      // Save dry-run results
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
      const filename = `migration-dryrun-${timestamp}.json`
      writeFileSync(filename, JSON.stringify({ results, report }, null, 2))
      console.log(`\n💾 Dry-run results saved to: ${filename}`)
      
      return { results, report }
    } else {
      const { results, report } = await executeMigration(recipes, createBackup)
      
      // Save migration results
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
      const filename = `migration-results-${timestamp}.json`
      writeFileSync(filename, JSON.stringify({ results, report }, null, 2))
      console.log(`\n💾 Migration results saved to: ${filename}`)
      
      return { results, report }
    }
  } catch (error) {
    console.error('❌ Migration failed:', error.message)
    process.exit(1)
  }
}

// CLI interface
if (import.meta.url === `file://${process.argv[1]}`) {
  const args = process.argv.slice(2)
  const options = {
    dryRun: !args.includes('--execute'),
    createBackup: !args.includes('--no-backup'),
    sampleSize: args.includes('--sample') ? 10 : null
  }
  
  runMigration(options)
    .then(() => {
      console.log('\n🎉 Migration script completed')
      process.exit(0)
    })
    .catch(error => {
      console.error('💥 Migration script failed:', error)
      process.exit(1)
    })
}

export { runMigration, migrateRecipeTags, dryRunMigration, executeMigration }
