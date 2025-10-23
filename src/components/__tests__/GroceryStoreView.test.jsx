import React from 'react'
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import GroceryStoreView from '../GroceryStoreView.jsx'

// Mock @dnd-kit
vi.mock('@dnd-kit/sortable', () => ({
  SortableContext: ({ children }) => <div data-testid="sortable-context">{children}</div>,
  verticalListSortingStrategy: {},
  useDroppable: vi.fn(() => ({
    setNodeRef: vi.fn()
  }))
}))

// Mock DraggableShoppingListItem
vi.mock('../DraggableShoppingListItem.jsx', () => ({
  default: ({ item, onToggle, onDelete, onUpdate }) => (
    <div data-testid={`draggable-item-${item.id}`}>
      <span>{item.name}</span>
      <button onClick={() => onToggle(item.id, !item.checked)}>
        Toggle
      </button>
      <button onClick={() => onDelete(item.id)}>
        Delete
      </button>
      <button onClick={() => onUpdate(item.id, { name: 'Updated' })}>
        Update
      </button>
    </div>
  )
}))

describe('GroceryStoreView', () => {
  const mockItems = [
    { id: 1, name: 'Apple', category: 'Produce', checked: false },
    { id: 2, name: 'Bread', category: 'Bakery', checked: false },
    { id: 3, name: 'Chicken', category: 'Meat & Seafood', checked: false },
    { id: 4, name: 'Milk', category: 'Dairy & Eggs', checked: false },
    { id: 5, name: 'Ice Cream', category: 'Frozen', checked: false },
    { id: 6, name: 'Rice', category: 'Pantry & Dry Goods', checked: false },
    { id: 7, name: 'Canned Tomatoes', category: 'Canned & Jarred', checked: false },
    { id: 8, name: 'Soda', category: 'Beverages', checked: false },
    { id: 9, name: 'Random Item', category: 'Other', checked: false }
  ]

  const mockOnToggle = vi.fn()
  const mockOnDelete = vi.fn()
  const mockOnUpdate = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should render all store sections', () => {
    render(
      <GroceryStoreView
        items={mockItems}
        onToggleItem={mockOnToggle}
        onDeleteItem={mockOnDelete}
        onUpdateItem={mockOnUpdate}
      />
    )

    expect(screen.getByText('Produce')).toBeInTheDocument()
    expect(screen.getByText('Bakery')).toBeInTheDocument()
    expect(screen.getByText('Meat & Seafood')).toBeInTheDocument()
    expect(screen.getByText('Dairy & Eggs')).toBeInTheDocument()
    expect(screen.getByText('Frozen Foods')).toBeInTheDocument()
    expect(screen.getByText('Pantry & Dry Goods')).toBeInTheDocument()
    expect(screen.getByText('Canned & Jarred')).toBeInTheDocument()
    expect(screen.getByText('Beverages')).toBeInTheDocument()
    expect(screen.getByText('Other')).toBeInTheDocument()
  })

  it('should group items by category', () => {
    render(
      <GroceryStoreView
        items={mockItems}
        onToggleItem={mockOnToggle}
        onDeleteItem={mockOnDelete}
        onUpdateItem={mockOnUpdate}
      />
    )

    expect(screen.getByText('Apple')).toBeInTheDocument()
    expect(screen.getByText('Bread')).toBeInTheDocument()
    expect(screen.getByText('Chicken')).toBeInTheDocument()
    expect(screen.getByText('Milk')).toBeInTheDocument()
    expect(screen.getByText('Ice Cream')).toBeInTheDocument()
    expect(screen.getByText('Rice')).toBeInTheDocument()
    expect(screen.getByText('Canned Tomatoes')).toBeInTheDocument()
    expect(screen.getByText('Soda')).toBeInTheDocument()
    expect(screen.getByText('Random Item')).toBeInTheDocument()
  })

  it('should show item counts for each section', () => {
    render(
      <GroceryStoreView
        items={mockItems}
        onToggleItem={mockOnToggle}
        onDeleteItem={mockOnDelete}
        onUpdateItem={mockOnUpdate}
      />
    )

    expect(screen.getByText('(1 items)')).toBeInTheDocument() // Each section has 1 item
  })

  it('should show empty state for sections with no items', () => {
    const limitedItems = [
      { id: 1, name: 'Apple', category: 'Produce', checked: false }
    ]

    render(
      <GroceryStoreView
        items={limitedItems}
        onToggleItem={mockOnToggle}
        onDeleteItem={mockOnDelete}
        onUpdateItem={mockOnUpdate}
      />
    )

    // Should show empty state for sections without items
    expect(screen.getAllByText('0 items')).toHaveLength(8) // 8 empty sections
  })

  it('should handle item toggle', () => {
    render(
      <GroceryStoreView
        items={mockItems}
        onToggleItem={mockOnToggle}
        onDeleteItem={mockOnDelete}
        onUpdateItem={mockOnUpdate}
      />
    )

    const toggleButton = screen.getAllByText('Toggle')[0]
    fireEvent.click(toggleButton)

    expect(mockOnToggle).toHaveBeenCalledWith(1, true)
  })

  it('should handle item delete', () => {
    render(
      <GroceryStoreView
        items={mockItems}
        onToggleItem={mockOnToggle}
        onDeleteItem={mockOnDelete}
        onUpdateItem={mockOnUpdate}
      />
    )

    const deleteButton = screen.getAllByText('Delete')[0]
    fireEvent.click(deleteButton)

    expect(mockOnDelete).toHaveBeenCalledWith(1)
  })

  it('should handle item update', () => {
    render(
      <GroceryStoreView
        items={mockItems}
        onToggleItem={mockOnToggle}
        onDeleteItem={mockOnDelete}
        onUpdateItem={mockOnUpdate}
      />
    )

    const updateButton = screen.getAllByText('Update')[0]
    fireEvent.click(updateButton)

    expect(mockOnUpdate).toHaveBeenCalledWith(1, { name: 'Updated' })
  })

  it('should show store section icons', () => {
    render(
      <GroceryStoreView
        items={mockItems}
        onToggleItem={mockOnToggle}
        onDeleteItem={mockOnDelete}
        onUpdateItem={mockOnUpdate}
      />
    )

    expect(screen.getByText('🥬')).toBeInTheDocument() // Produce icon
    expect(screen.getByText('🍞')).toBeInTheDocument() // Bakery icon
    expect(screen.getByText('🥩')).toBeInTheDocument() // Meat icon
    expect(screen.getByText('🥛')).toBeInTheDocument() // Dairy icon
    expect(screen.getByText('❄️')).toBeInTheDocument() // Frozen icon
    expect(screen.getByText('🌾')).toBeInTheDocument() // Pantry icon
    expect(screen.getByText('🥫')).toBeInTheDocument() // Canned icon
    expect(screen.getByText('🥤')).toBeInTheDocument() // Beverages icon
    expect(screen.getByText('📦')).toBeInTheDocument() // Other icon
  })

  it('should show store section descriptions', () => {
    render(
      <GroceryStoreView
        items={mockItems}
        onToggleItem={mockOnToggle}
        onDeleteItem={mockOnDelete}
        onUpdateItem={mockOnUpdate}
      />
    )

    expect(screen.getByText('Fresh fruits and vegetables')).toBeInTheDocument()
    expect(screen.getByText('Fresh bread and pastries')).toBeInTheDocument()
    expect(screen.getByText('Fresh meat, poultry, and seafood')).toBeInTheDocument()
    expect(screen.getByText('Milk, cheese, eggs, and dairy products')).toBeInTheDocument()
    expect(screen.getByText('Frozen vegetables, meals, and ice cream')).toBeInTheDocument()
    expect(screen.getByText('Rice, pasta, cereals, and dry goods')).toBeInTheDocument()
    expect(screen.getByText('Canned goods and jarred items')).toBeInTheDocument()
    expect(screen.getByText('Drinks, juices, and beverages')).toBeInTheDocument()
    expect(screen.getByText('Miscellaneous items')).toBeInTheDocument()
  })

  it('should show store layout description', () => {
    render(
      <GroceryStoreView
        items={mockItems}
        onToggleItem={mockOnToggle}
        onDeleteItem={mockOnDelete}
        onUpdateItem={mockOnUpdate}
      />
    )

    expect(screen.getByText('Organized by typical grocery store layout for efficient shopping')).toBeInTheDocument()
  })
})
