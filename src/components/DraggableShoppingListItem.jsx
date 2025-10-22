import React from 'react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { motion } from 'framer-motion'

function DraggableShoppingListItem({ 
  item, 
  onToggle, 
  onDelete, 
  onUpdate,
  isDragging = false 
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: isSortableDragging,
  } = useSortable({ id: item.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isSortableDragging ? 0.5 : 1,
  }

  const handleToggle = () => {
    onToggle(item.id, !item.checked)
  }

  const handleDelete = () => {
    if (window.confirm('Are you sure you want to delete this item?')) {
      onDelete(item.id)
    }
  }

  const handleEdit = () => {
    const newName = window.prompt('Edit item name:', item.name)
    if (newName && newName.trim() !== item.name) {
      onUpdate(item.id, { name: newName.trim() })
    }
  }

  return (
    <motion.div
      ref={setNodeRef}
      style={style}
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className={`flex items-center gap-3 p-3 rounded-lg border transition-all ${
        item.checked
          ? 'bg-gray-50 border-gray-200 opacity-60'
          : 'bg-white border-gray-200 hover:bg-gray-50'
      } ${isSortableDragging ? 'shadow-lg z-50' : ''}`}
    >
      {/* Drag Handle */}
      <div
        {...attributes}
        {...listeners}
        className="cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600 p-1"
        title="Drag to reorder"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" />
        </svg>
      </div>

      {/* Checkbox */}
      <button
        onClick={handleToggle}
        className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
          item.checked
            ? 'bg-green-500 border-green-500 text-white'
            : 'border-gray-300 hover:border-green-400'
        }`}
        aria-label={item.checked ? 'Mark as unchecked' : 'Mark as checked'}
      >
        {item.checked && (
          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
        )}
      </button>

      {/* Item Content */}
      <div className="flex-1 min-w-0">
        <div className={`font-medium ${item.checked ? 'line-through text-gray-500' : 'text-gray-900'}`}>
          {item.name}
        </div>
        {(item.quantity || item.unit) && (
          <div className="text-sm text-gray-600">
            {item.quantity && item.unit ? `${item.quantity} ${item.unit}` : item.quantity || item.unit}
          </div>
        )}
        {item.notes && (
          <div className="text-xs text-gray-500 mt-1">
            {item.notes}
          </div>
        )}
      </div>

      {/* Category Badge */}
      {item.category && item.category !== 'Other' && (
        <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
          {item.category}
        </span>
      )}

      {/* Actions */}
      <div className="flex items-center gap-1">
        <button
          onClick={handleEdit}
          className="text-gray-400 hover:text-gray-600 p-1"
          title="Edit item"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
        </button>
        
        <button
          onClick={handleDelete}
          className="text-gray-400 hover:text-red-600 p-1"
          title="Delete item"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      </div>
    </motion.div>
  )
}

export default DraggableShoppingListItem
