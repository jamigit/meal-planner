import React from 'react'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import ShoppingListPage from '../ShoppingListPage.jsx'
import { serviceSelector } from '../../services/serviceSelector.js'
import { useShoppingList } from '../../hooks/useShoppingListRealtime.js'
import { detectCategory } from '../../utils/categoryDetection.js'
import { findDuplicates } from '../../utils/duplicateDetection.js'

// Mock dependencies
vi.mock('../../services/serviceSelector.js', () => ({
  serviceSelector: {
    getShoppingListService: vi.fn()
  }
}))

vi.mock('../../hooks/useShoppingListRealtime.js', () => ({
  useShoppingList: vi.fn()
}))

vi.mock('../../utils/categoryDetection.js', () => ({
  detectCategory: vi.fn()
}))

vi.mock('../../utils/duplicateDetection.js', () => ({
  findDuplicates: vi.fn()
}))

// Mock framer-motion
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }) => <div {...props}>{children}</div>
  },
  AnimatePresence: ({ children }) => <>{children}</>
}))

// Mock @dnd-kit
vi.mock('@dnd-kit/core', () => ({
  DndContext: ({ children }) => <div data-testid="dnd-context">{children}</div>,
  closestCenter: {},
  KeyboardSensor: vi.fn(),
  PointerSensor: vi.fn(),
  useSensor: vi.fn(),
  useSensors: vi.fn(() => [])
}))

vi.mock('@dnd-kit/sortable', () => ({
  arrayMove: vi.fn(),
  SortableContext: ({ children }) => <div data-testid="sortable-context">{children}</div>,
  sortableKeyboardCoordinates: {},
  verticalListSortingStrategy: {}
}))

// Mock child components
vi.mock('../ShoppingListManager.jsx', () => ({
  default: ({ onListChange, onListCreated, onListDeleted }) => (
    <div data-testid="shopping-list-manager">
      <button onClick={() => onListCreated({ id: 2, name: 'New List' })}>
        Create List
      </button>
      <button onClick={() => onListDeleted(1)}>
        Delete List
      </button>
      <button onClick={() => onListChange({ id: 1, name: 'Current List' })}>
        Change List
      </button>
    </div>
  )
}))

vi.mock('../DuplicateDetectionModal.jsx', () => ({
  default: ({ isOpen, onClose, onMerge, onAddAsNew }) => (
    isOpen ? (
      <div data-testid="duplicate-modal">
        <button onClick={onClose}>Close</button>
        <button onClick={() => onMerge(1, { name: 'Merged Item' })}>Merge</button>
        <button onClick={onAddAsNew}>Add as New</button>
      </div>
    ) : null
  )
}))

vi.mock('../SortableCategorySection.jsx', () => ({
  default: ({ category, items }) => (
    <div data-testid={`category-${category}`}>
      <h3>{category}</h3>
      {items.map(item => (
        <div key={item.id} data-testid={`item-${item.id}`}>
          {item.name}
        </div>
      ))}
    </div>
  )
}))

vi.mock('../ViewModeSelector.jsx', () => ({
  default: ({ currentView, onViewChange }) => (
    <div data-testid="view-mode-selector">
      <button onClick={() => onViewChange('category')}>Category</button>
      <button onClick={() => onViewChange('role')}>Role</button>
      <button onClick={() => onViewChange('grocery')}>Grocery</button>
      <span data-testid="current-view">{currentView}</span>
    </div>
  ),
  VIEW_MODES: {
    CATEGORY: { id: 'category' },
    ROLE: { id: 'role' },
    GROCERY: { id: 'grocery' }
  }
}))

vi.mock('../RoleStructuredView.jsx', () => ({
  default: ({ items }) => (
    <div data-testid="role-structured-view">
      {items.map(item => (
        <div key={item.id} data-testid={`role-item-${item.id}`}>
          {item.name}
        </div>
      ))}
    </div>
  )
}))

