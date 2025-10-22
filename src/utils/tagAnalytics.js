/**
 * @fileoverview Tag analytics utilities for usage statistics and insights
 * 
 * Provides functions to analyze tag usage patterns, find unused tags,
 * suggest similar tags, and generate insights about the tag system.
 */

import { serviceSelector } from '../services/serviceSelector.js'
import { TAG_TAXONOMY } from '../constants/recipeTags.js'

class TagAnalytics {
  constructor() {
    this.recipeService = null
  }

  async getRecipeService() {
    if (!this.recipeService) {
      this.recipeService = await serviceSelector.getRecipeService()
    }
    return this.recipeService
  }

  /**
   * Get usage statistics for all tags
   * @returns {Promise<Object>} Tag usage statistics by category
   */
  async getTagUsageStats() {
    try {
      const recipeService = await this.getRecipeService()
      const recipes = await recipeService.getAll()
      
      const usage = {
        cuisine_tags: {},
        ingredient_tags: {},
        convenience_tags: {},
        dietary_tags: {}
      }

      // Initialize all tags with 0 usage
      Object.entries(TAG_TAXONOMY).forEach(([category, tags]) => {
        tags.forEach(tag => {
          usage[category][tag] = 0
        })
      })

      // Count actual usage
      recipes.forEach(recipe => {
        Object.keys(usage).forEach(category => {
          const tags = recipe[category] || []
          tags.forEach(tag => {
            if (usage[category].hasOwnProperty(tag)) {
              usage[category][tag]++
            }
          })
        })
      })

      return usage
    } catch (error) {
      console.error('Error getting tag usage stats:', error)
      throw error
    }
  }

  /**
   * Get tags with zero usage
   * @returns {Promise<Object>} Unused tags by category
   */
  async getUnusedTags() {
    try {
      const usage = await this.getTagUsageStats()
      const unused = {}

      Object.entries(usage).forEach(([category, tagUsage]) => {
        unused[category] = Object.entries(tagUsage)
          .filter(([_, count]) => count === 0)
          .map(([tag, _]) => tag)
          .sort()
      })

      return unused
    } catch (error) {
      console.error('Error getting unused tags:', error)
      throw error
    }
  }

  /**
   * Get most popular tags
   * @param {number} limit - Number of top tags to return (default: 10)
   * @returns {Promise<Object>} Most popular tags by category
   */
  async getMostPopularTags(limit = 10) {
    try {
      const usage = await this.getTagUsageStats()
      const popular = {}

      Object.entries(usage).forEach(([category, tagUsage]) => {
        popular[category] = Object.entries(tagUsage)
          .sort(([_, a], [__, b]) => b - a)
          .slice(0, limit)
          .map(([tag, count]) => ({ tag, count }))
      })

      return popular
    } catch (error) {
      console.error('Error getting most popular tags:', error)
      throw error
    }
  }

  /**
   * Get category distribution (how many tags per category)
   * @returns {Object} Category distribution
   */
  getCategoryDistribution() {
    const distribution = {}
    
    Object.entries(TAG_TAXONOMY).forEach(([category, tags]) => {
      distribution[category] = tags.length
    })

    return distribution
  }

  /**
   * Find similar tags that might be duplicates
   * @param {number} threshold - Similarity threshold (0-1, default: 0.8)
   * @returns {Object} Similar tag pairs by category
   */
  async findSimilarTags(threshold = 0.8) {
    try {
      const usage = await this.getTagUsageStats()
      const similar = {}

      Object.entries(TAG_TAXONOMY).forEach(([category, tags]) => {
        similar[category] = []
        
        for (let i = 0; i < tags.length; i++) {
          for (let j = i + 1; j < tags.length; j++) {
            const similarity = this.calculateSimilarity(tags[i], tags[j])
            if (similarity >= threshold) {
              similar[category].push({
                tag1: tags[i],
                tag2: tags[j],
                similarity: similarity,
                usage1: usage[category][tags[i]],
                usage2: usage[category][tags[j]]
              })
            }
          }
        }
        
        // Sort by similarity descending
        similar[category].sort((a, b) => b.similarity - a.similarity)
      })

      return similar
    } catch (error) {
      console.error('Error finding similar tags:', error)
      throw error
    }
  }

  /**
   * Calculate string similarity using Levenshtein distance
   * @param {string} str1 - First string
   * @param {string} str2 - Second string
   * @returns {number} Similarity score (0-1)
   */
  calculateSimilarity(str1, str2) {
    const s1 = str1.toLowerCase()
    const s2 = str2.toLowerCase()
    
    if (s1 === s2) return 1
    
    const maxLength = Math.max(s1.length, s2.length)
    if (maxLength === 0) return 1
    
    const distance = this.levenshteinDistance(s1, s2)
    return 1 - (distance / maxLength)
  }

