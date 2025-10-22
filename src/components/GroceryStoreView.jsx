import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { SortableContext, verticalListSortingStrategy, useDroppable } from '@dnd-kit/sortable'
import DraggableShoppingListItem from './DraggableShoppingListItem.jsx'

function GroceryStoreView({ 
  items, 
  onToggleItem, 
  onDeleteItem, 
  onUpdateItem 
}) {
  // Grocery store sections in typical store layout order
  const storeSections = {
    produce: {
      name: 'Produce',
      icon: '🥬',
      description: 'Fresh fruits and vegetables',
      items: items.filter(item => item.category === 'Produce')
    },
    bakery: {
      name: 'Bakery',
      icon: '🍞',
      description: 'Fresh bread and pastries',
      items: items.filter(item => item.category === 'Bakery')
    },
    meat: {
      name: 'Meat & Seafood',
      icon: '🥩',
      description: 'Fresh meat, poultry, and seafood',
      items: items.filter(item => item.category === 'Meat & Seafood')
    },
    dairy: {
      name: 'Dairy & Eggs',
      icon: '🥛',
      description: 'Milk, cheese, eggs, and dairy products',
      items: items.filter(item => item.category === 'Dairy & Eggs')
    },
    frozen: {
      name: 'Frozen Foods',
      icon: '❄️',
      description: 'Frozen vegetables, meals, and ice cream',
      items: items.filter(item => item.category === 'Frozen')
    },
    pantry: {
      name: 'Pantry & Dry Goods',
      icon: '🌾',
      description: 'Rice, pasta, cereals, and dry goods',
      items: items.filter(item => item.category === 'Pantry & Dry Goods')
    },
    canned: {
      name: 'Canned & Jarred',
      icon: '🥫',
      description: 'Canned goods and jarred items',
      items: items.filter(item => item.category === 'Canned & Jarred')
    },
    beverages: {
      name: 'Beverages',
      icon: '🥤',
      description: 'Drinks, juices, and beverages',
      items: items.filter(item => item.category === 'Beverages')
    },
    other: {
      name: 'Other',
      icon: '📦',
      description: 'Miscellaneous items',
      items: items.filter(item => item.category === 'Other')
    }
  }

  return (
    <div className="space-y-6">
      <div className="text-sm text-gray-600 mb-4">
        Organized by typical grocery store layout for efficient shopping
      </div>
      
      {Object.entries(storeSections).map(([sectionKey, section]) => (
        <StoreSection
          key={sectionKey}
          sectionKey={sectionKey}
          section={section}
          onToggleItem={onToggleItem}
          onDeleteItem={onDeleteItem}
          onUpdateItem={onUpdateItem}
        />
      ))}
    </div>
  )
}

function StoreSection({ 
  sectionKey, 
  section, 
  onToggleItem, 
  onDeleteItem, 
  onUpdateItem 
}) {
  const { setNodeRef: setDroppableRef } = useDroppable({
    id: `store-${sectionKey}`,
  })

  if (section.items.length === 0) {
    return (
      <div className="space-y-2">
        <div 
          ref={setDroppableRef}
          className="text-sm font-medium text-gray-400 flex items-center gap-2 p-3 rounded-lg border-2 border-dashed border-gray-200 min-h-[50px]"
        >
          <span className="text-xl">{section.icon}</span>
          <div className="flex-1">
            <div className="font-medium">{section.name}</div>
            <div className="text-xs text-gray-400">{section.description}</div>
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
        <span className="text-xl">{section.icon}</span>
        <div className="flex-1">
          <div className="font-medium">{section.name}</div>
          <div className="text-xs text-gray-500">{section.description}</div>
        </div>
        <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
          {section.items.length} items
        </span>
        <span className="text-xs text-gray-500 ml-2">
          Drop items here
        </span>
      </div>
      
      <SortableContext items={section.items.map(item => item.id)} strategy={verticalListSortingStrategy}>
        <div className="space-y-2">
          <AnimatePresence>
            {section.items.map((item) => (
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

export default GroceryStoreView
