# AI Meal Planner V2

## Overview
AI Meal Planner V2 is an intelligent meal planning tool that uses Claude AI to suggest 8 meals based on user preferences, meal history, and recipe variety. It provides a modern, user-friendly interface for meal planning with advanced filtering and selection capabilities.

## Architecture

### AI Service Integration
- **Node.js Proxy**: Local development server on port 3002
- **Netlify Functions**: Production deployment
- **Claude API**: AI-powered meal suggestions
- **Caching**: 15-minute cache for identical requests
- **Rate Limiting**: 10 requests per minute per user

### Component Structure
```
MealPlannerV2/
├── MealPlannerV2.jsx          # Main component
├── PreferenceSelector.jsx      # Tag selection interface
├── MealSuggestions.jsx        # AI-generated suggestions
├── SelectedMeals.jsx          # User-selected meals
├── ImportModal.jsx            # Shopping list import
└── BrowseRecipesModal.jsx     # Recipe browser
```

## Features

### Core Functionality
- **AI Suggestions**: 8 intelligent meal suggestions
- **Preference Filtering**: Cuisine, ingredient, convenience, dietary tags
- **Meal Selection**: Add/remove meals from suggestions
- **Recipe Browser**: Browse all available recipes
- **Shopping List Import**: Import generated shopping list
- **Save & Email**: Save plans and send via email

### Advanced Features
- **Meal History Integration**: Considers frequently/rarely eaten meals
- **Smart Filtering**: OR logic for expanded search space
- **State Persistence**: Maintains state across navigation
- **Real-time Updates**: Live updates for authenticated users
- **Responsive Design**: Mobile-optimized interface

### User Experience
- **Tabbed Interface**: Selected Meals and Ingredients tabs
- **Visual Feedback**: Clear success/error states
- **Loading States**: Smooth loading animations
- **Accessibility**: Full keyboard navigation and screen reader support

## Implementation Details

### AI Prompt Strategy
```javascript
const systemPrompt = `
You are a meal planning assistant. Select 8 meals from the recipe list that:
1. Include 2 from the most common meals (based on meal history)
2. Include 2 from the least eaten meals (based on meal history)  
3. Include 4 that are otherwise randomly chosen
4. Provide variety in cuisine types and cooking methods
5. Consider user preferences when provided

Return ONLY a JSON array of recipe names, no other text.
`

const userPrompt = `
Recipe List: ${recipeNames.join(', ')}
User Preferences: ${preferences.join(', ')}
Meal History: ${mealHistorySummary}
`
```

### Preference System
```javascript
// Tag categories for filtering
const tagCategories = {
  cuisine_tags: ['Italian', 'Asian', 'Mexican', 'American', 'Mediterranean'],
  ingredient_tags: ['Chicken', 'Beef', 'Fish', 'Vegetarian', 'Pasta'],
  convenience_tags: ['Quick', 'One-Pot', 'Make-Ahead', 'Freezer-Friendly'],
  dietary_tags: ['Gluten-Free', 'Dairy-Free', 'Low-Carb', 'High-Protein']
}

// OR logic for expanded search
const selectedPreferences = [
  ...selectedCuisineTags,
  ...selectedIngredientTags,
  ...selectedConvenienceTags,
  ...selectedDietaryTags
]
```

### State Management
```javascript
// Persistent state across navigation
const [state, setState] = useState(() => {
  const saved = localStorage.getItem('mealPlannerV2State')
  return saved ? JSON.parse(saved) : initialState
})

useEffect(() => {
  localStorage.setItem('mealPlannerV2State', JSON.stringify(state))
}, [state])
```

### Real-time Integration
```javascript
// Real-time updates for authenticated users
const { changes } = useRealtime('recipes')

useEffect(() => {
  if (changes) {
    // Refresh recipes when data changes
    fetchRecipes()
  }
}, [changes])
```

## Data Flow

### Meal Suggestion Flow
1. User selects preferences and clicks "Suggest Meals"
2. Component calls `aiMealPlannerService.generateEightMealSuggestions()`
3. Service detects environment (dev vs prod)
4. Makes request to appropriate AI endpoint
5. AI returns 8 recipe names with reasoning
6. Component fetches full recipe data
7. UI displays suggestions with recipe cards

### Meal Selection Flow
1. User clicks "Add" on suggested meal
2. Recipe added to selected meals list
3. Button changes to green with checkmark
4. Real-time update sent (Supabase)
5. UI updates with new selection

### Save Flow
1. User clicks "Save Plan"
2. Plan saved to weekly plans
3. Success animation shown
4. User redirected to plans page
5. State cleared from localStorage

## Component Details

### MealPlannerV2.jsx
```javascript
// Main component structure
function MealPlannerV2() {
  const [suggestions, setSuggestions] = useState([])
  const [selectedMeals, setSelectedMeals] = useState([])
  const [preferences, setPreferences] = useState({
    cuisine_tags: [],
    ingredient_tags: [],
    convenience_tags: [],
    dietary_tags: []
  })
  
  // AI suggestion handler
  const handleSuggestMeals = async () => {
    const aiSuggestions = await aiMealPlannerService.generateEightMealSuggestions(
      recipes,
      preferences,
      mealHistory
    )
    setSuggestions(aiSuggestions)
  }
  
  // Meal selection handler
  const handleAddMeal = (recipe) => {
    setSelectedMeals(prev => [...prev, recipe])
  }
  
  return (
    <PageContainer>
      <PageHeader title="AI Meal Planner" showHeroImage={true} />
      
      <PreferenceSelector 
        preferences={preferences}
        onChange={setPreferences}
      />
      
      <MealSuggestions 
        suggestions={suggestions}
        onAddMeal={handleAddMeal}
      />
      
      <SelectedMeals 
        meals={selectedMeals}
        onRemoveMeal={handleRemoveMeal}
      />
    </PageContainer>
  )
}
```

