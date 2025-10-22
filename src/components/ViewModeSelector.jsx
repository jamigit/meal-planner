import React from 'react'
import { motion } from 'framer-motion'
import Button from './ui/Button'

const VIEW_MODES = {
  CATEGORY: {
    id: 'category',
    name: 'By Category',
    icon: '📂',
    description: 'Group items by grocery store sections'
  },
  ROLE: {
    id: 'role',
    name: 'By Role',
    icon: '🎭',
    description: 'Organize by meal planning roles'
  },
  GROCERY: {
    id: 'grocery',
    name: 'Grocery Store',
    icon: '🏪',
    description: 'Optimized for store layout'
  }
}

function ViewModeSelector({ 
  currentView, 
  onViewChange, 
  className = '' 
}) {
  return (
    <div className={`space-y-3 ${className}`}>
      <div className="text-sm font-medium text-gray-700">View Mode</div>
      
      <div className="flex gap-2">
        {Object.values(VIEW_MODES).map((mode) => (
          <Button
            key={mode.id}
            variant={currentView === mode.id ? 'primary' : 'secondary'}
            size="sm"
            onClick={() => onViewChange(mode.id)}
            className="flex items-center gap-2"
            title={mode.description}
          >
            <span>{mode.icon}</span>
            <span className="hidden sm:inline">{mode.name}</span>
          </Button>
        ))}
      </div>
      
      <div className="text-xs text-gray-500">
        {VIEW_MODES[currentView]?.description}
      </div>
    </div>
  )
}

export { VIEW_MODES }
export default ViewModeSelector
