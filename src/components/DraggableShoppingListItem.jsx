import React, { useState, useEffect, useRef } from 'react'
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
  const [isEditing, setIsEditing] = useState(false)
  const [editValue, setEditValue] = useState(item.name)
  const inputRef = useRef(null)

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

  const handleToggle = (e) => {
    // Prevent drag events from interfering with checkbox clicks
    e.stopPropagation()
    e.preventDefault()
    onToggle(item.id, !item.checked)
  }

  const handleDelete = (e) => {
    e.stopPropagation()
    e.preventDefault()
    if (window.confirm('Are you sure you want to delete this item?')) {
      onDelete(item.id)
    }
  }

  const handleNameClick = (e) => {
    if (!item.checked) {
      e.stopPropagation()
      setIsEditing(true)
      setEditValue(item.name)
    }
  }

  const handleSave = () => {
    if (editValue.trim() && editValue !== item.name) {
      onUpdate(item.id, { name: editValue.trim() })
    }
    setIsEditing(false)
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleSave()
    } else if (e.key === 'Escape') {
      setEditValue(item.name)
      setIsEditing(false)
    }
  }

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus()
      inputRef.current.select()
    }
  }, [isEditing])

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
      {/* Drag Handle - always visible with six-dot pattern */}
      <div
        {...attributes}
        {...listeners}
        className="cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600 p-1"
        title="Drag to reorder"
      >
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
          <circle cx="7" cy="6" r="1.5" />
          <circle cx="12" cy="6" r="1.5" />
          <circle cx="17" cy="6" r="1.5" />
          <circle cx="7" cy="12" r="1.5" />
          <circle cx="12" cy="12" r="1.5" />
          <circle cx="17" cy="12" r="1.5" />
        </svg>
      </div>

      {/* Checkbox - square style like Google Keep */}
      <button
        onClick={handleToggle}
        onTouchEnd={handleToggle}
        className={`w-5 h-5 border-2 flex items-center justify-center transition-colors ${
          item.checked
            ? 'bg-green-500 border-green-500 text-white'
            : 'border-gray-400 hover:border-green-500 bg-white'
        }`}
        aria-label={item.checked ? 'Mark as unchecked' : 'Mark as checked'}
        style={{ touchAction: 'manipulation', borderRadius: '2px' }}
      >
        {item.checked && (
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
        )}
      </button>

      {/* Item Content with inline editing */}
      <div className="flex-1 min-w-0">
        {isEditing ? (
          <input
            ref={inputRef}
            type="text"
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onBlur={handleSave}
            onKeyDown={handleKeyDown}
            className="w-full px-2 py-1 border border-blue-500 rounded focus:outline-none text-gray-900 font-medium"
            style={{ touchAction: 'manipulation' }}
          />
        ) : (
          <div onClick={handleNameClick} className="cursor-text">
            <span className={`font-medium ${item.checked ? 'line-through text-gray-500' : 'text-gray-900'}`}>
              {item.name}
            </span>
            {(item.quantity || item.unit) && (
              <span className="text-sm text-gray-500 ml-2">
                {item.quantity} {item.unit}
              </span>
            )}
            {item.notes && (
              <div className="text-xs text-gray-500 mt-1">{item.notes}</div>
            )}
          </div>
        )}
      </div>

      {/* Category Badge */}
      {item.category && item.category !== 'Other' && (
        <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
          {item.category}
        </span>
      )}

      {/* Actions - only delete button since we have inline editing */}
      <div className="flex items-center gap-1">
        <button
          onClick={handleDelete}
          onTouchEnd={handleDelete}
          className="text-gray-400 hover:text-red-600 p-1"
          title="Delete item"
          style={{ touchAction: 'manipulation' }}
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
