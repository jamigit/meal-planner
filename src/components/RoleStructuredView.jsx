import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { useDroppable } from '@dnd-kit/core'
import DraggableShoppingListItem from './DraggableShoppingListItem.jsx'

function RoleStructuredView({ 
  items, 
  onToggleItem, 
  onDeleteItem, 
  onUpdateItem 
}) {
  // Group items by role (this would typically come from meal plan data)
  const roleGroups = {
    general: {
      name: 'General Items',
      icon: '🛒',
      description: 'Items not tied to specific meals',
      items: items.filter(item => !item.meal_role || item.meal_role === 'general')
    },
    dinners: {
      name: 'Dinner Items',
      icon: '🍽️',
      description: 'Items for dinner meals',
      items: items.filter(item => item.meal_role === 'dinner')
    },
    breakfast: {
      name: 'Breakfast Items',
      icon: '🌅',
      description: 'Items for breakfast meals',
      items: items.filter(item => item.meal_role === 'breakfast')
    },
    lunch: {
      name: 'Lunch Items',
      icon: '🥪',
      description: 'Items for lunch meals',
      items: items.filter(item => item.meal_role === 'lunch')
    },
    snacks: {
      name: 'Snacks & Treats',
      icon: '🍿',
      description: 'Snacks and treats',
      items: items.filter(item => item.meal_role === 'snacks')
    }
  }

  return (
    <div className="space-y-6">
      {Object.entries(roleGroups).map(([roleKey, roleGroup]) => (
        <RoleSection
          key={roleKey}
          roleKey={roleKey}
          roleGroup={roleGroup}
          onToggleItem={onToggleItem}
          onDeleteItem={onDeleteItem}
          onUpdateItem={onUpdateItem}
        />
      ))}
    </div>
  )
}

function RoleSection({ 
  roleKey, 
  roleGroup, 
  onToggleItem, 
  onDeleteItem, 
  onUpdateItem 
}) {
  const { setNodeRef: setDroppableRef } = useDroppable({
    id: `role-${roleKey}`,
  })

  if (roleGroup.items.length === 0) {
    return (
      <div className="space-y-2">
        <div 
          ref={setDroppableRef}
          className="text-sm font-medium text-gray-400 flex items-center gap-2 p-3 rounded-lg border-2 border-dashed border-gray-200 min-h-[50px]"
        >
          <span className="text-xl">{roleGroup.icon}</span>
          <div className="flex-1">
            <div className="font-medium">{roleGroup.name}</div>
            <div className="text-xs text-gray-400">{roleGroup.description}</div>
          </div>
          <span className="text-xs bg-gray-100 text-gray-500 px-2 py-1 rounded">
            0 items
          </span>
          <span className="text-xs text-gray-400 ml-2">
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
        className="text-sm font-medium text-gray-700 flex items-center gap-2 p-3 rounded-lg bg-gray-50 border border-gray-200"
      >
        <span className="text-xl">{roleGroup.icon}</span>
        <div className="flex-1">
          <div className="font-medium">{roleGroup.name}</div>
          <div className="text-xs text-gray-500">{roleGroup.description}</div>
        </div>
        <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
          {roleGroup.items.length} items
        </span>
        <span className="text-xs text-gray-500 ml-2">
          Drop items here
        </span>
      </div>
      
      <SortableContext items={roleGroup.items.map(item => item.id)} strategy={verticalListSortingStrategy}>
        <div className="space-y-2">
          <AnimatePresence>
            {roleGroup.items.map((item) => (
              <DraggableShoppingListItem
                key={item.id}
                item={item}
                onToggle={onToggleItem}
                onDelete={onDeleteItem}
                onUpdate={onUpdateItem}
              />
            ))}
          </AnimatePresence>
        </div>
      </SortableContext>
    </div>
  )
}

export default RoleStructuredView
