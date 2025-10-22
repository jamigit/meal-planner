# Data Models & Schema

## Supabase Tables

### recipes
```sql
CREATE TABLE recipes (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  url TEXT,
  ingredients TEXT[],
  instructions TEXT[],
  prep_time INTEGER,
  cook_time INTEGER,
  servings INTEGER,
  cuisine_tags TEXT[],
  ingredient_tags TEXT[],
  convenience_tags TEXT[],
  tags TEXT[], -- legacy field
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### weekly_plans
```sql
CREATE TABLE weekly_plans (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  meals JSONB NOT NULL,
  notes TEXT,
  name TEXT,
  is_current BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### meal_history
```sql
CREATE TABLE meal_history (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  recipe_id INTEGER REFERENCES recipes(id) ON DELETE CASCADE,
  week_date DATE NOT NULL,
  eaten_date DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### shopping_lists
```sql
CREATE TABLE shopping_lists (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL DEFAULT 'My Shopping List',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### shopping_list_items
```sql
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

## IndexedDB Schema (Dexie)

### Database Versions
- **Version 1-7**: Legacy versions with various schema changes
- **Version 8**: Migration to boolean `is_current` and added `name` field
- **Version 9**: Added persistent shopping list tables

### Tables Structure
```javascript
// Version 9 schema
this.version(9).stores({
  recipes: '++id, name, url, tags, cuisine_tags, ingredient_tags, convenience_tags, ingredients, instructions, prep_time, cook_time, servings, created_at, updated_at',
  weeklyPlans: '++id, meals, notes, name, is_current, created_at',
  mealHistory: '++id, recipe_id, week_date, eaten_date, created_at',
  shoppingLists: '++id, weekly_plan_id, items, created_at', // legacy
  persistentShoppingLists: '++id, name, created_at, updated_at',
  persistentShoppingListItems: '++id, shopping_list_id, name, quantity, unit, category, checked, checked_at, notes, created_at, updated_at'
})
```

## Field Mapping & Naming Conventions

### Supabase → IndexedDB Field Mapping
| Supabase (snake_case) | IndexedDB (camelCase) | Type | Notes |
|----------------------|----------------------|------|-------|
| `user_id` | N/A | UUID | IndexedDB doesn't store user_id |
| `created_at` | `created_at` | TIMESTAMPTZ | ISO string |
| `updated_at` | `updated_at` | TIMESTAMPTZ | ISO string |
| `is_current` | `is_current` | BOOLEAN | Migrated from integer |
| `cuisine_tags` | `cuisine_tags` | TEXT[] | Array of strings |
| `ingredient_tags` | `ingredient_tags` | TEXT[] | Array of strings |
| `convenience_tags` | `convenience_tags` | TEXT[] | Array of strings |

### Data Type Consistency
- **Timestamps**: Always ISO strings (`new Date().toISOString()`)
- **Booleans**: Always `true`/`false` (never 0/1)
- **Arrays**: Always arrays (never null, use `[]` for empty)
- **Strings**: Use `null` for optional fields, never empty strings

## Row Level Security (RLS)

### Policies Applied
```sql
-- All tables follow this pattern
CREATE POLICY "Users can only see their own data" ON table_name
  FOR ALL USING (auth.uid() = user_id);
```

### Tables with RLS
- `recipes` - Users see only their recipes
- `weekly_plans` - Users see only their plans
- `meal_history` - Users see only their history
- `shopping_lists` - Users see only their lists
- `shopping_list_items` - Users see only their items

## Migration History

### Key Migrations
1. **Tag System Overhaul**: Added categorized tags (`cuisine_tags`, `ingredient_tags`, `convenience_tags`)
2. **Weekly Plan Schema**: Added `name` field and migrated `is_current` to boolean
3. **Shopping List Addition**: Added persistent shopping list tables
4. **Real-time Support**: Enabled postgres_changes for shopping_list_items

### Migration Files
- `SUPABASE_SHOPPING_LIST_MIGRATION.sql` - Shopping list tables and policies
- `src/database/db.js` - IndexedDB version upgrades and migrations

## Data Validation

### Validation Utilities
- `src/utils/schemaValidation.js` - Field validation functions
- `src/utils/dataValidation.js` - Comprehensive data validation
- `validateRecipe()` - Recipe-specific validation

### Validation Rules
```javascript
// Example validation patterns
const name = validateStringField(recipe.name, 'name', true) // required
const url = validateStringField(recipe.url, 'url', false)   // optional
const tags = validateArrayField(recipe.tags, 'tags')        // array
const time = validateNumericField(recipe.prep_time, 'prep_time') // number
```

## Service Layer Data Flow

### Normalization Pattern
```javascript
// All services normalize data before storage
normalizeRecipe(recipe) {
  return {
    ...recipe,
    tags: validateArrayField(recipe.tags, 'tags'),
    cuisine_tags: validateArrayField(recipe.cuisine_tags, 'cuisine_tags'),
    ingredients: validateArrayField(recipe.ingredients, 'ingredients'),
    prep_time: validateNumericField(recipe.prep_time, 'prep_time'),
    // ... other fields
  }
}
```

### Error Handling
- **Validation Errors**: Thrown with descriptive messages
- **Database Errors**: Logged and re-thrown with context
- **Network Errors**: Handled with retry logic and fallbacks
