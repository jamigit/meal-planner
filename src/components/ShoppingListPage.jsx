import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragOverlay } from '@dnd-kit/core'
import { GripVertical } from 'lucide-react'
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { serviceSelector } from '../services/serviceSelector.js'
import { shoppingListService } from '../services/shoppingListService.js'
import { useShoppingList } from '../hooks/useShoppingListRealtime.js'
import { authService } from '../services/authService.js'
import { isSupabaseConfigured } from '../lib/supabase.js'
import { detectCategory, suggestCategories } from '../utils/categoryDetection.js'
import { findDuplicates } from '../utils/duplicateDetection.js'
import { suggestUnitsForItem } from '../utils/unitConversion.js'
import { PageContainer, PageHeader, PageSection } from './layout'
import ShoppingListManager from './ShoppingListManager.jsx'
import DuplicateDetectionModal from './DuplicateDetectionModal.jsx'
import SortableCategorySection from './SortableCategorySection.jsx'
import UnitConversionWidget from './UnitConversionWidget.jsx'
import ViewModeSelector, { VIEW_MODES } from './ViewModeSelector.jsx'
import RoleStructuredView from './RoleStructuredView.jsx'
import GroceryStoreView from './GroceryStoreView.jsx'
import DraggableShoppingListItem from './DraggableShoppingListItem.jsx'
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
  const [viewMode, setViewMode] = useState(VIEW_MODES.GENERAL.id)
  const [newItemRows, setNewItemRows] = useState([{ id: 1, name: '', quantity: '', unit: '', category: 'Other' }])
  const [activeId, setActiveId] = useState(null)

  // Drag and drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // Standard 8px threshold to prevent conflicts with clicks
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  // Use real-time hook if we have a current list and are using Supabase
  const {
    items: realtimeItems,
    itemsByCategory: realtimeItemsByCategory,
    uncheckedItems: realtimeUncheckedItems,
    checkedItems: realtimeCheckedItems,
    isLoading: realtimeLoading,
    isConnected,
    totalItems: realtimeTotalItems,
    checkedCount: realtimeCheckedCount,
    uncheckedCount: realtimeUncheckedCount
  } = useShoppingList(currentList?.id, {
    enableRealtime: !!currentList?.id
  })

  // Local state for IndexedDB users (fallback)
  const [localItems, setLocalItems] = useState([])
  const [isLoadingLocal, setIsLoadingLocal] = useState(false)

  // Determine which data to use based on service type
  const isUsingSupabase = isSupabaseConfigured() && authService.isAuthenticated()
  
  // Use realtimeItems for Supabase users, localItems for IndexedDB users
  const items = isUsingSupabase ? realtimeItems : localItems
  const isLoading = isUsingSupabase ? realtimeLoading : isLoadingLocal
  const totalItems = isUsingSupabase ? realtimeTotalItems : localItems.length
  const checkedCount = isUsingSupabase ? realtimeCheckedCount : localItems.filter(item => item.checked).length
  const uncheckedCount = isUsingSupabase ? realtimeUncheckedCount : localItems.filter(item => !item.checked).length

  // Group items by category
  const itemsByCategory = items.reduce((acc, item) => {
    const category = item.category || 'Other'
    if (!acc[category]) {
      acc[category] = []
    }
    acc[category].push(item)
    return acc
  }, {})

  const allUncheckedItems = items.filter(item => !item.checked)
  const allCheckedItems = items.filter(item => item.checked)

  // Load items for IndexedDB users
  const loadLocalItems = async () => {
    if (!currentList || isUsingSupabase) return
    
    try {
      setIsLoadingLocal(true)
      const shoppingListService = await serviceSelector.getShoppingListService()
      const localItems = await shoppingListService.getItems(currentList.id)
      setLocalItems(localItems || [])
    } catch (error) {
      console.error('Failed to load local items:', error)
      setError('Failed to load items')
    } finally {
      setIsLoadingLocal(false)
    }
  }

  // Load items when current list changes (for IndexedDB users)
  useEffect(() => {
    if (!isUsingSupabase && currentList) {
      loadLocalItems()
    }
  }, [currentList?.id, isUsingSupabase])


  // Helper functions to filter items by source
  const isMealPlanItem = (item) => {
    return item.notes && (item.notes.includes('From') || item.notes.includes('recipe'))
  }
  
  const isCustomItem = (item) => {
    return !isMealPlanItem(item)
  }

  // Filter items based on view mode and source
  const getFilteredItems = (items) => {
    switch (viewMode) {
      case VIEW_MODES.GENERAL.id:
        return items.filter(isCustomItem)
      case VIEW_MODES.MEALS.id:
        return items.filter(isMealPlanItem)
      case VIEW_MODES.GROCERY.id:
      default:
        return items
    }
  }

  const uncheckedItems = getFilteredItems(allUncheckedItems)
  const checkedItems = getFilteredItems(allCheckedItems)


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

  const handleAddNewRow = () => {
    const newId = Math.max(...newItemRows.map(row => row.id)) + 1
    setNewItemRows(prev => [{ id: newId, name: '', quantity: '', unit: '', category: 'Other' }, ...prev])
  }

  const handleUpdateNewItemRow = (id, field, value) => {
    setNewItemRows(prev => prev.map(row => 
      row.id === id ? { ...row, [field]: value } : row
    ))
  }

  const handleSubmitNewItemRow = async (rowId) => {
    const row = newItemRows.find(r => r.id === rowId)
    if (!row || !row.name.trim()) return

    try {
      setIsAdding(true)
      setError(null)
      
      // Auto-detect category if not set
      const category = row.category === 'Other' ? detectCategory(row.name) : row.category
      
      const shoppingListService = await serviceSelector.getShoppingListService()
      
      // Check for duplicates
      const duplicates = findDuplicates(row.name, items, 0.7)
      
      if (duplicates.length > 0) {
        setDetectedDuplicates(duplicates)
        setPendingItem({
          name: row.name.trim(),
          quantity: row.quantity,
          unit: row.unit,
          category: category
        })
        setShowDuplicateModal(true)
        return
      }
      
      const newItem = await shoppingListService.addItem(currentList.id, {
        name: row.name.trim(),
        quantity: row.quantity,
        unit: row.unit,
        category: category
      })
      
      // Update local state for IndexedDB users
      if (!isUsingSupabase && newItem) {
        setLocalItems(prev => [...prev, newItem])
      }
      
      // Remove the submitted row and add a new empty one
      setNewItemRows(prev => {
        const filtered = prev.filter(r => r.id !== rowId)
        const newId = Math.max(...filtered.map(r => r.id)) + 1
        return [{ id: newId, name: '', quantity: '', unit: '', category: 'Other' }, ...filtered]
      })
      
      setSuccess('Item added successfully')
      setTimeout(() => setSuccess(null), 3000)
    } catch (error) {
      console.error('Failed to add item:', error)
      setError('Failed to add item')
    } finally {
      setIsAdding(false)
    }
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

  const handleDragStart = (event) => {
    setActiveId(event.active.id)
  }

  const handleDragEnd = async (event) => {
    setActiveId(null)
    const { active, over } = event

    if (!active || !over || active.id === over.id) {
      return
    }

    try {
      const shoppingListService = await serviceSelector.getShoppingListService()
      
      // Find the dragged item
      const draggedItem = items.find(item => item.id === active.id)
      if (!draggedItem) return

      // Handle different drop targets based on view mode
      if (viewMode === VIEW_MODES.GENERAL.id || viewMode === VIEW_MODES.MEALS.id) {
        // In General/Meals view, items can be reordered within the same section
        const targetItem = items.find(item => item.id === over.id)
        
        if (targetItem) {
          // For General/Meals view, we need to reorder ALL items, not just filtered ones
          // Find the positions of the dragged and target items in the full list
          const oldIndex = items.findIndex(item => item.id === active.id)
          const newIndex = items.findIndex(item => item.id === over.id)

          if (oldIndex !== -1 && newIndex !== -1) {
            const reorderedItems = arrayMove(items, oldIndex, newIndex)
            const itemIds = reorderedItems.map(item => item.id)
            
            // For IndexedDB users, update local state immediately for visual feedback
            if (!isUsingSupabase) {
              setLocalItems(reorderedItems)
            }
            
            try {
              await shoppingListService.reorderItems(currentList.id, itemIds)
              setSuccess('Items reordered successfully')
              setTimeout(() => setSuccess(null), 3000)
            } catch (reorderError) {
              console.error('Reorder failed:', reorderError)
              setError('Failed to reorder items. Please try again.')
              setTimeout(() => setError(null), 5000)
            }
          }
        }
      } else if (viewMode === VIEW_MODES.GROCERY.id) {
        // In Grocery view, handle category-based drops
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
              
              try {
                await shoppingListService.reorderItems(currentList.id, itemIds)
                setSuccess('Items reordered successfully')
                setTimeout(() => setSuccess(null), 3000)
              } catch (reorderError) {
                console.error('Reorder failed, likely missing sort_order column:', reorderError)
                // For now, just update local state for IndexedDB users
                if (!isUsingSupabase) {
                  // Update the local items with the reordered category items
                  const updatedItems = items.map(item => {
                    if (item.category === draggedItem.category) {
                      const newIndex = reorderedItems.findIndex(ri => ri.id === item.id)
                      return newIndex !== -1 ? reorderedItems[newIndex] : item
                    }
                    return item
                  })
                  setLocalItems(updatedItems)
                  setSuccess('Items reordered successfully (local)')
                  setTimeout(() => setSuccess(null), 3000)
                } else {
                  setError('Database schema needs update - please run migration')
                }
              }
            }
          } else {
            // Different category - move item to new category
            await shoppingListService.moveItemToCategory(active.id, targetItem.category)
            setSuccess(`Item moved to ${targetItem.category}`)
            setTimeout(() => setSuccess(null), 3000)
          }
        } else {
          // Dropping on category header
          const targetCategory = CATEGORIES.find(cat => cat === over.id)
          if (targetCategory && targetCategory !== draggedItem.category) {
            await shoppingListService.moveItemToCategory(active.id, targetCategory)
            setSuccess(`Item moved to ${targetCategory}`)
            setTimeout(() => setSuccess(null), 3000)
          }
        }
      }
    } catch (error) {
      console.error('Failed to reorder items:', error)
      setError('Failed to reorder items - ' + error.message)
    }
  }

  const handleToggleItem = async (itemId, checked) => {
    try {
      const shoppingListService = await serviceSelector.getShoppingListService()
      await shoppingListService.toggleItemChecked(itemId, checked)
      
      // Update local state for IndexedDB users
      if (!isUsingSupabase) {
        setLocalItems(prev => prev.map(item => 
          item.id === itemId ? { ...item, checked } : item
        ))
      }
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
      
      // Update local state for IndexedDB users
      if (!isUsingSupabase) {
        setLocalItems(prev => prev.filter(item => item.id !== itemId))
      }
      
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
      
      // Update local state for IndexedDB users
      if (!isUsingSupabase) {
        setLocalItems(prev => prev.map(item => 
          item.id === itemId ? { ...item, ...updates } : item
        ))
      }
      
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

  const handleListDeleted = (deletedListId) => {
    setLists(prev => prev.filter(list => list.id !== deletedListId))
    
    // If deleted list was current, switch to another list or create new one
    if (currentList?.id === deletedListId) {
      const remainingLists = lists.filter(list => list.id !== deletedListId)
      if (remainingLists.length > 0) {
        setCurrentList(remainingLists[0])
      } else {
        setCurrentList(null)
      }
    }
    
    setSuccess('Shopping list deleted successfully')
    setTimeout(() => setSuccess(null), 3000)
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

      {/* View Mode Selector */}
      {currentList && (
        <PageSection>
          <ViewModeSelector
            currentView={viewMode}
            onViewChange={setViewMode}
          />
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

      {/* Active Items - Render based on view mode */}
      {currentList && (uncheckedItems.length > 0 || newItemRows.length > 0) && (
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
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
          >
            {/* Add new item button - above the most recent line item */}
            <button
              onClick={handleAddNewRow}
              className="flex items-center gap-2 text-gray-500 hover:text-gray-700 text-sm mb-2"
            >
              <span className="text-lg">+</span>
              <span>Add new item</span>
            </button>

            {/* New Item Rows - Always at the top */}
            {newItemRows.map((row) => (
              <div key={row.id} className="flex items-center gap-3 p-3 bg-white border border-gray-200 rounded-lg mb-2 hover:shadow-sm transition-shadow">
                {/* Drag handle icon (decorative) */}
                <div className="text-gray-400">
                  <GripVertical className="w-4 h-4" />
                </div>

                {/* Checkbox (decorative) */}
                <div className="w-5 h-5 border-2 border-gray-300 rounded" style={{ borderRadius: '2px' }}></div>

                {/* Item name field */}
                <input
                  type="text"
                  placeholder="Item name"
                  value={row.name}
                  onChange={(e) => handleUpdateNewItemRow(row.id, 'name', e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      handleSubmitNewItemRow(row.id)
                    }
                  }}
                  className="flex-1 px-2 py-1 focus:outline-none"
                  style={{ touchAction: 'manipulation' }}
                />

                {/* Amount field */}
                <input
                  type="text"
                  placeholder="Amount"
                  value={`${row.quantity || ''} ${row.unit || ''}`.trim()}
                  onChange={(e) => {
                    const value = e.target.value
                    // Simple parsing: split by space, first part is quantity, rest is unit
                    const parts = value.trim().split(' ')
                    const quantity = parts[0] || ''
                    const unit = parts.slice(1).join(' ') || ''
                    handleUpdateNewItemRow(row.id, 'quantity', quantity)
                    handleUpdateNewItemRow(row.id, 'unit', unit)
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      handleSubmitNewItemRow(row.id)
                    }
                  }}
                  className="w-32 px-2 py-1 focus:outline-none"
                  style={{ touchAction: 'manipulation' }}
                />
              </div>
            ))}

            {/* Existing Items */}
            {uncheckedItems.length > 0 && (
              <>
                {viewMode === VIEW_MODES.GENERAL.id && (
                  <div className="space-y-4">
                    {uncheckedItems.length > 0 ? (
                      <div className="space-y-2">
                        {/* Section header */}
                        <div className="text-sm font-medium text-gray-700 flex items-center gap-2 p-2 rounded-lg bg-gray-50 border border-gray-200">
                          <span className="text-lg">📝</span>
                          Custom Items
                          <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                            {uncheckedItems.length}
                          </span>
                          <span className="text-xs text-gray-500 ml-auto">
                            Drop items here
                          </span>
                        </div>
                        
                        {/* Sortable items */}
                        <SortableContext items={uncheckedItems.map(item => item.id)} strategy={verticalListSortingStrategy}>
                          <div className="space-y-2">
                            {uncheckedItems.map((item) => (
                              <DraggableShoppingListItem
                                key={item.id}
                                item={item}
                                onToggle={handleToggleItem}
                                onDelete={handleDeleteItem}
                                onUpdate={handleUpdateItem}
                              />
                            ))}
                          </div>
                        </SortableContext>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <div className="text-sm font-medium text-gray-400 flex items-center gap-2 p-2 rounded-lg border-2 border-dashed border-gray-200 min-h-[40px]">
                          <span className="text-lg">📝</span>
                          Custom Items
                          <span className="text-xs bg-gray-100 text-gray-500 px-2 py-1 rounded">
                            0
                          </span>
                          <span className="text-xs text-gray-400 ml-auto">
                            Drop items here
                          </span>
                        </div>
                        <div className="text-center py-8 text-gray-500">
                          <p>No custom items added yet</p>
                          <p className="text-sm mt-1">Add items manually using the form above</p>
                        </div>
                      </div>
                    )}
                  </div>
                )}
                
                {viewMode === VIEW_MODES.MEALS.id && (
                  <div className="space-y-4">
                    {uncheckedItems.length > 0 ? (
                      <div className="space-y-2">
                        {/* Section header */}
                        <div className="text-sm font-medium text-gray-700 flex items-center gap-2 p-2 rounded-lg bg-gray-50 border border-gray-200">
                          <span className="text-lg">🍽️</span>
                          Meal Plan Items
                          <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                            {uncheckedItems.length}
                          </span>
                          <span className="text-xs text-gray-500 ml-auto">
                            Drop items here
                          </span>
                        </div>
                        
                        {/* Sortable items */}
                        <SortableContext items={uncheckedItems.map(item => item.id)} strategy={verticalListSortingStrategy}>
                          <div className="space-y-2">
                            {uncheckedItems.map((item) => (
                              <DraggableShoppingListItem
                                key={item.id}
                                item={item}
                                onToggle={handleToggleItem}
                                onDelete={handleDeleteItem}
                                onUpdate={handleUpdateItem}
                              />
                            ))}
                          </div>
                        </SortableContext>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <div className="text-sm font-medium text-gray-400 flex items-center gap-2 p-2 rounded-lg border-2 border-dashed border-gray-200 min-h-[40px]">
                          <span className="text-lg">🍽️</span>
                          Meal Plan Items
                          <span className="text-xs bg-gray-100 text-gray-500 px-2 py-1 rounded">
                            0
                          </span>
                          <span className="text-xs text-gray-400 ml-auto">
                            Drop items here
                          </span>
                        </div>
                        <div className="text-center py-8 text-gray-500">
                          <p>No meal plan items yet</p>
                          <p className="text-sm mt-1">Import items from your meal plans</p>
                        </div>
                      </div>
                    )}
                  </div>
                )}
                
                {viewMode === VIEW_MODES.GROCERY.id && (
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
                )}
              </>
            )}
            
            <DragOverlay>
              {activeId ? (
                <DraggableShoppingListItem
                  item={items.find(item => item.id === activeId)}
                  onToggle={() => {}}
                  onDelete={() => {}}
                  onUpdate={() => {}}
                  isDragging={true}
                />
              ) : null}
            </DragOverlay>
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

