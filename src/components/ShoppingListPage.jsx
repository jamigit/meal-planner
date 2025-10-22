import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core'
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { serviceSelector } from '../services/serviceSelector.js'
import { shoppingListService } from '../services/shoppingListService.js'
import { useShoppingList } from '../hooks/useShoppingListRealtime.js'
import { detectCategory, suggestCategories } from '../utils/categoryDetection.js'
import { findDuplicates } from '../utils/duplicateDetection.js'
import { suggestUnitsForItem } from '../utils/unitConversion.js'
import { PageContainer, PageHeader, PageSection } from './layout'
import ShoppingListManager from './ShoppingListManager.jsx'
import DuplicateDetectionModal from './DuplicateDetectionModal.jsx'
import SortableCategorySection from './SortableCategorySection.jsx'
import UnitConversionWidget from './UnitConversionWidget.jsx'
import AISuggestionWidget from './AISuggestionWidget.jsx'
import ViewModeSelector, { VIEW_MODES } from './ViewModeSelector.jsx'
import RoleStructuredView from './RoleStructuredView.jsx'
import GroceryStoreView from './GroceryStoreView.jsx'
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
  'Bakery',
  'Beverages',
  'Other'
]

function ShoppingListPage() {
  const [currentList, setCurrentList] = useState(null)
  const [lists, setLists] = useState([])
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
  const [showListManager, setShowListManager] = useState(false)
  const [showDuplicateModal, setShowDuplicateModal] = useState(false)
  const [pendingItem, setPendingItem] = useState(null)
  const [detectedDuplicates, setDetectedDuplicates] = useState([])
  const [viewMode, setViewMode] = useState(VIEW_MODES.CATEGORY.id)

  // Drag and drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  // Use real-time hook if we have a current list
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
  } = useShoppingList(currentList?.id, {
    enableRealtime: !!currentList?.id
  })

  // Load lists and set current list on mount
  useEffect(() => {
    loadLists()
  }, [])

  const loadLists = async () => {
    try {
      const shoppingListService = await serviceSelector.getShoppingListService()
      const allLists = await shoppingListService.getAllLists()
      setLists(allLists)
      
      // Set current list to the first one, or create one if none exist
      if (allLists.length > 0) {
        setCurrentList(allLists[0])
      } else {
        const newList = await shoppingListService.createList('My Shopping List')
        setLists([newList])
        setCurrentList(newList)
      }
    } catch (error) {
      console.error('Failed to load shopping lists:', error)
      setError('Failed to load shopping lists')
    }
  }

  const handleAddItem = async (e) => {
    e.preventDefault()
    
    if (!newItem.name.trim()) {
      setError('Item name is required')
      return
    }

    if (!currentList) {
      setError('No shopping list selected')
      return
    }

    // Check for duplicates
    const duplicates = findDuplicates(newItem.name, items, 0.7)
    
    if (duplicates.length > 0) {
      // Show duplicate detection modal
      setPendingItem({ ...newItem })
      setDetectedDuplicates(duplicates)
      setShowDuplicateModal(true)
      return
    }

    // No duplicates found, add directly
    await addItemDirectly(newItem)
  }

  const addItemDirectly = async (itemToAdd) => {
    try {
      setIsAdding(true)
      setError(null)
      
      const shoppingListService = await serviceSelector.getShoppingListService()
      await shoppingListService.addItem(currentList.id, {
        name: itemToAdd.name.trim(),
        quantity: itemToAdd.quantity.trim() || null,
        unit: itemToAdd.unit.trim() || null,
        category: itemToAdd.category
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

  const handleMergeItems = async (existingItemId, mergeData) => {
    try {
      const shoppingListService = await serviceSelector.getShoppingListService()
      await shoppingListService.updateItem(existingItemId, mergeData)
      
      setSuccess('Items merged successfully')
      setTimeout(() => setSuccess(null), 3000)
    } catch (error) {
      console.error('Failed to merge items:', error)
      setError('Failed to merge items')
    }
  }

  const handleAddAsNewItem = async () => {
    if (pendingItem) {
      await addItemDirectly(pendingItem)
    }
  }

  const handleDragEnd = async (event) => {
    const { active, over } = event

    if (!active || !over || active.id === over.id) {
      return
    }

    try {
      const shoppingListService = await serviceSelector.getShoppingListService()
      
      // Find the dragged item
      const draggedItem = items.find(item => item.id === active.id)
      if (!draggedItem) return

      // Check if dropping on another item or on a category header
      const targetItem = items.find(item => item.id === over.id)
      
      if (targetItem) {
        // Dropping on another item - determine if it's same category or different
        if (draggedItem.category === targetItem.category) {
          // Same category - reorder within category
          const categoryItems = itemsByCategory[draggedItem.category] || []
          const oldIndex = categoryItems.findIndex(item => item.id === active.id)
          const newIndex = categoryItems.findIndex(item => item.id === over.id)

          if (oldIndex !== -1 && newIndex !== -1) {
            const reorderedItems = arrayMove(categoryItems, oldIndex, newIndex)
            const itemIds = reorderedItems.map(item => item.id)
            
            await shoppingListService.reorderItems(currentList.id, itemIds)
            setSuccess('Items reordered successfully')
            setTimeout(() => setSuccess(null), 3000)
          }
        } else {
          // Different category - move item to new category
          await shoppingListService.moveItemToCategory(active.id, targetItem.category)
          setSuccess(`Item moved to ${targetItem.category}`)
          setTimeout(() => setSuccess(null), 3000)
        }
      } else {
        // Dropping on category header or empty space
        // Check if over.id matches a category name
        const targetCategory = CATEGORIES.find(cat => cat === over.id)
        if (targetCategory && targetCategory !== draggedItem.category) {
          await shoppingListService.moveItemToCategory(active.id, targetCategory)
          setSuccess(`Item moved to ${targetCategory}`)
          setTimeout(() => setSuccess(null), 3000)
        }
      }
    } catch (error) {
      console.error('Failed to reorder items:', error)
      setError('Failed to reorder items')
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

  const handleUpdateItem = async (itemId, updates) => {
    try {
      const shoppingListService = await serviceSelector.getShoppingListService()
      await shoppingListService.updateItem(itemId, updates)
      setSuccess('Item updated successfully')
      setTimeout(() => setSuccess(null), 3000)
    } catch (error) {
      console.error('Failed to update item:', error)
      setError('Failed to update item')
    }
  }

  const handleUnitConversion = (convertedData) => {
    setNewItem(prev => ({
      ...prev,
      quantity: convertedData.quantity,
      unit: convertedData.unit
    }))
    setSuccess('Unit converted successfully')
    setTimeout(() => setSuccess(null), 3000)
  }

  const handleAISuggestions = (suggestions) => {
    setNewItem(prev => ({
      ...prev,
      category: suggestions.category,
      unit: suggestions.units[0] || prev.unit
    }))
    setSuccess('AI suggestions applied successfully')
    setTimeout(() => setSuccess(null), 3000)
  }

  const handleUncheckAll = async () => {
    if (!currentList) return

    try {
      setIsUnchecking(true)
      const shoppingListService = await serviceSelector.getShoppingListService()
      await shoppingListService.bulkUncheckItems(currentList.id)
      setSuccess('All items unchecked')
      setTimeout(() => setSuccess(null), 3000)
    } catch (error) {
      console.error('Failed to uncheck all items:', error)
      setError('Failed to uncheck all items')
    } finally {
      setIsUnchecking(false)
    }
  }

  const handleListChange = (list) => {
    setCurrentList(list)
    setError(null)
    setSuccess(null)
  }

  const handleListCreated = (newList) => {
    setLists(prev => [...prev, newList])
    setCurrentList(newList)
  }

  const handleItemNameChange = (e) => {
    const itemName = e.target.value
    setNewItem(prev => ({ ...prev, name: itemName }))
    
    // Auto-detect category if name is not empty and category is still 'Other'
    if (itemName.trim() && newItem.category === 'Other') {
      const detectedCategory = detectCategory(itemName)
      if (detectedCategory !== 'Other') {
        setNewItem(prev => ({ ...prev, category: detectedCategory }))
      }
    }
    
    // Auto-suggest unit if unit is empty
    if (itemName.trim() && !newItem.unit) {
      const suggestedUnits = suggestUnitsForItem(itemName)
      if (suggestedUnits.length > 0) {
        setNewItem(prev => ({ ...prev, unit: suggestedUnits[0] }))
      }
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
        title={currentList ? currentList.name : "Shopping List"}
        subtitle={currentList ? `${totalItems} items • ${checkedCount} completed` : "Select a list"}
      >
        <div className="flex gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setShowListManager(!showListManager)}
          >
            {showListManager ? 'Hide Lists' : 'Manage Lists'}
          </Button>
        </div>
      </PageHeader>

      {/* List Manager */}
      {showListManager && (
        <PageSection>
          <ShoppingListManager
            currentListId={currentList?.id}
            onListChange={handleListChange}
            onListCreated={handleListCreated}
            onListDeleted={handleListDeleted}
          />
        </PageSection>
      )}

      {/* Add Item Form */}
      {currentList && (
        <PageSection>
          <form onSubmit={handleAddItem} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <Input
                placeholder="Item name"
                value={newItem.name}
                onChange={handleItemNameChange}
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
            
            <div className="space-y-3">
              <div className="flex gap-3">
                <div className="flex-1">
                  <select
                    value={newItem.category}
                    onChange={(e) => setNewItem({ ...newItem, category: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    {CATEGORIES.map(category => (
                      <option key={category} value={category}>{category}</option>
                    ))}
                  </select>
                  {newItem.name.trim() && detectCategory(newItem.name) !== 'Other' && (
                    <p className="text-xs text-blue-600 mt-1">
                      ✓ Auto-detected category
                    </p>
                  )}
                </div>
                
                <Button
                  type="submit"
                  disabled={isAdding || !newItem.name.trim()}
                  className="flex-1"
                >
                  {isAdding ? 'Adding...' : 'Add Item'}
                </Button>
              </div>
              
              {/* Unit Conversion Widget */}
              {newItem.quantity && newItem.unit && (
                <UnitConversionWidget
                  itemName={newItem.name}
                  currentQuantity={newItem.quantity}
                  currentUnit={newItem.unit}
                  onConvert={handleUnitConversion}
                />
              )}
              
              {/* AI Suggestion Widget */}
              <AISuggestionWidget
                itemName={newItem.name}
                onApplySuggestions={handleAISuggestions}
              />
            </div>
          </form>
        </PageSection>
      )}

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
      {currentList && uncheckedItems.length > 0 && (
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
          
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <div className="space-y-4">
              {CATEGORIES.map(category => {
                const categoryItems = uncheckedItems.filter(item => item.category === category)
                return (
                  <SortableCategorySection
                    key={category}
                    category={category}
                    items={categoryItems}
                    onToggleItem={handleToggleItem}
                    onDeleteItem={handleDeleteItem}
                    onUpdateItem={handleUpdateItem}
                  />
                )
              })}
            </div>
          </DndContext>
        </PageSection>
      )}

      {/* Completed Items */}
      {currentList && checkedItems.length > 0 && (
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
      {currentList && totalItems === 0 && (
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

      {/* No List Selected State */}
      {!currentList && lists.length === 0 && (
        <PageSection>
          <div className="text-center py-12">
            <div className="text-gray-400 mb-4">
              <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-2.5 5M7 13l2.5 5m6-5v6a2 2 0 01-2 2H9a2 2 0 01-2-2v-6m8 0V9a2 2 0 00-2-2H9a2 2 0 00-2 2v4.01" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No shopping lists yet</h3>
            <p className="text-gray-600 mb-4">Click "Manage Lists" above to create your first shopping list.</p>
          </div>
        </PageSection>
      )}
      {/* Duplicate Detection Modal */}
      <DuplicateDetectionModal
        isOpen={showDuplicateModal}
        onClose={() => {
          setShowDuplicateModal(false)
          setPendingItem(null)
          setDetectedDuplicates([])
        }}
        newItem={pendingItem}
        duplicates={detectedDuplicates}
        onMerge={handleMergeItems}
        onAddAsNew={handleAddAsNewItem}
      />
    </PageContainer>
  )
}

export default ShoppingListPage

