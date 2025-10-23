# Shopping List Feature

## Overview
The Shopping List feature provides persistent shopping lists with real-time sync, category grouping, and meal plan import functionality. It follows the dual storage architecture pattern used throughout the application.

## Architecture

### Dual Storage Pattern
- **Supabase**: For authenticated users with real-time subscriptions
- **IndexedDB**: For guest users with offline capability
- **Service Selector**: Automatically routes to appropriate storage

### Data Models
```javascript
// Shopping List
{
  id: number,
  name: string,
  created_at: string,
  updated_at: string
}

// Shopping List Item
{
  id: number,
  shopping_list_id: number,
  name: string,
  quantity: string,
  unit: string,
  category: string,
  checked: boolean,
  checked_at: string,
  notes: string,
  created_at: string,
  updated_at: string
}
```

## Components

### Main Components
- **ShoppingListPage**: Main shopping list interface
- **ImportShoppingListModal**: Import items from meal plan
- **ShoppingListCard**: Display shopping list items
- **MultiSelectDropdown**: Tag selection for filtering

### Service Layer
- **SupabaseShoppingListService**: Supabase operations
- **ShoppingListService**: IndexedDB operations
- **Service Selector**: Routes to appropriate service

### Hooks
- **useShoppingListRealtime**: Real-time subscriptions for Supabase

## Features

### Core Functionality
- **Create Lists**: Multiple shopping lists per user
- **Add Items**: Add items with automatic categorization
- **Edit Items**: Inline editing of item names and details
- **Check Items**: Mark items as completed
- **Delete Items**: Remove items from lists
- **Category Grouping**: Items organized by category

### Advanced Features
- **Real-time Sync**: Live updates across devices (Supabase)
- **Meal Plan Import**: Import from generated meal plan shopping lists
- **Category Detection**: Automatic categorization based on item names
- **Completed Items**: Collapsible section for checked items
- **Notes**: Optional notes for items

### User Experience
- **Responsive Design**: Mobile-friendly interface
- **Loading States**: Clear feedback during operations
- **Error Handling**: Graceful error recovery
- **Offline Support**: Full functionality without internet

## Implementation Details

### Service Layer
```javascript
// Service interface
class ShoppingListService {
  async getAllLists()           // Get all shopping lists
  async getListById(id)        // Get specific list
  async addList(name)          // Create new list
  async updateList(id, data)   // Update list
  async deleteList(id)         // Delete list
  async getAllItems(listId)    // Get all items for list
  async addItem(listId, item)  // Add item to list
  async updateItem(id, data)   // Update item
  async deleteItem(id)         // Delete item
  async bulkAddItems(listId, items) // Add multiple items
  async checkItem(id, checked) // Check/uncheck item
}
```

### Real-time Subscriptions
```javascript
// Real-time updates for Supabase
const { changes } = useShoppingListRealtime(listId)

useEffect(() => {
  if (changes) {
    // Handle real-time updates
    if (changes.eventType === 'INSERT') {
      // Add new item
    } else if (changes.eventType === 'UPDATE') {
      // Update existing item
    } else if (changes.eventType === 'DELETE') {
      // Remove item
    }
  }
}, [changes])
```

### Category System
```javascript
// Categories reused from existing shoppingListService
const categories = {
  'Produce': ['apple', 'banana', 'lettuce', 'tomato'],
  'Meat & Seafood': ['chicken', 'beef', 'fish', 'salmon'],
  'Dairy & Eggs': ['milk', 'cheese', 'eggs', 'yogurt'],
  'Pantry': ['rice', 'pasta', 'flour', 'sugar'],
  'Other': [] // fallback category
}

// Automatic categorization
function getCategoryForItem(itemName) {
  for (const [category, keywords] of Object.entries(categories)) {
    if (keywords.some(keyword => itemName.toLowerCase().includes(keyword))) {
      return category
    }
  }
  return 'Other'
}
```

## Data Flow

### Adding Items
1. User enters item name
2. Category automatically detected
3. Item added to active list
4. Real-time update sent (Supabase)
5. UI updated with new item

### Importing from Meal Plan
1. User clicks "Add to Shopping List" on meal plan
2. Import modal opens with generated items
3. User selects items to import
4. Items added to selected shopping list
5. Success feedback shown

### Real-time Sync
1. User adds item on Device A
2. Supabase subscription triggers on Device B
3. Item appears on Device B automatically
4. No manual refresh needed

## Error Handling

### Common Error Scenarios
- **Network Errors**: Graceful fallback to offline mode
- **Validation Errors**: Clear error messages for invalid data
- **Permission Errors**: Proper handling of RLS violations
- **Sync Errors**: Retry logic for failed sync operations

### Error Recovery
```javascript
// Error handling pattern
try {
  await shoppingListService.addItem(listId, item)
} catch (error) {
  if (error.code === 'NETWORK_ERROR') {
    // Queue for retry when online
    offlineQueue.add(() => shoppingListService.addItem(listId, item))
  } else {
    // Show user-friendly error message
    setError('Failed to add item. Please try again.')
  }
}
```

## Performance Considerations

### Optimization Strategies
- **Lazy Loading**: Load items on demand
- **Virtual Scrolling**: Handle large lists efficiently
- **Debounced Updates**: Prevent excessive API calls
- **Caching**: Cache frequently accessed data