vi.mock('../GroceryStoreView.jsx', () => ({
  default: ({ items }) => (
    <div data-testid="grocery-store-view">
      {items.map(item => (
        <div key={item.id} data-testid={`grocery-item-${item.id}`}>
          {item.name}
        </div>
      ))}
    </div>
  )
}))

const mockShoppingListService = {
  getAllLists: vi.fn(),
  createList: vi.fn(),
  addItem: vi.fn(),
  updateItem: vi.fn(),
  deleteItem: vi.fn(),
  toggleItemChecked: vi.fn(),
  bulkUncheckItems: vi.fn()
}

const renderShoppingListPage = () => {
  return render(
    <BrowserRouter>
      <ShoppingListPage />
    </BrowserRouter>
  )
}

describe('ShoppingListPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    
    // Default mocks
    serviceSelector.getShoppingListService.mockResolvedValue(mockShoppingListService)
    mockShoppingListService.getAllLists.mockResolvedValue([
      { id: 1, name: 'My Shopping List' }
    ])
    mockShoppingListService.createList.mockResolvedValue({
      id: 1, name: 'My Shopping List'
    })
    
    useShoppingList.mockReturnValue({
      items: [
        { id: 1, name: 'Apple', category: 'Produce', checked: false },
        { id: 2, name: 'Milk', category: 'Dairy', checked: true }
      ],
      itemsByCategory: {
        'Produce': [{ id: 1, name: 'Apple', category: 'Produce', checked: false }],
        'Dairy': [{ id: 2, name: 'Milk', category: 'Dairy', checked: true }]
      },
      uncheckedItems: [{ id: 1, name: 'Apple', category: 'Produce', checked: false }],
      checkedItems: [{ id: 2, name: 'Milk', category: 'Dairy', checked: true }],
      isLoading: false,
      isConnected: false,
      totalItems: 2,
      checkedCount: 1,
      uncheckedCount: 1
    })
    
    detectCategory.mockReturnValue('Produce')
    findDuplicates.mockReturnValue([])
  })

  describe('Rendering', () => {
    it('should render shopping list page with current list', async () => {
      renderShoppingListPage()
      
      await waitFor(() => {
        expect(screen.getByText('My Shopping List')).toBeInTheDocument()
        expect(screen.getByText('2 items • 1 completed')).toBeInTheDocument()
      })
    })

    it('should show loading state initially', () => {
      useShoppingList.mockReturnValue({
        items: [],
        itemsByCategory: {},
        uncheckedItems: [],
        checkedItems: [],
        isLoading: true,
        isConnected: false,
        totalItems: 0,
        checkedCount: 0,
        uncheckedCount: 0
      })

      renderShoppingListPage()
      
      expect(screen.getByText('Loading shopping list...')).toBeInTheDocument()
    })

    it('should show empty state when no items', async () => {
      useShoppingList.mockReturnValue({
        items: [],
        itemsByCategory: {},
        uncheckedItems: [],
        checkedItems: [],
        isLoading: false,
        isConnected: false,
        totalItems: 0,
        checkedCount: 0,
        uncheckedCount: 0
      })

      renderShoppingListPage()
      
      await waitFor(() => {
        expect(screen.getByText('Your shopping list is empty')).toBeInTheDocument()
      })
    })
  })

  describe('Add Item Form', () => {
    it('should add item when form is submitted', async () => {
      mockShoppingListService.addItem.mockResolvedValue({
        id: 3, name: 'Banana', category: 'Produce', checked: false
      })

      renderShoppingListPage()
      
      await waitFor(() => {
        expect(screen.getByDisplayValue('')).toBeInTheDocument()
      })

      const nameInput = screen.getByPlaceholderText('Item name')
      const addButton = screen.getByText('Add Item')

      fireEvent.change(nameInput, { target: { value: 'Banana' } })
      fireEvent.click(addButton)

      await waitFor(() => {
        expect(mockShoppingListService.addItem).toHaveBeenCalledWith(1, {
          name: 'Banana',
          quantity: '',
          unit: '',
          category: 'Other'
        })
      })
    })

    it('should show error when item name is empty', async () => {
      renderShoppingListPage()
      
      await waitFor(() => {
        expect(screen.getByText('Add Item')).toBeInTheDocument()
      })

      const addButton = screen.getByText('Add Item')
      fireEvent.click(addButton)

      await waitFor(() => {
        expect(screen.getByText('Item name is required')).toBeInTheDocument()
      })
    })

    it('should auto-detect category when typing', async () => {
      detectCategory.mockReturnValue('Produce')
      
      renderShoppingListPage()
      
      await waitFor(() => {
        expect(screen.getByPlaceholderText('Item name')).toBeInTheDocument()
      })

      const nameInput = screen.getByPlaceholderText('Item name')
      fireEvent.change(nameInput, { target: { value: 'apple' } })

      expect(detectCategory).toHaveBeenCalledWith('apple')
    })

    it('should show duplicate detection modal when duplicates found', async () => {
      findDuplicates.mockReturnValue([
        { id: 1, name: 'Apple', similarity: 0.8 }
      ])

      renderShoppingListPage()
      
      await waitFor(() => {
        expect(screen.getByPlaceholderText('Item name')).toBeInTheDocument()
      })

      const nameInput = screen.getByPlaceholderText('Item name')
      const addButton = screen.getByText('Add Item')

      fireEvent.change(nameInput, { target: { value: 'Apple' } })
      fireEvent.click(addButton)

      await waitFor(() => {
        expect(screen.getByTestId('duplicate-modal')).toBeInTheDocument()
      })
    })
  })

  describe('View Mode Switching', () => {
    it('should show view mode selector when items exist', async () => {
      renderShoppingListPage()
      
      await waitFor(() => {
        expect(screen.getByTestId('view-mode-selector')).toBeInTheDocument()
      })
    })

    it('should switch to category view', async () => {
      renderShoppingListPage()
      
      await waitFor(() => {
        expect(screen.getByTestId('view-mode-selector')).toBeInTheDocument()
      })

      const categoryButton = screen.getByText('Category')
      fireEvent.click(categoryButton)

      expect(screen.getByTestId('current-view')).toHaveTextContent('category')
      expect(screen.getByTestId('category-Produce')).toBeInTheDocument()
    })

    it('should switch to role view', async () => {
      renderShoppingListPage()
      
      await waitFor(() => {
        expect(screen.getByTestId('view-mode-selector')).toBeInTheDocument()
      })

      const roleButton = screen.getByText('Role')
      fireEvent.click(roleButton)

      expect(screen.getByTestId('current-view')).toHaveTextContent('role')
      expect(screen.getByTestId('role-structured-view')).toBeInTheDocument()
    })

    it('should switch to grocery store view', async () => {
      renderShoppingListPage()
      
      await waitFor(() => {
        expect(screen.getByTestId('view-mode-selector')).toBeInTheDocument()
      })

      const groceryButton = screen.getByText('Grocery')
      fireEvent.click(groceryButton)

      expect(screen.getByTestId('current-view')).toHaveTextContent('grocery')
      expect(screen.getByTestId('grocery-store-view')).toBeInTheDocument()
    })
  })

  describe('List Management', () => {
    it('should handle list creation', async () => {
      renderShoppingListPage()
      
      await waitFor(() => {
        expect(screen.getByTestId('shopping-list-manager')).toBeInTheDocument()
      })

      const createButton = screen.getByText('Create List')
      fireEvent.click(createButton)

      await waitFor(() => {
        expect(screen.getByText('New List')).toBeInTheDocument()
      })
    })

    it('should handle list deletion', async () => {
      mockShoppingListService.getAllLists.mockResolvedValue([])
      
      renderShoppingListPage()
      
      await waitFor(() => {
        expect(screen.getByTestId('shopping-list-manager')).toBeInTheDocument()
      })

      const deleteButton = screen.getByText('Delete List')
      fireEvent.click(deleteButton)

      await waitFor(() => {
        expect(screen.getByText('Shopping list deleted successfully')).toBeInTheDocument()
      })
    })

    it('should handle list change', async () => {
      renderShoppingListPage()
      
      await waitFor(() => {
        expect(screen.getByTestId('shopping-list-manager')).toBeInTheDocument()
      })

      const changeButton = screen.getByText('Change List')
      fireEvent.click(changeButton)

      await waitFor(() => {
        expect(screen.getByText('Current List')).toBeInTheDocument()
      })
    })
  })

  describe('Duplicate Detection', () => {
    it('should handle merge items', async () => {
      findDuplicates.mockReturnValue([
        { id: 1, name: 'Apple', similarity: 0.8 }
      ])

      renderShoppingListPage()
      
      await waitFor(() => {
        expect(screen.getByPlaceholderText('Item name')).toBeInTheDocument()
      })

      const nameInput = screen.getByPlaceholderText('Item name')
      const addButton = screen.getByText('Add Item')

      fireEvent.change(nameInput, { target: { value: 'Apple' } })
      fireEvent.click(addButton)

      await waitFor(() => {
        expect(screen.getByTestId('duplicate-modal')).toBeInTheDocument()
      })

      const mergeButton = screen.getByText('Merge')
      fireEvent.click(mergeButton)

      await waitFor(() => {
        expect(mockShoppingListService.updateItem).toHaveBeenCalledWith(1, {
          name: 'Merged Item'
        })
      })
    })

    it('should handle add as new item', async () => {
      findDuplicates.mockReturnValue([
        { id: 1, name: 'Apple', similarity: 0.8 }
      ])

      renderShoppingListPage()
      
      await waitFor(() => {
        expect(screen.getByPlaceholderText('Item name')).toBeInTheDocument()
      })

      const nameInput = screen.getByPlaceholderText('Item name')
      const addButton = screen.getByText('Add Item')

      fireEvent.change(nameInput, { target: { value: 'Apple' } })
      fireEvent.click(addButton)

      await waitFor(() => {
        expect(screen.getByTestId('duplicate-modal')).toBeInTheDocument()
      })

      const addAsNewButton = screen.getByText('Add as New')
      fireEvent.click(addAsNewButton)

      await waitFor(() => {
        expect(mockShoppingListService.addItem).toHaveBeenCalled()
      })
    })
  })

  describe('Completed Items', () => {
    it('should show completed items section when items are checked', async () => {
      renderShoppingListPage()
      
      await waitFor(() => {
        expect(screen.getByText('Completed Items (1)')).toBeInTheDocument()
      })
    })

    it('should uncheck all items', async () => {
      mockShoppingListService.bulkUncheckItems.mockResolvedValue(true)
      
      renderShoppingListPage()
      
      await waitFor(() => {
        expect(screen.getByText('Uncheck All')).toBeInTheDocument()
      })

      const uncheckButton = screen.getByText('Uncheck All')
      fireEvent.click(uncheckButton)

      await waitFor(() => {
        expect(mockShoppingListService.bulkUncheckItems).toHaveBeenCalledWith(1)
        expect(screen.getByText('All items unchecked')).toBeInTheDocument()
      })
    })
  })

  describe('Connection Status', () => {
    it('should show real-time sync status when connected', async () => {
      useShoppingList.mockReturnValue({
        items: [],
        itemsByCategory: {},
        uncheckedItems: [],
        checkedItems: [],
        isLoading: false,
        isConnected: true,
        totalItems: 0,
        checkedCount: 0,
        uncheckedCount: 0
      })

      renderShoppingListPage()
      
      await waitFor(() => {
        expect(screen.getByText('Real-time sync active')).toBeInTheDocument()
      })
    })
  })
})
