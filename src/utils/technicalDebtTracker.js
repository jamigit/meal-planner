/**
 * @fileoverview Technical Debt Tracking System
 * 
 * Provides utilities for tracking, managing, and reporting technical debt
 * across the codebase. Integrates with AI annotations and provides
 * actionable insights for debt management.
 * 
 * @ai-context: Central system for managing technical debt annotations
 * @ai-dependencies: Requires regex parsing, file system access, and reporting
 */

/**
 * Technical debt priority levels
 */
export const DEBT_PRIORITY = {
  LOW: 'low',
  MEDIUM: 'medium', 
  HIGH: 'high',
  CRITICAL: 'critical'
}

/**
 * Technical debt effort levels
 */
export const DEBT_EFFORT = {
  LOW: 'low',      // < 1 hour
  MEDIUM: 'medium', // 1-4 hours
  HIGH: 'high',    // 4-8 hours
  EXTREME: 'extreme' // > 8 hours
}

/**
 * Technical debt impact levels
 */
export const DEBT_IMPACT = {
  LOW: 'low',      // Minor inconvenience
  MEDIUM: 'medium', // Noticeable issues
  HIGH: 'high',    // Significant problems
  CRITICAL: 'critical' // Blocks functionality
}

/**
 * Technical debt annotation parser
 */
export class TechnicalDebtParser {
  constructor() {
    this.annotationRegex = /@ai-technical-debt\(([^,]+),\s*([^,]+),\s*([^)]+)\)\s*-\s*(.+)/g
  }

  /**
   * Parse technical debt annotations from file content
   * @param {string} content - File content to parse
   * @param {string} filePath - Path to the file
   * @returns {Array} Array of debt objects
   */
  parseFile(content, filePath) {
    const debts = []
    let match

    while ((match = this.annotationRegex.exec(content)) !== null) {
      const [, priority, effort, impact, description] = match
      
      debts.push({
        id: this.generateDebtId(filePath, match.index),
        filePath,
        lineNumber: this.getLineNumber(content, match.index),
        priority: priority.trim(),
        effort: effort.trim(),
        impact: impact.trim(),
        description: description.trim(),
        createdAt: new Date().toISOString(),
        status: 'open'
      })
    }

    return debts
  }

  /**
   * Generate unique debt ID
   * @param {string} filePath - File path
   * @param {number} position - Character position
   * @returns {string} Unique debt ID
   */
  generateDebtId(filePath, position) {
    const fileName = filePath.split('/').pop().replace(/[^a-zA-Z0-9]/g, '')
    const hash = position.toString(36)
    return `debt-${fileName}-${hash}`
  }

  /**
   * Get line number from character position
   * @param {string} content - File content
   * @param {number} position - Character position
   * @returns {number} Line number
   */
  getLineNumber(content, position) {
    return content.substring(0, position).split('\n').length
  }
}

/**
 * Technical debt tracker
 */
export class TechnicalDebtTracker {
  constructor() {
    this.debts = new Map()
    this.parser = new TechnicalDebtParser()
    this.stats = {
      total: 0,
      byPriority: {},
      byEffort: {},
      byImpact: {},
      byFile: {},
      byStatus: {}
    }
  }

  /**
   * Add debt from file content
   * @param {string} content - File content
   * @param {string} filePath - File path
   */
  addDebtsFromFile(content, filePath) {
    const debts = this.parser.parseFile(content, filePath)
    
    debts.forEach(debt => {
      this.debts.set(debt.id, debt)
      this.updateStats(debt)
    })
  }

  /**
   * Update statistics
   * @param {Object} debt - Debt object
   */
  updateStats(debt) {
    this.stats.total++
    
    // By priority
    this.stats.byPriority[debt.priority] = (this.stats.byPriority[debt.priority] || 0) + 1
    
    // By effort
    this.stats.byEffort[debt.effort] = (this.stats.byEffort[debt.effort] || 0) + 1
    
    // By impact
    this.stats.byImpact[debt.impact] = (this.stats.byImpact[debt.impact] || 0) + 1
    
    // By file
    this.stats.byFile[debt.filePath] = (this.stats.byFile[debt.filePath] || 0) + 1
    
    // By status
    this.stats.byStatus[debt.status] = (this.stats.byStatus[debt.status] || 0) + 1
  }

  /**
   * Get all debts
   * @returns {Array} Array of all debts
   */
  getAllDebts() {
    return Array.from(this.debts.values())
  }

  /**
   * Get debts by priority
   * @param {string} priority - Priority level
   * @returns {Array} Array of debts
   */
  getDebtsByPriority(priority) {
    return this.getAllDebts().filter(debt => debt.priority === priority)
  }

  /**
   * Get debts by file
   * @param {string} filePath - File path
   * @returns {Array} Array of debts
   */
  getDebtsByFile(filePath) {
    return this.getAllDebts().filter(debt => debt.filePath === filePath)
  }

  /**
   * Get high-priority debts
   * @returns {Array} Array of high-priority debts
   */
  getHighPriorityDebts() {
    return this.getAllDebts().filter(debt => 
      debt.priority === DEBT_PRIORITY.HIGH || 
      debt.priority === DEBT_PRIORITY.CRITICAL
    )
  }

  /**
   * Get debt statistics
   * @returns {Object} Statistics object
   */
  getStats() {
    return { ...this.stats }
  }