  /**
   * Calculate Levenshtein distance between two strings
   * @param {string} str1 - First string
   * @param {string} str2 - Second string
   * @returns {number} Edit distance
   */
  levenshteinDistance(str1, str2) {
    const matrix = []
    
    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i]
    }
    
    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j
    }
    
    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1]
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          )
        }
      }
    }
    
    return matrix[str2.length][str1.length]
  }

  /**
   * Get tag coverage statistics
   * @returns {Promise<Object>} Coverage statistics
   */
  async getTagCoverageStats() {
    try {
      const recipeService = await this.getRecipeService()
      const recipes = await recipeService.getAll()
      const usage = await this.getTagUsageStats()
      
      const stats = {
        totalRecipes: recipes.length,
        recipesWithTags: 0,
        averageTagsPerRecipe: 0,
        categoryCoverage: {},
        totalTagUsage: 0
      }

      let totalTags = 0
      let recipesWithAnyTags = 0

      recipes.forEach(recipe => {
        let recipeHasTags = false
        Object.keys(TAG_TAXONOMY).forEach(category => {
          const tags = recipe[category] || []
          if (tags.length > 0) {
            recipeHasTags = true
            totalTags += tags.length
          }
        })
        
        if (recipeHasTags) {
          recipesWithAnyTags++
        }
      })

      stats.recipesWithTags = recipesWithAnyTags
      stats.averageTagsPerRecipe = recipes.length > 0 ? totalTags / recipes.length : 0

      // Calculate coverage by category
      Object.entries(usage).forEach(([category, tagUsage]) => {
        const totalPossibleUsage = recipes.length * TAG_TAXONOMY[category].length
        const actualUsage = Object.values(tagUsage).reduce((sum, count) => sum + count, 0)
        
        stats.categoryCoverage[category] = {
          totalTags: TAG_TAXONOMY[category].length,
          totalUsage: actualUsage,
          coverage: totalPossibleUsage > 0 ? actualUsage / totalPossibleUsage : 0,
          averagePerRecipe: recipes.length > 0 ? actualUsage / recipes.length : 0
        }
        
        stats.totalTagUsage += actualUsage
      })

      return stats
    } catch (error) {
      console.error('Error getting tag coverage stats:', error)
      throw error
    }
  }

  /**
   * Get tag usage trends (most/least used)
   * @returns {Promise<Object>} Usage trends
   */
  async getTagUsageTrends() {
    try {
      const usage = await this.getTagUsageStats()
      const trends = {
        mostUsed: {},
        leastUsed: {},
        unused: {},
        underused: {} // Tags used in less than 5% of recipes
      }

      Object.entries(usage).forEach(([category, tagUsage]) => {
        const sortedTags = Object.entries(tagUsage)
          .sort(([_, a], [__, b]) => b - a)
        
        trends.mostUsed[category] = sortedTags.slice(0, 5)
        trends.leastUsed[category] = sortedTags.slice(-5).reverse()
        trends.unused[category] = sortedTags.filter(([_, count]) => count === 0)
      })

      // Calculate threshold for underused tags (5% of total recipes)
      const recipeService = await this.getRecipeService()
      const recipes = await recipeService.getAll()
      const threshold = Math.ceil(recipes.length * 0.05)
      
      // Apply threshold to all categories
      Object.entries(usage).forEach(([category, tagUsage]) => {
        const sortedTags = Object.entries(tagUsage)
          .sort(([_, a], [__, b]) => b - a)
        
        trends.underused[category] = sortedTags.filter(([_, count]) => count > 0 && count < threshold)
      })

      return trends
    } catch (error) {
      console.error('Error getting tag usage trends:', error)
      throw error
    }
  }

  /**
   * Generate tag system insights
   * @returns {Promise<Object>} Comprehensive insights
   */
  async generateInsights() {
    try {
      const [
        usage,
        unused,
        popular,
        similar,
        coverage,
        trends
      ] = await Promise.all([
        this.getTagUsageStats(),
        this.getUnusedTags(),
        this.getMostPopularTags(),
        this.findSimilarTags(),
        this.getTagCoverageStats(),
        this.getTagUsageTrends()
      ])

      const insights = {
        summary: {
          totalTags: Object.values(TAG_TAXONOMY).reduce((sum, tags) => sum + tags.length, 0),
          totalCategories: Object.keys(TAG_TAXONOMY).length,
          totalRecipes: coverage.totalRecipes,
          recipesWithTags: coverage.recipesWithTags,
          averageTagsPerRecipe: coverage.averageTagsPerRecipe
        },
        usage,
        unused,
        popular,
        similar,
        coverage,
        trends,
        recommendations: this.generateRecommendations(unused, similar, trends)
      }

      return insights
    } catch (error) {
      console.error('Error generating insights:', error)
      throw error
    }
  }

  /**
   * Generate recommendations based on analytics
   * @param {Object} unused - Unused tags
   * @param {Object} similar - Similar tags
   * @param {Object} trends - Usage trends
   * @returns {Array} Array of recommendations
   */
  generateRecommendations(unused, similar, trends) {
    const recommendations = []

    // Check for unused tags
    Object.entries(unused).forEach(([category, tags]) => {
      if (tags.length > 0) {
        recommendations.push({
          type: 'cleanup',
          priority: 'medium',
          category,
          message: `${tags.length} unused tags in ${category}: ${tags.join(', ')}`,
          action: 'Consider removing unused tags to simplify the taxonomy'
        })
      }
    })

    // Check for similar tags
    Object.entries(similar).forEach(([category, pairs]) => {
      if (pairs.length > 0) {
        recommendations.push({
          type: 'consolidation',
          priority: 'high',
          category,
          message: `Found ${pairs.length} similar tag pairs in ${category}`,
          action: 'Consider merging similar tags to reduce confusion',
          details: pairs.slice(0, 3) // Show top 3 similar pairs
        })
      }
    })

    // Check for underused tags
    Object.entries(trends.underused).forEach(([category, tags]) => {
      if (tags.length > 0) {
        recommendations.push({
          type: 'usage',
          priority: 'low',
          category,
          message: `${tags.length} underused tags in ${category}`,
          action: 'Consider promoting these tags or removing them'
        })
      }
    })

    return recommendations
  }
}

export const tagAnalytics = new TagAnalytics()
