import React from 'react'
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import ViewModeSelector, { VIEW_MODES } from '../ViewModeSelector.jsx'

describe('ViewModeSelector', () => {
  const mockOnViewChange = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should render all view mode buttons', () => {
    render(
      <ViewModeSelector
        currentView={VIEW_MODES.CATEGORY.id}
        onViewChange={mockOnViewChange}
      />
    )

    expect(screen.getByText('By Category')).toBeInTheDocument()
    expect(screen.getByText('By Role')).toBeInTheDocument()
    expect(screen.getByText('Grocery Store')).toBeInTheDocument()
  })

  it('should show current view description', () => {
    render(
      <ViewModeSelector
        currentView={VIEW_MODES.CATEGORY.id}
        onViewChange={mockOnViewChange}
      />
    )

    expect(screen.getByText('Group items by grocery store sections')).toBeInTheDocument()
  })

  it('should highlight current view button', () => {
    render(
      <ViewModeSelector
        currentView={VIEW_MODES.ROLE.id}
        onViewChange={mockOnViewChange}
      />
    )

    const roleButton = screen.getByText('By Role')
    expect(roleButton).toHaveClass('bg-blue-600') // Primary variant
  })

  it('should call onViewChange when button is clicked', () => {
    render(
      <ViewModeSelector
        currentView={VIEW_MODES.CATEGORY.id}
        onViewChange={mockOnViewChange}
      />
    )

    const groceryButton = screen.getByText('Grocery Store')
    fireEvent.click(groceryButton)

    expect(mockOnViewChange).toHaveBeenCalledWith(VIEW_MODES.GROCERY.id)
  })

  it('should show icons for each view mode', () => {
    render(
      <ViewModeSelector
        currentView={VIEW_MODES.CATEGORY.id}
        onViewChange={mockOnViewChange}
      />
    )

    expect(screen.getByText('📂')).toBeInTheDocument() // Category icon
    expect(screen.getByText('🎭')).toBeInTheDocument() // Role icon
    expect(screen.getByText('🏪')).toBeInTheDocument() // Grocery icon
  })

  it('should apply custom className', () => {
    const { container } = render(
      <ViewModeSelector
        currentView={VIEW_MODES.CATEGORY.id}
        onViewChange={mockOnViewChange}
        className="custom-class"
      />
    )

    expect(container.firstChild).toHaveClass('custom-class')
  })

  it('should show correct descriptions for each view mode', () => {
    const { rerender } = render(
      <ViewModeSelector
        currentView={VIEW_MODES.CATEGORY.id}
        onViewChange={mockOnViewChange}
      />
    )
    expect(screen.getByText('Group items by grocery store sections')).toBeInTheDocument()

    rerender(
      <ViewModeSelector
        currentView={VIEW_MODES.ROLE.id}
        onViewChange={mockOnViewChange}
      />
    )
    expect(screen.getByText('Organize by meal planning roles')).toBeInTheDocument()

    rerender(
      <ViewModeSelector
        currentView={VIEW_MODES.GROCERY.id}
        onViewChange={mockOnViewChange}
      />
    )
    expect(screen.getByText('Optimized for store layout')).toBeInTheDocument()
  })
})