  /**
   * Generate debt report
   * @returns {string} Formatted report
   */
  generateReport() {
    const stats = this.getStats()
    const highPriorityDebts = this.getHighPriorityDebts()
    
    let report = `# Technical Debt Report\n\n`
    report += `## Summary\n`
    report += `- Total debts: ${stats.total}\n`
    report += `- High priority: ${highPriorityDebts.length}\n\n`
    
    report += `## By Priority\n`
    Object.entries(stats.byPriority).forEach(([priority, count]) => {
      report += `- ${priority}: ${count}\n`
    })
    
    report += `\n## High Priority Debts\n`
    if (highPriorityDebts.length === 0) {
      report += `No high priority debts found. 🎉\n`
    } else {
      highPriorityDebts.forEach(debt => {
        report += `- **${debt.filePath}:${debt.lineNumber}** - ${debt.description}\n`
        report += `  - Priority: ${debt.priority}, Effort: ${debt.effort}, Impact: ${debt.impact}\n`
      })
    }
    
    return report
  }

  /**
   * Export debts to JSON
   * @returns {string} JSON string
   */
  exportToJSON() {
    return JSON.stringify({
      debts: this.getAllDebts(),
      stats: this.getStats(),
      generatedAt: new Date().toISOString()
    }, null, 2)
  }
}

/**
 * Technical debt validator
 */
export class TechnicalDebtValidator {
  constructor() {
    this.validPriorities = Object.values(DEBT_PRIORITY)
    this.validEfforts = Object.values(DEBT_EFFORT)
    this.validImpacts = Object.values(DEBT_IMPACT)
  }

  /**
   * Validate debt annotation
   * @param {string} annotation - Annotation string
   * @returns {Object} Validation result
   */
  validateAnnotation(annotation) {
    const errors = []
    
    // Check format
    if (!annotation.includes('@ai-technical-debt(')) {
      errors.push('Missing @ai-technical-debt annotation')
      return { valid: false, errors }
    }

    // Extract parameters
    const match = annotation.match(/@ai-technical-debt\(([^,]+),\s*([^,]+),\s*([^)]+)\)/)
    if (!match) {
      errors.push('Invalid annotation format')
      return { valid: false, errors }
    }

    const [, priority, effort, impact] = match

    // Validate priority
    if (!this.validPriorities.includes(priority.trim())) {
      errors.push(`Invalid priority: ${priority}. Valid values: ${this.validPriorities.join(', ')}`)
    }

    // Validate effort
    if (!this.validEfforts.includes(effort.trim())) {
      errors.push(`Invalid effort: ${effort}. Valid values: ${this.validEfforts.join(', ')}`)
    }

    // Validate impact
    if (!this.validImpacts.includes(impact.trim())) {
      errors.push(`Invalid impact: ${impact}. Valid values: ${this.validImpacts.join(', ')}`)
    }

    return {
      valid: errors.length === 0,
      errors
    }
  }
}

/**
 * Technical debt utilities
 */
export const TechnicalDebtUtils = {
  /**
   * Calculate debt score (priority * effort * impact)
   * @param {Object} debt - Debt object
   * @returns {number} Debt score
   */
  calculateDebtScore(debt) {
    const priorityScores = {
      [DEBT_PRIORITY.LOW]: 1,
      [DEBT_PRIORITY.MEDIUM]: 2,
      [DEBT_PRIORITY.HIGH]: 3,
      [DEBT_PRIORITY.CRITICAL]: 4
    }

    const effortScores = {
      [DEBT_EFFORT.LOW]: 1,
      [DEBT_EFFORT.MEDIUM]: 2,
      [DEBT_EFFORT.HIGH]: 3,
      [DEBT_EFFORT.EXTREME]: 4
    }

    const impactScores = {
      [DEBT_IMPACT.LOW]: 1,
      [DEBT_IMPACT.MEDIUM]: 2,
      [DEBT_IMPACT.HIGH]: 3,
      [DEBT_IMPACT.CRITICAL]: 4
    }

    return (priorityScores[debt.priority] || 1) * 
           (effortScores[debt.effort] || 1) * 
           (impactScores[debt.impact] || 1)
  },

  /**
   * Get debt recommendations
   * @param {Array} debts - Array of debts
   * @returns {Array} Array of recommendations
   */
  getRecommendations(debts) {
    const recommendations = []
    
    // High priority, low effort debts
    const quickWins = debts.filter(debt => 
      debt.priority === DEBT_PRIORITY.HIGH && 
      debt.effort === DEBT_EFFORT.LOW
    )
    
    if (quickWins.length > 0) {
      recommendations.push({
        type: 'quick-wins',
        title: 'Quick Wins',
        description: `${quickWins.length} high-priority, low-effort debts that should be addressed first`,
        debts: quickWins
      })
    }

    // Critical debts
    const criticalDebts = debts.filter(debt => 
      debt.priority === DEBT_PRIORITY.CRITICAL
    )
    
    if (criticalDebts.length > 0) {
      recommendations.push({
        type: 'critical',
        title: 'Critical Issues',
        description: `${criticalDebts.length} critical debts that need immediate attention`,
        debts: criticalDebts
      })
    }

    return recommendations
  }
}

// Export default tracker instance
export const debtTracker = new TechnicalDebtTracker()
export const debtValidator = new TechnicalDebtValidator()