### Real-time Performance
- **Selective Subscriptions**: Only subscribe to user's data
- **Efficient Updates**: Minimal data transfer
- **Connection Management**: Proper cleanup of subscriptions

## Testing

### Test Coverage
- **Unit Tests**: Service layer methods
- **Integration Tests**: Real-time sync functionality
- **Component Tests**: UI interactions
- **E2E Tests**: Complete user workflows

### Test Scenarios
- **CRUD Operations**: Create, read, update, delete lists and items
- **Real-time Sync**: Multi-device synchronization
- **Offline Functionality**: Operations without internet
- **Import Flow**: Meal plan to shopping list import
- **Error Handling**: Network and validation errors

## View Modes

The shopping list supports three different view modes to organize items based on different needs:

### Category View (Default)
- Groups items by grocery store categories (Produce, Meat & Seafood, Dairy & Eggs, etc.)
- Traditional shopping list organization
- Drag-and-drop reordering within categories
- Automatic category detection when adding items

### Role View
- Organizes items by meal planning roles (Breakfast, Lunch, Dinner, Snacks, General)
- Useful for meal-focused shopping
- Requires `meal_role` field in database schema
- Items can be assigned to specific meal types

### Grocery Store View
- Organized by typical grocery store layout
- Optimized for efficient in-store shopping
- Sections follow common store arrangement
- Helps reduce backtracking while shopping

## Testing Strategy

### Unit Tests
- **Service Layer**: CRUD operations for both Supabase and IndexedDB
- **Real-time Hooks**: Subscription lifecycle and event handling
- **Component Tests**: UI interactions and view mode switching
- **View Components**: Role and grocery store view rendering

### Integration Tests
- **Dual Storage**: Verify service selector routes correctly
- **Real-time Sync**: Multi-device synchronization
- **View Mode Switching**: All three views render correctly
- **Mobile PWA**: Touch event handling and item selection

### Manual Test Checklist
- [ ] Guest user CRUD operations (IndexedDB)
- [ ] Auth user CRUD operations (Supabase)
- [ ] Real-time sync across browser tabs
- [ ] Drag-and-drop persistence
- [ ] Switch between Category, Role, and Grocery Store views
- [ ] View mode tabs display correctly
- [ ] Duplicate detection prevents duplicates
- [ ] Import from meal plan
- [ ] Unit conversion widget
- [ ] AI suggestion widget
- [ ] Offline functionality
- [ ] Delete list switches to another list correctly
- [ ] Mobile PWA item selection works properly

## Troubleshooting

### Common Issues

#### Mobile PWA Item Selection Not Working
- **Cause**: Touch events interfering with drag-and-drop
- **Solution**: Added `touchAction: 'manipulation'` and `onTouchEnd` handlers
- **Verification**: Test checkbox selection on mobile devices

#### View Modes Not Showing
- **Cause**: ViewModeSelector not rendering or view mode not switching
- **Solution**: Ensure ViewModeSelector is added after Add Item Form section
- **Verification**: Check that view mode buttons are visible and functional

#### Real-time Sync Not Working
- **Cause**: Supabase not configured or user not authenticated
- **Solution**: Check Supabase configuration and authentication status
- **Verification**: Look for "Real-time sync active" message

#### Database Migration Issues
- **Cause**: IndexedDB version not updated or Supabase migration not run
- **Solution**: Run IndexedDB Version 11 migration and Supabase meal_role migration
- **Verification**: Check browser DevTools for IndexedDB version and run migration SQL

### Performance Considerations
- **Large Lists**: Consider pagination for lists with 100+ items
- **Real-time Updates**: Monitor subscription count to avoid memory leaks
- **Mobile Performance**: Touch events optimized for mobile devices

## Future Enhancements

### Planned Features
- **Drag-and-Drop**: Reorder items within lists ✅ COMPLETED
- **Smart Duplicates**: Detect and merge similar items ✅ COMPLETED
- **Unit Conversion**: Convert between measurement units ✅ COMPLETED
- **View Modes**: Category, Role, and Grocery Store views ✅ COMPLETED
- **Recipe Linking**: Link items back to source recipes
- **AI Categorization**: AI-powered item categorization ✅ COMPLETED

### Technical Improvements
- **Fractional Indexing**: Maintain item order without gaps
- **Batch Operations**: Efficient bulk operations
- **Advanced Search**: Search across all lists
- **Export Options**: Export lists to various formats

## Usage Examples

### Basic Usage
```javascript
// Get shopping list service
const shoppingListService = await serviceSelector.getShoppingListService()

// Create new list
const list = await shoppingListService.addList('Weekly Groceries')

// Add item
const item = await shoppingListService.addItem(list.id, {
  name: '2 apples',
  category: 'Produce'
})

// Check item
await shoppingListService.checkItem(item.id, true)
```

### Real-time Updates
```javascript
// Subscribe to real-time updates
const { changes } = useShoppingListRealtime(listId)

useEffect(() => {
  if (changes) {
    // Handle real-time changes
    fetchItems(listId) // Refresh items
  }
}, [changes])
```

### Import from Meal Plan
```javascript
// Import items from meal plan
const importModal = (
  <ImportShoppingListModal
    isOpen={showImport}
    onClose={() => setShowImport(false)}
    generatedList={mealPlanShoppingList}
    onImportComplete={(count) => {
      setSuccess(`Imported ${count} items`)
    }}
  />
)
```
