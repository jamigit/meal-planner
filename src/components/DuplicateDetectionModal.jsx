import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { suggestMerge } from '../utils/duplicateDetection.js'
import Button from './ui/Button'
import Message from './ui/Message'

function DuplicateDetectionModal({
  isOpen,
  onClose,
  newItem,
  duplicates,
  onMerge,
  onAddAsNew
}) {
  const [selectedDuplicate, setSelectedDuplicate] = useState(null)
  const [mergeSuggestion, setMergeSuggestion] = useState(null)
  const [isProcessing, setIsProcessing] = useState(false)

  React.useEffect(() => {
    if (isOpen && duplicates.length > 0) {
      // Auto-select the first (most similar) duplicate
      setSelectedDuplicate(duplicates[0])
      const suggestion = suggestMerge(
        newItem.name,
        newItem.quantity,
        newItem.unit,
        duplicates[0].item
      )
      setMergeSuggestion(suggestion)
    }
  }, [isOpen, duplicates, newItem])

  const handleMerge = async () => {
    if (!selectedDuplicate || !mergeSuggestion) return

    try {
      setIsProcessing(true)
      await onMerge(selectedDuplicate.item.id, mergeSuggestion)
      onClose()
    } catch (error) {
      console.error('Failed to merge items:', error)
    } finally {
      setIsProcessing(false)
    }
  }

  const handleAddAsNew = async () => {
    try {
      setIsProcessing(true)
      await onAddAsNew()
      onClose()
    } catch (error) {
      console.error('Failed to add as new item:', error)
    } finally {
      setIsProcessing(false)
    }
  }

  const handleDuplicateSelect = (duplicate) => {
    setSelectedDuplicate(duplicate)
    const suggestion = suggestMerge(
      newItem.name,
      newItem.quantity,
      newItem.unit,
      duplicate.item
    )
    setMergeSuggestion(suggestion)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden"
      >
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900">
              Duplicate Item Detected
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <p className="text-sm text-gray-600 mt-2">
            We found similar items in your list. Would you like to merge them or add as a new item?
          </p>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {/* New Item */}
          <div className="mb-6">
            <h3 className="text-sm font-medium text-gray-700 mb-2">New Item</h3>
            <div className="bg-blue-50 p-3 rounded-lg">
              <div className="font-medium text-blue-900">{newItem.name}</div>
              {newItem.quantity && (
                <div className="text-sm text-blue-700">
                  {newItem.quantity} {newItem.unit}
                </div>
              )}
            </div>
          </div>

          {/* Potential Duplicates */}
          <div className="mb-6">
            <h3 className="text-sm font-medium text-gray-700 mb-3">
              Similar Items ({duplicates.length})
            </h3>
            <div className="space-y-2">
              {duplicates.map((duplicate, index) => (
                <label
                  key={duplicate.item.id}
                  className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                    selectedDuplicate?.item.id === duplicate.item.id
                      ? 'bg-blue-50 border-blue-200'
                      : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                  }`}
                >
                  <input
                    type="radio"
                    name="duplicate"
                    checked={selectedDuplicate?.item.id === duplicate.item.id}
                    onChange={() => handleDuplicateSelect(duplicate)}
                    className="w-4 h-4 text-blue-600"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-gray-900">
                      {duplicate.item.name}
                    </div>
                    {duplicate.item.quantity && (
                      <div className="text-sm text-gray-600">
                        {duplicate.item.quantity} {duplicate.item.unit}
                      </div>
                    )}
                    <div className="text-xs text-gray-500">
                      {Math.round(duplicate.similarity * 100)}% similar
                    </div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Merge Preview */}
          {mergeSuggestion && (
            <div className="mb-6">
              <h3 className="text-sm font-medium text-gray-700 mb-2">Merge Preview</h3>
              <div className="bg-green-50 p-3 rounded-lg">
                <div className="font-medium text-green-900">{mergeSuggestion.name}</div>
                {mergeSuggestion.quantity && (
                  <div className="text-sm text-green-700">
                    {mergeSuggestion.quantity} {mergeSuggestion.unit}
                  </div>
                )}
                <div className="text-xs text-green-600 mt-1">
                  ✓ Quantities combined
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 bg-gray-50">
          <div className="flex justify-between gap-3">
            <Button
              variant="secondary"
              onClick={handleAddAsNew}
              disabled={isProcessing}
            >
              Add as New Item
            </Button>
            
            <div className="flex gap-3">
              <Button
                variant="secondary"
                onClick={onClose}
                disabled={isProcessing}
              >
                Cancel
              </Button>
              <Button
                onClick={handleMerge}
                disabled={isProcessing || !selectedDuplicate}
              >
                {isProcessing ? 'Merging...' : 'Merge Items'}
              </Button>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  )
}

export default DuplicateDetectionModal
