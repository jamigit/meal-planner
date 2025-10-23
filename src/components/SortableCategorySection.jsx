import React from 'react'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { useDroppable } from '@dnd-kit/core'
import DraggableShoppingListItem from './DraggableShoppingListItem.jsx'

function SortableCategorySection({ 
  category, 
  items, 
  onToggleItem, 
  onDeleteItem, 
  onUpdateItem 
}) {
  const { setNodeRef: setDroppableRef } = useDroppable({
    id: category,
  })

  if (items.length === 0) {
    return (
      <div className="space-y-2">
        <div 
          ref={setDroppableRef}
          className="text-sm font-medium text-gray-400 flex items-center gap-2 p-2 rounded-lg border-2 border-dashed border-gray-200 min-h-[40px]"
        >
          <span className="text-lg">{getCategoryIcon(category)}</span>
          {category}
          <span className="text-xs bg-gray-100 text-gray-500 px-2 py-1 rounded">
            0
          </span>
          <span className="text-xs text-gray-400 ml-auto">
            Drop items here
          </span>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <div 
        ref={setDroppableRef}
        className="text-sm font-medium text-gray-700 flex items-center gap-2 p-2 rounded-lg bg-gray-50 border border-gray-200"
      >
        <span className="text-lg">{getCategoryIcon(category)}</span>
        {category}
        <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
          {items.length}
        </span>
        <span className="text-xs text-gray-500 ml-auto">
          Drop items here
        </span>
      </div>
      
      <SortableContext items={items.map(item => item.id)} strategy={verticalListSortingStrategy}>
        <div className="space-y-2">
          {items.map((item) => (
            <DraggableShoppingListItem
              key={item.id}
              item={item}
              onToggle={onToggleItem}
              onDelete={onDeleteItem}
              onUpdate={onUpdateItem}
            />
          ))}
        </div>
      </SortableContext>
    </div>
  )
}

function getCategoryIcon(category) {
  const icons = {
    'Produce': '🥬',
    'Meat & Seafood': '🥩',
    'Dairy & Eggs': '🥛',
    'Pantry & Dry Goods': '🌾',
    'Canned & Jarred': '🥫',
    'Frozen': '❄️',
    'Bakery': '🍞',
    'Beverages': '🥤',
    'Other': '📦'
  }
  return icons[category] || '📦'
}

export default SortableCategorySection
