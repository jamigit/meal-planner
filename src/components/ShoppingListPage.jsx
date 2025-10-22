import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { serviceSelector } from '../services/serviceSelector.js'
import { shoppingListService } from '../services/shoppingListService.js'
import { useShoppingList } from '../hooks/useShoppingListRealtime.js'
import { PageContainer, PageHeader, PageSection } from './layout'
import Button from './ui/Button'
import Input from './ui/Input'
import Message from './ui/Message'

// Category options from existing shopping list service
const CATEGORIES = [
  'Produce',
  'Meat & Seafood', 
  'Dairy & Eggs',
  'Pantry & Dry Goods',
  'Canned & Jarred',
  'Frozen',
  'Other'
]

function ShoppingListPage() {
  const [shoppingList, setShoppingList] = useState(null)
  const [newItem, setNewItem] = useState({
    name: '',
    quantity: '',
    unit: '',
    category: 'Other'
  })
  const [isAdding, setIsAdding] = useState(false)
  const [isUnchecking, setIsUnchecking] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)

  // Use real-time hook if we have a shopping list
  const {
    items,
    itemsByCategory,
    uncheckedItems,
    checkedItems,
    isLoading,
    isConnected,
    totalItems,
    checkedCount,
    uncheckedCount
  } = useShoppingList(shoppingList?.id, {
    enableRealtime: !!shoppingList?.id
  })

  // Load or create shopping list on mount
  useEffect(() => {
    loadShoppingList()
  }, [])

  const loadShoppingList = async () => {
    try {
      const shoppingListService = await serviceSelector.getShoppingListService()
      const list = await shoppingListService.getShoppingList()
      setShoppingList(list)
    } catch (error) {
      console.error('Failed to load shopping list:', error)
      setError('Failed to load shopping list')
    }
  }

  const handleAddItem = async (e) => {
    e.preventDefault()
    
    if (!newItem.name.trim()) {
      setError('Item name is required')
      return
    }

    if (!shoppingList) {
      setError('Shopping list not loaded')
      return
    }

    try {
      setIsAdding(true)
      setError(null)
      
      const shoppingListService = await serviceSelector.getShoppingListService()
      await shoppingListService.addItem(shoppingList.id, {
        name: newItem.name.trim(),
        quantity: newItem.quantity.trim() || null,
        unit: newItem.unit.trim() || null,
        category: newItem.category
      })

      setNewItem({ name: '', quantity: '', unit: '', category: 'Other' })
      setSuccess('Item added successfully')
      setTimeout(() => setSuccess(null), 3000)
    } catch (error) {
      console.error('Failed to add item:', error)
      setError('Failed to add item')
    } finally {
      setIsAdding(false)
    }
  }

  const handleToggleItem = async (itemId, checked) => {
    try {
      const shoppingListService = await serviceSelector.getShoppingListService()
      await shoppingListService.toggleItemChecked(itemId, checked)
    } catch (error) {
      console.error('Failed to toggle item:', error)
      setError('Failed to update item')
    }
  }

  const handleDeleteItem = async (itemId) => {
    if (!window.confirm('Are you sure you want to delete this item?')) {
      return
    }

    try {
      const shoppingListService = await serviceSelector.getShoppingListService()
      await shoppingListService.deleteItem(itemId)
      setSuccess('Item deleted successfully')
      setTimeout(() => setSuccess(null), 3000)
    } catch (error) {
      console.error('Failed to delete item:', error)
      setError('Failed to delete item')
    }
  }

  const handleUncheckAll = async () => {
    if (!shoppingList) return

    try {
      setIsUnchecking(true)
      const shoppingListService = await serviceSelector.getShoppingListService()
      await shoppingListService.bulkUncheckItems(shoppingList.id)
      setSuccess('All items unchecked')
      setTimeout(() => setSuccess(null), 3000)
    } catch (error) {
      console.error('Failed to uncheck all items:', error)
      setError('Failed to uncheck all items')
    } finally {
      setIsUnchecking(false)
    }
  }

  const renderItem = (item) => (
    <motion.div
      key={item.id}
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className={`flex items-center gap-3 p-3 rounded-lg border transition-all ${
        item.checked 
          ? 'bg-gray-50 border-gray-200' 
          : 'bg-white border-gray-200 hover:shadow-sm'
      }`}
    >
      <input
        type="checkbox"
        checked={item.checked}
        onChange={(e) => handleToggleItem(item.id, e.target.checked)}
        className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
      />
      
      <div className="flex-1 min-w-0">
        <div className={`flex items-center gap-2 ${item.checked ? 'line-through text-gray-500' : 'text-gray-900'}`}>
          <span className="font-medium">{item.name}</span>
          {item.quantity && (
            <span className="text-sm text-gray-600">
              {item.quantity} {item.unit}
            </span>
          )}
        </div>
        {item.notes && (
          <p className="text-sm text-gray-500 mt-1">{item.notes}</p>
        )}
      </div>

      <div className="flex items-center gap-2">
        <span className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded">
          {item.category}
        </span>
        <button
          onClick={() => handleDeleteItem(item.id)}
          className="text-red-500 hover:text-red-700 text-sm"
        >
          Delete
        </button>
      </div>
    </motion.div>
  )

  const renderCategorySection = (category, items) => {
    if (!items || items.length === 0) return null

    return (
      <div key={category} className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
          {category}
          <span className="text-sm font-normal text-gray-500">({items.length})</span>
        </h3>
        <div className="space-y-2">
          <AnimatePresence>
            {items.map(renderItem)}
          </AnimatePresence>
        </div>
      </div>
    )
  }

  if (isLoading) {
    return (
      <PageContainer>
        <PageHeader title="Shopping List" />
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading shopping list...</p>
          </div>
        </div>
      </PageContainer>
    )
  }

  return (
    <PageContainer>
      <PageHeader 
        title="Shopping List"
        subtitle={`${totalItems} items • ${checkedCount} completed`}
      />

      {/* Add Item Form */}
      <PageSection>
        <form onSubmit={handleAddItem} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <Input
              placeholder="Item name"
              value={newItem.name}
              onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
              className="md:col-span-2"
              required
            />
            <Input
              placeholder="Quantity"
              value={newItem.quantity}
              onChange={(e) => setNewItem({ ...newItem, quantity: e.target.value })}
            />
            <Input
              placeholder="Unit"
              value={newItem.unit}
              onChange={(e) => setNewItem({ ...newItem, unit: e.target.value })}
            />
          </div>
          
          <div className="flex gap-3">
            <select
              value={newItem.category}
              onChange={(e) => setNewItem({ ...newItem, category: e.target.value })}
              className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              {CATEGORIES.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
            
            <Button
              type="submit"
              disabled={isAdding || !newItem.name.trim()}
              className="flex-1"
            >
              {isAdding ? 'Adding...' : 'Add Item'}
            </Button>
          </div>
        </form>
      </PageSection>

      {/* Status Messages */}
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

      {/* Connection Status */}
      {isConnected && (
        <Message variant="info" className="mb-4">
          Real-time sync active
        </Message>
      )}

      {/* Active Items */}
      {uncheckedItems.length > 0 && (
        <PageSection>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">
              Active Items ({uncheckedCount})
            </h2>
            {checkedCount > 0 && (
              <Button
                variant="secondary"
                size="sm"
                onClick={handleUncheckAll}
                disabled={isUnchecking}
              >
                {isUnchecking ? 'Unchecking...' : 'Uncheck All'}
              </Button>
            )}
          </div>
          
          <div className="space-y-4">
            {CATEGORIES.map(category => {
              const categoryItems = uncheckedItems.filter(item => item.category === category)
              return renderCategorySection(category, categoryItems)
            })}
          </div>
        </PageSection>
      )}

      {/* Completed Items */}
      {checkedItems.length > 0 && (
        <PageSection>
          <details className="group">
            <summary className="flex items-center justify-between cursor-pointer p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
              <h2 className="text-lg font-semibold text-gray-700">
                Completed Items ({checkedCount})
              </h2>
              <svg 
                className="w-5 h-5 text-gray-500 group-open:rotate-180 transition-transform" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </summary>
            
            <div className="mt-4 space-y-2">
              <AnimatePresence>
                {checkedItems.map(renderItem)}
              </AnimatePresence>
            </div>
          </details>
        </PageSection>
      )}

      {/* Empty State */}
      {totalItems === 0 && (
        <PageSection>
          <div className="text-center py-12">
            <div className="text-gray-400 mb-4">
              <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-2.5 5M7 13l2.5 5m6-5v6a2 2 0 01-2 2H9a2 2 0 01-2-2v-6m8 0V9a2 2 0 00-2-2H9a2 2 0 00-2 2v4.01" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Your shopping list is empty</h3>
            <p className="text-gray-600 mb-4">Add items above to get started with your shopping list.</p>
          </div>
        </PageSection>
      )}
    </PageContainer>
  )
}

export default ShoppingListPage