### PreferenceSelector.jsx
```javascript
// Multi-select dropdown for preferences
function PreferenceSelector({ preferences, onChange }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <MultiSelectDropdown
        label="Cuisines"
        options={cuisineTags}
        selectedValues={preferences.cuisine_tags}
        onChange={(values) => onChange(prev => ({
          ...prev,
          cuisine_tags: values
        }))}
      />
      
      <MultiSelectDropdown
        label="Ingredients"
        options={ingredientTags}
        selectedValues={preferences.ingredient_tags}
        onChange={(values) => onChange(prev => ({
          ...prev,
          ingredient_tags: values
        }))}
      />
      
      {/* Additional dropdowns... */}
    </div>
  )
}
```

### MealSuggestions.jsx
```javascript
// AI-generated meal suggestions
function MealSuggestions({ suggestions, onAddMeal }) {
  return (
    <div className="space-y-4">
      {suggestions.map(recipe => (
        <div key={recipe.id} className="bg-white p-4 rounded-lg shadow-sm">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="text-h5 font-heading font-black text-text-primary">
                {recipe.name}
              </h3>
              <div className="flex gap-2 mt-2">
                {recipe.cuisine_tags?.map(tag => (
                  <span key={tag} className="tag tag-cuisine">{tag}</span>
                ))}
                {recipe.convenience_tags?.map(tag => (
                  <span key={tag} className="tag tag-convenience">{tag}</span>
                ))}
              </div>
              <div className="text-sm text-text-secondary mt-1">
                Prep: {recipe.prep_time}min | Cook: {recipe.cook_time}min
              </div>
            </div>
            
            <Button
              onClick={() => onAddMeal(recipe)}
              variant="primary"
              size="sm"
            >
              Add
            </Button>
          </div>
        </div>
      ))}
    </div>
  )
}
```

## Error Handling

### AI Service Errors
```javascript
// Error handling for AI suggestions
try {
  const suggestions = await aiMealPlannerService.generateEightMealSuggestions(
    recipes,
    preferences,
    mealHistory
  )
  setSuggestions(suggestions)
} catch (error) {
  if (error.code === 'RATE_LIMIT_EXCEEDED') {
    setError('Too many requests. Please wait a minute and try again.')
  } else if (error.code === 'NETWORK_ERROR') {
    setError('Network error. Please check your connection.')
  } else {
    setError('Failed to generate suggestions. Please try again.')
  }
}
```

### Fallback Suggestions
```javascript
// Fallback when AI is unavailable
const generateFallbackSuggestions = (recipes, preferences) => {
  const filteredRecipes = recipes.filter(recipe => {
    const tags = [
      ...recipe.cuisine_tags,
      ...recipe.ingredient_tags,
      ...recipe.convenience_tags,
      ...recipe.dietary_tags
    ]
    return preferences.some(pref => tags.includes(pref))
  })
  
  return filteredRecipes.slice(0, 8)
}
```

## Performance Optimization

### Caching Strategy
- **AI Responses**: 15-minute cache for identical requests
- **Recipe Data**: Cached in component state
- **Meal History**: Cached for AI context

### Request Optimization
- **Debounced Requests**: Prevent excessive AI calls
- **Request Deduplication**: Avoid duplicate simultaneous requests
- **Timeout Management**: 30-second timeout for AI requests

## Testing

### Test Scenarios
- **AI Integration**: Mock AI responses and test parsing
- **Preference Filtering**: Test tag selection and filtering
- **Meal Selection**: Test add/remove meal functionality
- **State Persistence**: Test localStorage state management
- **Error Handling**: Test various error scenarios

### Mock Data
```javascript
const mockSuggestions = [
  'Spaghetti Carbonara',
  'Chicken Tikka Masala',
  'Beef Stir Fry',
  'Vegetable Curry',
  'Fish Tacos',
  'Pasta Primavera',
  'Chicken Teriyaki',
  'Lentil Soup'
]

const mockRecipes = [
  {
    id: 1,
    name: 'Spaghetti Carbonara',
    cuisine_tags: ['Italian'],
    convenience_tags: ['Quick'],
    prep_time: 10,
    cook_time: 15
  }
  // ... more mock recipes
]
```

## Future Enhancements

### Planned Features
- **Advanced AI**: More sophisticated meal planning logic
- **Nutritional Analysis**: AI-powered nutritional information
- **Seasonal Suggestions**: Time-based meal suggestions
- **Dietary Restrictions**: Advanced dietary filtering
- **Meal Prep Integration**: Suggestions for meal prep

### Technical Improvements
- **Batch Processing**: Process multiple requests efficiently
- **Advanced Caching**: More sophisticated caching strategies
- **Real-time Collaboration**: Share meal plans with others
- **Analytics**: Track meal planning patterns and preferences
