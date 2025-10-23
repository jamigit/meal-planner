#!/usr/bin/env node

/**
 * @fileoverview Technical Debt Report Generator
 * 
 * Scans the codebase for technical debt annotations and generates
 * comprehensive reports for debt management.
 * 
 * @ai-context: CLI tool for generating technical debt reports
 * @ai-dependencies: Requires file system access and debt tracking utilities
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { debtTracker, debtValidator, TechnicalDebtUtils } from '../src/utils/technicalDebtTracker.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

/**
 * Recursively scan directory for source files
 * @param {string} dir - Directory to scan
 * @param {Array} extensions - File extensions to include
 * @returns {Array} Array of file paths
 */
function scanDirectory(dir, extensions = ['.js', '.jsx', '.ts', '.tsx']) {
  const files = []
  
  try {
    const entries = fs.readdirSync(dir, { withFileTypes: true })
    
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name)
      
      if (entry.isDirectory() && !entry.name.startsWith('.') && entry.name !== 'node_modules') {
        files.push(...scanDirectory(fullPath, extensions))
      } else if (entry.isFile() && extensions.some(ext => entry.name.endsWith(ext))) {
        files.push(fullPath)
      }
    }
  } catch (error) {
    console.warn(`Warning: Could not scan directory ${dir}:`, error.message)
  }
  
  return files
}

/**
 * Generate debt report
 */
function generateReport() {
  console.log('🔍 Scanning codebase for technical debt...')
  
  // Scan source files
  const srcDir = path.join(__dirname, '..', 'src')
  const files = scanDirectory(srcDir)
  
  console.log(`📁 Found ${files.length} source files`)
  
  // Process each file
  let totalDebts = 0
  let invalidAnnotations = 0
  
  files.forEach(file => {
    try {
      const content = fs.readFileSync(file, 'utf8')
      const relativePath = path.relative(process.cwd(), file)
      
      // Add debts to tracker
      const debts = debtTracker.addDebtsFromFile(content, relativePath)
      totalDebts += debts.length
      
      // Validate annotations
      const lines = content.split('\n')
      lines.forEach((line, index) => {
        if (line.includes('@ai-technical-debt')) {
          const validation = debtValidator.validateAnnotation(line)
          if (!validation.valid) {
            console.error(`❌ Invalid annotation in ${relativePath}:${index + 1}`)
            validation.errors.forEach(error => console.error(`   ${error}`))
            invalidAnnotations++
          }
        }
      })
      
    } catch (error) {
      console.warn(`Warning: Could not process ${file}:`, error.message)
    }
  })
  
  console.log(`📊 Found ${totalDebts} technical debt items`)
  
  if (invalidAnnotations > 0) {
    console.log(`⚠️  Found ${invalidAnnotations} invalid annotations`)
  }
  
  // Generate reports
  const report = debtTracker.generateReport()
  const jsonData = debtTracker.exportToJSON()
  
  // Write reports
  fs.writeFileSync('TECHNICAL_DEBT_REPORT.md', report)
  fs.writeFileSync('technical-debt.json', jsonData)
  
  console.log('📄 Generated TECHNICAL_DEBT_REPORT.md')
  console.log('📄 Generated technical-debt.json')
  
  // Show summary
  const stats = debtTracker.getStats()
  const highPriorityDebts = debtTracker.getHighPriorityDebts()
  const recommendations = TechnicalDebtUtils.getRecommendations(debtTracker.getAllDebts())
  
  console.log('\n📈 Summary:')
  console.log(`   Total debts: ${stats.total}`)
  console.log(`   High priority: ${highPriorityDebts.length}`)
  console.log(`   By priority: ${Object.entries(stats.byPriority).map(([p, c]) => `${p}: ${c}`).join(', ')}`)
  
  if (recommendations.length > 0) {
    console.log('\n🎯 Recommendations:')
    recommendations.forEach(rec => {
      console.log(`   ${rec.title}: ${rec.description}`)
    })
  }
  
  // Show high priority debts
  if (highPriorityDebts.length > 0) {
    console.log('\n🚨 High Priority Debts:')
    highPriorityDebts.forEach(debt => {
      const score = TechnicalDebtUtils.calculateDebtScore(debt)
      console.log(`   ${debt.filePath}:${debt.lineNumber} (score: ${score})`)
      console.log(`     ${debt.description}`)
    })
  } else {
    console.log('\n🎉 No high priority debts found!')
  }
}

/**
 * Validate all debt annotations
 */
function validateAnnotations() {
  console.log('🔍 Validating technical debt annotations...')
  
  const srcDir = path.join(__dirname, '..', 'src')
  const files = scanDirectory(srcDir)
  
  let totalAnnotations = 0
  let invalidAnnotations = 0
  
  files.forEach(file => {
    try {
      const content = fs.readFileSync(file, 'utf8')
      const relativePath = path.relative(process.cwd(), file)
      const lines = content.split('\n')
      
      lines.forEach((line, index) => {
        if (line.includes('@ai-technical-debt')) {
          totalAnnotations++
          const validation = debtValidator.validateAnnotation(line)
          if (!validation.valid) {
            console.error(`❌ ${relativePath}:${index + 1}`)
            validation.errors.forEach(error => console.error(`   ${error}`))
            invalidAnnotations++
          }
        }
      })
      
    } catch (error) {
      console.warn(`Warning: Could not process ${file}:`, error.message)
    }
  })
  
  console.log(`📊 Found ${totalAnnotations} debt annotations`)
  
  if (invalidAnnotations === 0) {
    console.log('✅ All annotations are valid!')
  } else {
    console.log(`❌ Found ${invalidAnnotations} invalid annotations`)
    process.exit(1)
  }
}

/**
 * Show debt statistics
 */
function showStats() {
  const srcDir = path.join(__dirname, '..', 'src')
  const files = scanDirectory(srcDir)
  
  files.forEach(file => {
    const content = fs.readFileSync(file, 'utf8')
    const relativePath = path.relative(process.cwd(), file)
    debtTracker.addDebtsFromFile(content, relativePath)
  })
  
  const stats = debtTracker.getStats()
  const highPriorityDebts = debtTracker.getHighPriorityDebts()
  
  console.log('📊 Technical Debt Statistics:')
  console.log(`   Total debts: ${stats.total}`)
  console.log(`   High priority: ${highPriorityDebts.length}`)
  console.log(`   Critical: ${stats.byPriority.critical || 0}`)
  console.log(`   High: ${stats.byPriority.high || 0}`)
  console.log(`   Medium: ${stats.byPriority.medium || 0}`)
  console.log(`   Low: ${stats.byPriority.low || 0}`)
  
  console.log('\n📁 By File:')
  Object.entries(stats.byFile)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 10)
    .forEach(([file, count]) => {
      console.log(`   ${file}: ${count}`)
    })
}

// CLI interface
const command = process.argv[2]

switch (command) {
  case 'report':
    generateReport()
    break
  case 'validate':
    validateAnnotations()
    break
  case 'stats':
    showStats()
    break
  default:
    console.log('Usage: node scripts/debt-report.js [command]')
    console.log('Commands:')
    console.log('  report   - Generate comprehensive debt report')
    console.log('  validate - Validate all debt annotations')
    console.log('  stats    - Show debt statistics')
    process.exit(1)
}
