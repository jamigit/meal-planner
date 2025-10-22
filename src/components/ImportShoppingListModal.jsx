import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { serviceSelector } from '../services/serviceSelector.js'
import Button from './ui/Button'
import Message from './ui/Message'

function ImportShoppingListModal({ 
  isOpen, 
  onClose, 
  generatedList, 
  onImportComplete 
}) {
  const [selectedItems, setSelectedItems] = useState(new Set())
  const [isImporting, setIsImporting] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)

  // Initialize selected items when modal opens
  React.useEffect(() => {
    if (isOpen && generatedList) {
      // Select all items by default
      const allItemIds = new Set()
      Object.values(generatedList).forEach(items => {
        items.forEach(item => {
          allItemIds.add(`${item.item}_${item.category}`)
        })
      })
      setSelectedItems(allItemIds)
    }
  }, [isOpen, generatedList])

  const handleItemToggle = (itemKey) => {
    setSelectedItems(prev => {
      const newSet = new Set(prev)
      if (newSet.has(itemKey)) {
        newSet.delete(itemKey)
      } else {
        newSet.add(itemKey)
      }
      return newSet
    })
  }

  const handleSelectAll = () => {
    if (!generatedList) return
    
    const allItemIds = new Set()
    Object.values(generatedList).forEach(items => {
      items.forEach(item => {
        allItemIds.add(`${item.item}_${item.category}`)
      })
    })
    setSelectedItems(allItemIds)
  }

  const handleSelectNone = () => {
    setSelectedItems(new Set())
  }

  const handleImport = async () => {
    if (!generatedList || selectedItems.size === 0) {
      setError('Please select at least one item to import')
      return
    }

    try {
      setIsImporting(true)
      setError(null)

      // Get shopping list service
      const shoppingListService = await serviceSelector.getShoppingListService()
      
      // Get or create shopping list
      const shoppingList = await shoppingListService.getShoppingList()
      
      // Convert selected items to shopping list items
      const itemsToImport = []
      Object.entries(generatedList).forEach(([category, items]) => {
        items.forEach(item => {
          const itemKey = `${item.item}_${item.category}`
          if (selectedItems.has(itemKey)) {
            itemsToImport.push({
              name: item.item,
              quantity: item.totalQuantity || null,
              unit: item.unit || null,
              category: category,
              notes: item.sources?.length > 1 ? 
                `From ${item.sources.length} recipes` : 
                null
            })
          }
        })
      })

      // Bulk add items
      await shoppingListService.bulkAddItems(shoppingList.id, itemsToImport)

      setSuccess(`Successfully imported ${itemsToImport.length} items`)
      setTimeout(() => {
        setSuccess(null)
        onImportComplete?.(itemsToImport.length)
        onClose()
      }, 2000)

    } catch (error) {
      console.error('Failed to import items:', error)
      setError('Failed to import items. Please try again.')
    } finally {
      setIsImporting(false)
    }
  }

  const getTotalSelectedItems = () => {
    if (!generatedList) return 0
    
    let count = 0
    Object.values(generatedList).forEach(items => {
      items.forEach(item => {
        const itemKey = `${item.item}_${item.category}`
        if (selectedItems.has(itemKey)) {
          count++
        }
      })
    })
    return count
  }

  const getTotalItems = () => {
    if (!generatedList) return 0
    return Object.values(generatedList).reduce((total, items) => total + items.length, 0)
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
              Import to Shopping List
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
            Select items from your meal plan to add to your persistent shopping list.
          </p>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {/* Selection Controls */}
          <div className="flex items-center justify-between mb-4">
            <div className="text-sm text-gray-600">
              {getTotalSelectedItems()} of {getTotalItems()} items selected
            </div>
            <div className="flex gap-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={handleSelectAll}
              >
                Select All
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={handleSelectNone}
              >
                Select None
              </Button>
            </div>
          </div>

          {/* Items List */}
          {generatedList && Object.keys(generatedList).length > 0 ? (
            <div className="space-y-4">
              {Object.entries(generatedList).map(([category, items]) => (
                <div key={category} className="border border-gray-200 rounded-lg">
                  <div className="bg-gray-50 px-4 py-2 border-b border-gray-200">
                    <h3 className="font-medium text-gray-900">{category}</h3>
                  </div>
                  <div className="p-4 space-y-2">
                    {items.map((item, index) => {
                      const itemKey = `${item.item}_${item.category}`
                      const isSelected = selectedItems.has(itemKey)
                      
                      return (
                        <label
                          key={itemKey}
                          className="flex items-center gap-3 p-2 rounded hover:bg-gray-50 cursor-pointer"
                        >
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => handleItemToggle(itemKey)}
                            className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-gray-900">
                              {item.item}
                            </div>
                            {item.totalQuantity && (
                              <div className="text-sm text-gray-600">
                                {item.totalQuantity} {item.unit}
                              </div>
                            )}
                            {item.sources && item.sources.length > 1 && (
                              <div className="text-xs text-gray-500">
                                From {item.sources.length} recipes
                              </div>
                            )}
                          </div>
                        </label>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              No items available to import
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 bg-gray-50">
          {error && (
            <Message variant="error" className="mb-4">
              {error}
            </Message>
          )}
          
          {success && (
            <Message variant="success" className="mb-4">
              {success}
            </Message>
          )}

          <div className="flex justify-end gap-3">
            <Button
              variant="secondary"
              onClick={onClose}
              disabled={isImporting}
            >
              Cancel
            </Button>
            <Button
              onClick={handleImport}
              disabled={isImporting || selectedItems.size === 0}
            >
              {isImporting ? 'Importing...' : `Import ${getTotalSelectedItems()} Items`}
            </Button>
          </div>
        </div>
      </motion.div>
    </div>
  )
}

export default ImportShoppingListModal

