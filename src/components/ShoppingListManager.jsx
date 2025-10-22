import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { serviceSelector } from '../services/serviceSelector.js'
import Button from './ui/Button'
import Input from './ui/Input'
import Message from './ui/Message'

function ShoppingListManager({ 
  currentListId, 
  onListChange, 
  onListCreated, 
  onListDeleted,
  className = '' 
}) {
  const [lists, setLists] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [isCreating, setIsCreating] = useState(false)
  const [isDeleting, setIsDeleting] = useState(null)
  const [newListName, setNewListName] = useState('')
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)

  useEffect(() => {
    loadLists()
  }, [])

  const loadLists = async () => {
    try {
      setIsLoading(true)
      setError(null)
      
      const shoppingListService = await serviceSelector.getShoppingListService()
      const allLists = await shoppingListService.getAllLists()
      setLists(allLists)
    } catch (error) {
      console.error('Failed to load lists:', error)
      setError('Failed to load shopping lists')
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreateList = async (e) => {
    e.preventDefault()
    
    if (!newListName.trim()) {
      setError('List name is required')
      return
    }

    try {
      setIsCreating(true)
      setError(null)
      
      const shoppingListService = await serviceSelector.getShoppingListService()
      const newList = await shoppingListService.createList(newListName.trim())
      
      setLists(prev => [...prev, newList])
      setNewListName('')
      setSuccess('Shopping list created successfully')
      setTimeout(() => setSuccess(null), 3000)
      
      onListCreated?.(newList)
    } catch (error) {
      console.error('Failed to create list:', error)
      setError('Failed to create shopping list')
    } finally {
      setIsCreating(false)
    }
  }

  const handleDeleteList = async (listId) => {
    if (!window.confirm('Are you sure you want to delete this shopping list? All items will be permanently removed.')) {
      return
    }

    try {
      setIsDeleting(listId)
      setError(null)
      
      const shoppingListService = await serviceSelector.getShoppingListService()
      await shoppingListService.deleteList(listId)
      
      setLists(prev => prev.filter(list => list.id !== listId))
      setSuccess('Shopping list deleted successfully')
      setTimeout(() => setSuccess(null), 3000)
      
      onListDeleted?.(listId)
      
      // If we deleted the current list, switch to the first available list
      if (listId === currentListId && lists.length > 1) {
        const remainingLists = lists.filter(list => list.id !== listId)
        if (remainingLists.length > 0) {
          onListChange?.(remainingLists[0])
        }
      }
    } catch (error) {
      console.error('Failed to delete list:', error)
      setError('Failed to delete shopping list')
    } finally {
      setIsDeleting(null)
    }
  }

  const handleRenameList = async (listId, newName) => {
    if (!newName.trim()) {
      setError('List name cannot be empty')
      return
    }

    try {
      setError(null)
      
      const shoppingListService = await serviceSelector.getShoppingListService()
      const updatedList = await shoppingListService.updateList(listId, { name: newName.trim() })
      
      setLists(prev => prev.map(list => 
        list.id === listId ? updatedList : list
      ))
      setSuccess('Shopping list renamed successfully')
      setTimeout(() => setSuccess(null), 3000)
    } catch (error) {
      console.error('Failed to rename list:', error)
      setError('Failed to rename shopping list')
    }
  }

  if (isLoading) {
    return (
      <div className={`p-4 ${className}`}>
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
          <span className="ml-2 text-gray-600">Loading lists...</span>
        </div>
      </div>
    )
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Status Messages */}
      {error && (
        <Message variant="error">
          {error}
        </Message>
      )}
      
      {success && (
        <Message variant="success">
          {success}
        </Message>
      )}

      {/* Create New List */}
      <form onSubmit={handleCreateList} className="space-y-3">
        <div className="flex gap-2">
          <Input
            placeholder="New list name"
            value={newListName}
            onChange={(e) => setNewListName(e.target.value)}
            className="flex-1"
            disabled={isCreating}
          />
          <Button
            type="submit"
            disabled={isCreating || !newListName.trim()}
            size="sm"
          >
            {isCreating ? 'Creating...' : 'Create'}
          </Button>
        </div>
      </form>

      {/* Lists */}
      <div className="space-y-2">
        <h3 className="text-sm font-medium text-gray-700 mb-2">Your Lists</h3>
        <AnimatePresence>
          {lists.map((list) => (
            <motion.div
              key={list.id}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className={`flex items-center justify-between p-3 rounded-lg border transition-all ${
                list.id === currentListId
                  ? 'bg-blue-50 border-blue-200'
                  : 'bg-white border-gray-200 hover:bg-gray-50'
              }`}
            >
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <button
                  onClick={() => onListChange?.(list)}
                  className={`flex-1 text-left truncate ${
                    list.id === currentListId
                      ? 'text-blue-900 font-medium'
                      : 'text-gray-900 hover:text-blue-600'
                  }`}
                >
                  {list.name}
                </button>
                
                {list.id === currentListId && (
                  <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                    Active
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    const newName = window.prompt('Enter new name:', list.name)
                    if (newName && newName !== list.name) {
                      handleRenameList(list.id, newName)
                    }
                  }}
                  className="text-gray-400 hover:text-gray-600 text-sm"
                  disabled={isDeleting === list.id}
                >
                  Rename
                </button>
                
                {lists.length > 1 && (
                  <button
                    onClick={() => handleDeleteList(list.id)}
                    className="text-red-400 hover:text-red-600 text-sm"
                    disabled={isDeleting === list.id}
                  >
                    {isDeleting === list.id ? 'Deleting...' : 'Delete'}
                  </button>
                )}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {lists.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          <p>No shopping lists yet. Create your first list above!</p>
        </div>
      )}
    </div>
  )
}

export default ShoppingListManager
