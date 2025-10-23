import React from 'react'
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import RoleStructuredView from '../RoleStructuredView.jsx'

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

describe('RoleStructuredView', () => {
  const mockItems = [
    { id: 1, name: 'Apple', meal_role: 'general', checked: false },
    { id: 2, name: 'Coffee', meal_role: 'breakfast', checked: false },
    { id: 3, name: 'Sandwich', meal_role: 'lunch', checked: false },
    { id: 4, name: 'Steak', meal_role: 'dinner', checked: false },
    { id: 5, name: 'Chips', meal_role: 'snacks', checked: false }
  ]

  const mockOnToggle = vi.fn()
  const mockOnDelete = vi.fn()
  const mockOnUpdate = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should render all role sections', () => {
    render(
      <RoleStructuredView
        items={mockItems}
        onToggleItem={mockOnToggle}
        onDeleteItem={mockOnDelete}
        onUpdateItem={mockOnUpdate}
      />
    )

    expect(screen.getByText('General Items')).toBeInTheDocument()
    expect(screen.getByText('Breakfast Items')).toBeInTheDocument()
    expect(screen.getByText('Lunch Items')).toBeInTheDocument()
    expect(screen.getByText('Dinner Items')).toBeInTheDocument()
    expect(screen.getByText('Snacks & Treats')).toBeInTheDocument()
  })

  it('should group items by meal role', () => {
    render(
      <RoleStructuredView
        items={mockItems}
        onToggleItem={mockOnToggle}
        onDeleteItem={mockOnDelete}
        onUpdateItem={mockOnUpdate}
      />
    )

    expect(screen.getByText('Apple')).toBeInTheDocument()
    expect(screen.getByText('Coffee')).toBeInTheDocument()
    expect(screen.getByText('Sandwich')).toBeInTheDocument()
    expect(screen.getByText('Steak')).toBeInTheDocument()
    expect(screen.getByText('Chips')).toBeInTheDocument()
  })

  it('should show item counts for each role', () => {
    render(
      <RoleStructuredView
        items={mockItems}
        onToggleItem={mockOnToggle}
        onDeleteItem={mockOnDelete}
        onUpdateItem={mockOnUpdate}
      />
    )

    expect(screen.getByText('(1 items)')).toBeInTheDocument() // General items count
  })

  it('should show empty state for roles with no items', () => {
    const emptyItems = [
      { id: 1, name: 'Apple', meal_role: 'general', checked: false }
    ]

    render(
      <RoleStructuredView
        items={emptyItems}
        onToggleItem={mockOnToggle}
        onDeleteItem={mockOnDelete}
        onUpdateItem={mockOnUpdate}
      />
    )

    // Should show empty state for roles without items
    expect(screen.getAllByText('0 items')).toHaveLength(4) // 4 empty roles
  })

  it('should handle item toggle', () => {
    render(
      <RoleStructuredView
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
      <RoleStructuredView
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
      <RoleStructuredView
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

  it('should show role icons', () => {
    render(
      <RoleStructuredView
        items={mockItems}
        onToggleItem={mockOnToggle}
        onDeleteItem={mockOnDelete}
        onUpdateItem={mockOnUpdate}
      />
    )

    expect(screen.getByText('🛒')).toBeInTheDocument() // General icon
    expect(screen.getByText('🌅')).toBeInTheDocument() // Breakfast icon
    expect(screen.getByText('🥪')).toBeInTheDocument() // Lunch icon
    expect(screen.getByText('🍽️')).toBeInTheDocument() // Dinner icon
    expect(screen.getByText('🍿')).toBeInTheDocument() // Snacks icon
  })

  it('should show role descriptions', () => {
    render(
      <RoleStructuredView
        items={mockItems}
        onToggleItem={mockOnToggle}
        onDeleteItem={mockOnDelete}
        onUpdateItem={mockOnUpdate}
      />
    )

    expect(screen.getByText('Items not tied to specific meals')).toBeInTheDocument()
    expect(screen.getByText('Items for breakfast meals')).toBeInTheDocument()
    expect(screen.getByText('Items for lunch meals')).toBeInTheDocument()
    expect(screen.getByText('Items for dinner meals')).toBeInTheDocument()
    expect(screen.getByText('Snacks and treats')).toBeInTheDocument()
  })
})
