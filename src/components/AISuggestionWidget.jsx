import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { getAIItemSuggestions } from '../utils/aiCategorization.js'
import Button from './ui/Button'
import Message from './ui/Message'

function AISuggestionWidget({ 
  itemName, 
  onApplySuggestions,
  className = '' 
}) {
  const [isLoading, setIsLoading] = useState(false)
  const [suggestions, setSuggestions] = useState(null)
  const [error, setError] = useState(null)
  const [showSuggestions, setShowSuggestions] = useState(false)

  const handleGetSuggestions = async () => {
    if (!itemName.trim()) {
      setError('Please enter an item name first')
      return
    }

    try {
      setIsLoading(true)
      setError(null)
      
      const aiSuggestions = await getAIItemSuggestions(itemName)
      setSuggestions(aiSuggestions)
      setShowSuggestions(true)
    } catch (error) {
      console.error('Failed to get AI suggestions:', error)
      setError('Failed to get AI suggestions. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleApplySuggestions = () => {
    if (suggestions) {
      onApplySuggestions(suggestions)
      setShowSuggestions(false)
    }
  }

  const handleDismiss = () => {
    setShowSuggestions(false)
    setSuggestions(null)
    setError(null)
  }

  if (!itemName.trim()) {
    return null
  }

  return (
    <div className={`space-y-2 ${className}`}>
      {/* Get Suggestions Button */}
      <Button
        variant="secondary"
        size="sm"
        onClick={handleGetSuggestions}
        disabled={isLoading}
        className="w-full"
      >
        {isLoading ? (
          <div className="flex items-center gap-2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
            <span>Getting AI suggestions...</span>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <span>🤖</span>
            <span>Get AI Suggestions</span>
          </div>
        )}
      </Button>

      {/* Error Message */}
      {error && (
        <Message variant="error" className="text-sm">
          {error}
        </Message>
      )}

      {/* AI Suggestions */}
      <AnimatePresence>
        {showSuggestions && suggestions && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-gradient-to-r from-blue-50 to-purple-50 p-3 rounded-lg border border-blue-200"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-medium text-blue-900">
                  🤖 AI Suggestions
                </h4>
                <button
                  onClick={handleDismiss}
                  className="text-blue-600 hover:text-blue-800 text-sm"
                >
                  ✕
                </button>
              </div>

              {/* Category Suggestion */}
              <div>
                <div className="text-xs font-medium text-blue-700 mb-1">Category:</div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                    {suggestions.category}
                  </span>
                  <span className="text-xs text-blue-600">
                    Confidence: High
                  </span>
                </div>
              </div>

              {/* Unit Suggestions */}
              <div>
                <div className="text-xs font-medium text-blue-700 mb-1">Suggested Units:</div>
                <div className="flex flex-wrap gap-1">
                  {suggestions.units.map((unit, index) => (
                    <span
                      key={index}
                      className="px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded"
                    >
                      {unit}
                    </span>
                  ))}
                </div>
              </div>

              {/* Apply Button */}
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={handleApplySuggestions}
                  className="flex-1"
                >
                  Apply Suggestions
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handleDismiss}
                >
                  Dismiss
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default AISuggestionWidget
