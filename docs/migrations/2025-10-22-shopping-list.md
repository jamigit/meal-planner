# Migration: Shopping List Tables

## Overview
**Date**: 2025-10-22  
**Purpose**: Add persistent shopping list functionality with dual storage support  
**Scope**: Supabase and IndexedDB schema updates

## Why This Migration

### Business Need
- Users need persistent shopping lists separate from meal plan generation
- Support for collaborative shopping (real-time sync)
- Offline-first shopping list functionality
- Integration with existing meal planning workflow

### Technical Requirements
- Dual storage pattern (Supabase + IndexedDB)
- Real-time subscriptions for collaboration
- Category-based organization
- CRUD operations with proper validation

## Migration Details

### Supabase Changes
**File**: `SUPABASE_SHOPPING_LIST_MIGRATION.sql`

#### New Tables
```sql
-- Shopping lists (one per user)
CREATE TABLE shopping_lists (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL DEFAULT 'My Shopping List',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Shopping list items
CREATE TABLE shopping_list_items (
  id SERIAL PRIMARY KEY,
  shopping_list_id INTEGER REFERENCES shopping_lists(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  quantity TEXT,
  unit TEXT,
  category TEXT NOT NULL DEFAULT 'Other',
  checked BOOLEAN DEFAULT FALSE,
  checked_at TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### Indexes
```sql
CREATE INDEX idx_shopping_lists_user_id ON shopping_lists(user_id);
CREATE INDEX idx_shopping_list_items_shopping_list_id ON shopping_list_items(shopping_list_id);
CREATE INDEX idx_shopping_list_items_user_id ON shopping_list_items(user_id);
CREATE INDEX idx_shopping_list_items_category ON shopping_list_items(category);
CREATE INDEX idx_shopping_list_items_checked ON shopping_list_items(checked);
```

#### Row Level Security
```sql
ALTER TABLE shopping_lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE shopping_list_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can only see their own shopping lists" ON shopping_lists
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can only see their own shopping list items" ON shopping_list_items
  FOR ALL USING (auth.uid() = user_id);
```

#### Real-time Support
```sql
ALTER PUBLICATION supabase_realtime ADD TABLE shopping_list_items;
```

### IndexedDB Changes
**File**: `src/database/db.js`

#### Version 9 Schema
```javascript
this.version(9).stores({
  recipes: '++id, name, url, tags, cuisine_tags, ingredient_tags, convenience_tags, ingredients, instructions, prep_time, cook_time, servings, created_at, updated_at',
  weeklyPlans: '++id, meals, notes, name, is_current, created_at',
  mealHistory: '++id, recipe_id, week_date, eaten_date, created_at',
  shoppingLists: '++id, weekly_plan_id, items, created_at', // legacy
  persistentShoppingLists: '++id, name, created_at, updated_at',
  persistentShoppingListItems: '++id, shopping_list_id, name, quantity, unit, category, checked, checked_at, notes, created_at, updated_at'
})
```

## How to Run

### Supabase Migration
1. **Connect to Supabase**: Open Supabase SQL Editor
2. **Run Migration**: Copy and paste `SUPABASE_SHOPPING_LIST_MIGRATION.sql`
3. **Verify Tables**: Check that tables were created successfully
4. **Test RLS**: Verify row-level security policies work
5. **Test Real-time**: Verify real-time subscriptions work

### IndexedDB Migration
1. **Build App**: Run `npm run build`
2. **Open App**: Navigate to the application
3. **Check Console**: Verify Version 9 migration ran
4. **Test Functionality**: Test shopping list features

### Verification Steps
```sql
-- Check tables exist
SELECT table_name FROM information_schema.tables 
WHERE table_name IN ('shopping_lists', 'shopping_list_items');

-- Check RLS policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename IN ('shopping_lists', 'shopping_list_items');

-- Check real-time publication
SELECT * FROM pg_publication_tables WHERE pubname = 'supabase_realtime';
```

## Rollback Plan

### Supabase Rollback
```sql
-- Remove real-time support
ALTER PUBLICATION supabase_realtime DROP TABLE shopping_list_items;

-- Drop policies
DROP POLICY IF EXISTS "Users can only see their own shopping list items" ON shopping_list_items;
DROP POLICY IF EXISTS "Users can only see their own shopping lists" ON shopping_lists;

-- Drop tables (CASCADE will handle foreign keys)
DROP TABLE IF EXISTS shopping_list_items CASCADE;
DROP TABLE IF EXISTS shopping_lists CASCADE;
```

### IndexedDB Rollback
1. **Revert Code**: Revert to previous version of `src/database/db.js`
2. **Clear Data**: Clear IndexedDB in browser DevTools
3. **Rebuild**: Run `npm run build` and refresh

## Data Impact

### New Data Structures
- **Shopping Lists**: User-owned persistent lists
- **Shopping List Items**: Individual items with categories
- **Categories**: Produce, Meat & Seafood, Dairy & Eggs, etc.

### Data Relationships
- `shopping_lists.user_id` → `auth.users.id`
- `shopping_list_items.shopping_list_id` → `shopping_lists.id`
- `shopping_list_items.user_id` → `auth.users.id`

### Data Migration
- **No existing data**: This is a new feature
- **Legacy shopping lists**: Existing `shoppingLists` table remains for meal plan generation
- **New persistent lists**: Separate from meal plan generation

## Testing

### Manual Testing
1. **Create Shopping List**: Test list creation
2. **Add Items**: Test item addition with categories
3. **Real-time Sync**: Test real-time updates across devices
4. **Offline Functionality**: Test offline operations
5. **Import from Meal Plan**: Test meal plan import functionality

### Automated Testing
```javascript
// Test shopping list service
describe('ShoppingListService', () => {
  it('should create shopping list', async () => {
    const list = await shoppingListService.getShoppingList()
    expect(list.name).toBe('My Shopping List')
  })
  
  it('should add items to list', async () => {
    const item = await shoppingListService.addItem(listId, {
      name: 'Test Item',
      category: 'Produce'
    })
    expect(item.name).toBe('Test Item')
  })
})
```

## Performance Considerations

### Indexing Strategy
- **User-based queries**: Index on `user_id`
- **List-based queries**: Index on `shopping_list_id`
- **Category filtering**: Index on `category`
- **Checked status**: Index on `checked`

### Real-time Performance
- **Selective subscriptions**: Only subscribe to user's data
- **Efficient updates**: Minimal data transfer
- **Connection management**: Proper cleanup of subscriptions

## Security Considerations

### Row Level Security
- **User isolation**: Users can only see their own data
- **Cascade deletes**: Proper cleanup when user is deleted
- **Input validation**: All inputs validated before storage

### Data Privacy
- **No sensitive data**: Only shopping list items
- **User control**: Users own their data
- **Secure transmission**: HTTPS for all communications

## Monitoring

### Success Metrics
- **Migration completion**: All tables created successfully
- **RLS functionality**: Security policies working
- **Real-time sync**: Live updates working
- **Performance**: Acceptable response times

### Error Monitoring
- **Migration failures**: Track any migration issues
- **RLS violations**: Monitor security policy violations
- **Real-time errors**: Track subscription failures
- **Performance issues**: Monitor slow queries
