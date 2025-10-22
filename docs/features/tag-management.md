# Tag Management System

## Overview
The Tag Management System provides comprehensive tag taxonomy, analytics, and management tools for recipes. It includes AI-powered auto-tagging, manual tag management, and usage analytics to help users organize and discover recipes effectively.

## Architecture

### Tag Categories
The system uses a structured 4-category taxonomy:

```javascript
const tagCategories = {
  cuisine_tags: [
    'Italian', 'Asian', 'Mexican', 'American', 'Mediterranean',
    'Indian', 'Thai', 'Chinese', 'Japanese', 'French'
  ],
  ingredient_tags: [
    'Chicken', 'Beef', 'Fish', 'Vegetarian', 'Pasta',
    'Rice', 'Potato', 'Tomato', 'Cheese', 'Seafood'
  ],
  convenience_tags: [
    'Quick', 'One-Pot', 'Make-Ahead', 'Freezer-Friendly',
    'Slow Cooker', 'Instant Pot', 'Sheet Pan', 'No-Cook'
  ],
  dietary_tags: [
    'Gluten-Free', 'Dairy-Free', 'Low-Carb', 'High-Protein',
    'Vegan', 'Keto', 'Paleo', 'Low-Sodium'
  ]
}
```

### Component Structure
```
TagManagement/
├── TagManagement.jsx          # Main tag management interface
├── TagAnalytics.jsx           # Usage analytics and insights
├── TagEditor.jsx              # Individual tag editing
├── TagMerge.jsx               # Tag merging functionality
└── TagUsage.jsx               # Tag usage statistics
```

## Features

### Core Functionality
- **Tag CRUD**: Create, read, update, delete tags
- **Tag Analytics**: Usage statistics and insights
- **Tag Merging**: Combine similar tags
- **Bulk Operations**: Manage multiple tags at once
- **Tag Validation**: Ensure tag consistency

### AI Integration
- **Auto-Tagging**: AI-powered tag suggestions
- **Smart Fallbacks**: Keyword-based suggestions when AI unavailable
- **Tag Optimization**: AI suggests optimal tag combinations
- **Learning System**: Improves suggestions based on user corrections

### User Experience
- **Visual Interface**: Clear tag management UI
- **Search & Filter**: Find tags quickly
- **Usage Insights**: See which tags are most/least used
- **Bulk Actions**: Efficient tag management

## Implementation Details

### Tag Management Service
```javascript
class TagManagementService {
  async getAllTags() {
    // Get all tags across all categories
  }
  
  async getTagsByCategory(category) {
    // Get tags for specific category
  }
  
  async addTag(category, name) {
    // Add new tag to category
  }
  
  async updateTag(tagId, updates) {
    // Update existing tag
  }
  
  async deleteTag(tagId) {
    // Delete tag and update all recipes
  }
  
  async mergeTags(sourceTagId, targetTagId) {
    // Merge two tags
  }
}
```

### AI Auto-Tagging
```javascript
// AI-powered tag suggestions
const suggestTagsForRecipe = async (recipeData) => {
  const prompt = `
    Analyze this recipe and suggest tags from these categories:
    
    Cuisine Tags: ${cuisineTags.join(', ')}
    Ingredient Tags: ${ingredientTags.join(', ')}
    Convenience Tags: ${convenienceTags.join(', ')}
    Dietary Tags: ${dietaryTags.join(', ')}
    
    Recipe: ${recipeData.name}
    Ingredients: ${recipeData.ingredients.join(', ')}
    Instructions: ${recipeData.instructions.join(' ')}
    
    Select maximum 3 tags total, ideally 1-2 from each category.
    Return JSON: {"cuisine_tags": [], "ingredient_tags": [], "convenience_tags": [], "dietary_tags": []}
  `
  
  try {
    const response = await claudeAPI.generateText(prompt)
    return JSON.parse(response)
  } catch (error) {
    // Fallback to keyword detection
    return generateFallbackTags(recipeData)
  }
}
```

### Tag Analytics
```javascript
// Tag usage analytics
class TagAnalytics {
  async getTagUsageStats() {
    const recipes = await recipeService.getAll()
    const stats = {}
    
    recipes.forEach(recipe => {
      const tags = [
        ...recipe.cuisine_tags,
        ...recipe.ingredient_tags,
        ...recipe.convenience_tags,
        ...recipe.dietary_tags
      ]
      
      tags.forEach(tag => {
        stats[tag] = (stats[tag] || 0) + 1
      })
    })
    
    return stats
  }
  
  async getMostUsedTags(limit = 10) {
    const stats = await this.getTagUsageStats()
    return Object.entries(stats)
      .sort(([,a], [,b]) => b - a)
      .slice(0, limit)
  }
  
  async getLeastUsedTags(limit = 10) {
    const stats = await this.getTagUsageStats()
    return Object.entries(stats)
      .sort(([,a], [,b]) => a - b)
      .slice(0, limit)
  }
}
```

## Data Flow

### Tag Creation Flow
1. User adds new tag in TagManagement interface
2. Tag validated for uniqueness and format
3. Tag added to appropriate category
4. All recipes updated with new tag option
5. UI refreshed with new tag

### Auto-Tagging Flow
1. User enables auto-tagging in recipe scraper
2. Recipe data sent to AI service
3. AI analyzes recipe and suggests tags
4. Suggested tags applied to recipe
5. User can modify or accept suggestions

### Tag Merging Flow
1. User selects two tags to merge
2. System validates merge operation
3. All recipes with source tag updated to target tag
4. Source tag deleted
5. UI updated with merged results

## Component Details

### TagManagement.jsx
```javascript
function TagManagement() {
  const [tags, setTags] = useState({})
  const [analytics, setAnalytics] = useState({})
  const [loading, setLoading] = useState(true)
  
  useEffect(() => {
    fetchTags()
    fetchAnalytics()
  }, [])
  
  const fetchTags = async () => {
    const allTags = await tagManagementService.getAllTags()
    setTags(allTags)
  }
  
  const fetchAnalytics = async () => {
    const stats = await tagAnalytics.getTagUsageStats()
    setAnalytics(stats)
  }
  
  return (
    <PageContainer>
      <PageHeader title="Tag Management" />
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <TagEditor 
          tags={tags}
          onUpdate={fetchTags}
        />
        
        <TagAnalytics 
          analytics={analytics}
        />
      </div>
    </PageContainer>
  )
}
```

### TagEditor.jsx
```javascript
function TagEditor({ tags, onUpdate }) {
  const [editingTag, setEditingTag] = useState(null)
  const [newTagName, setNewTagName] = useState('')
  
  const handleAddTag = async (category) => {
    if (!newTagName.trim()) return
    
    await tagManagementService.addTag(category, newTagName.trim())
    setNewTagName('')
    onUpdate()
  }
  
  const handleUpdateTag = async (tagId, updates) => {
    await tagManagementService.updateTag(tagId, updates)
    onUpdate()
  }
  
  const handleDeleteTag = async (tagId) => {
    if (window.confirm('Are you sure? This will remove the tag from all recipes.')) {
      await tagManagementService.deleteTag(tagId)
      onUpdate()
    }
  }
  
  return (
    <div className="space-y-6">
      {Object.entries(tags).map(([category, categoryTags]) => (
        <div key={category} className="bg-white p-4 rounded-lg shadow-sm">
          <h3 className="text-h5 font-heading font-black text-text-primary mb-4">
            {category.replace('_', ' ').toUpperCase()}
          </h3>
          
          <div className="space-y-2">
            {categoryTags.map(tag => (
              <div key={tag.id} className="flex items-center justify-between">
                <span className="text-text-primary">{tag.name}</span>
                <div className="flex gap-2">
                  <Button
                    onClick={() => setEditingTag(tag)}
                    variant="tertiary"
                    size="xs"
                  >
                    Edit
                  </Button>
                  <Button
                    onClick={() => handleDeleteTag(tag.id)}
                    variant="danger-outline-sm"
                    size="xs"
                  >
                    Delete
                  </Button>
                </div>
              </div>
            ))}
          </div>
          
          <div className="mt-4 flex gap-2">
            <Input
              value={newTagName}
              onChange={(e) => setNewTagName(e.target.value)}
              placeholder="New tag name"
              className="flex-grow"
            />
            <Button
              onClick={() => handleAddTag(category)}
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

### TagAnalytics.jsx
```javascript
function TagAnalytics({ analytics }) {
  const [mostUsed, setMostUsed] = useState([])
  const [leastUsed, setLeastUsed] = useState([])
  
  useEffect(() => {
    const sortedTags = Object.entries(analytics)
      .sort(([,a], [,b]) => b - a)
    
    setMostUsed(sortedTags.slice(0, 10))
    setLeastUsed(sortedTags.slice(-10))
  }, [analytics])
  
  return (
    <div className="space-y-6">
      <div className="bg-white p-4 rounded-lg shadow-sm">
        <h3 className="text-h5 font-heading font-black text-text-primary mb-4">
          Most Used Tags
        </h3>
        <div className="space-y-2">
          {mostUsed.map(([tag, count]) => (
            <div key={tag} className="flex justify-between">
              <span className="text-text-primary">{tag}</span>
              <span className="text-text-secondary">{count} recipes</span>
            </div>
          ))}
        </div>
      </div>
      
      <div className="bg-white p-4 rounded-lg shadow-sm">
        <h3 className="text-h5 font-heading font-black text-text-primary mb-4">
          Least Used Tags
        </h3>
        <div className="space-y-2">
          {leastUsed.map(([tag, count]) => (
            <div key={tag} className="flex justify-between">
              <span className="text-text-primary">{tag}</span>
              <span className="text-text-secondary">{count} recipes</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
```

## Error Handling

### Tag Validation Errors
```javascript
const validateTag = (tagName, category) => {
  if (!tagName || tagName.trim().length === 0) {
    throw new Error('Tag name is required')
  }
  
  if (tagName.length > 50) {
    throw new Error('Tag name must be 50 characters or less')
  }
  
  if (!category || !tagCategories[category]) {
    throw new Error('Invalid tag category')
  }
  
  return tagName.trim()
}
```

### AI Service Errors
```javascript
const handleAutoTaggingError = (error) => {
  if (error.code === 'RATE_LIMIT_EXCEEDED') {
    return 'AI service rate limit exceeded. Using fallback suggestions.'
  } else if (error.code === 'NETWORK_ERROR') {
    return 'Network error. Using fallback suggestions.'
  } else {
    return 'AI service unavailable. Using fallback suggestions.'
  }
}
```

## Performance Optimization

### Caching Strategy
- **Tag Data**: Cached in component state
- **Analytics**: Cached with periodic refresh
- **AI Responses**: 15-minute cache for identical requests

### Optimization Techniques
- **Lazy Loading**: Load tag data on demand
- **Debounced Updates**: Prevent excessive API calls
- **Batch Operations**: Efficient bulk tag operations

## Testing

### Test Scenarios
- **Tag CRUD**: Create, read, update, delete operations
- **AI Integration**: Mock AI responses and test parsing
- **Analytics**: Test usage statistics calculation
- **Tag Merging**: Test tag merge functionality
- **Error Handling**: Test various error scenarios

### Mock Data
```javascript
const mockTags = {
  cuisine_tags: [
    { id: 1, name: 'Italian', usage_count: 15 },
    { id: 2, name: 'Asian', usage_count: 12 }
  ],
  ingredient_tags: [
    { id: 3, name: 'Chicken', usage_count: 20 },
    { id: 4, name: 'Beef', usage_count: 8 }
  ]
}

const mockAnalytics = {
  'Italian': 15,
  'Asian': 12,
  'Chicken': 20,
  'Beef': 8
}
```

## Future Enhancements

### Planned Features
- **Tag Suggestions**: AI-powered tag recommendations
- **Tag Relationships**: Related tag suggestions
- **Bulk Tag Operations**: Efficient tag management
- **Tag Import/Export**: Backup and restore tag data
- **Advanced Analytics**: More detailed usage insights

### Technical Improvements
- **Tag Clustering**: Group similar tags automatically
- **Smart Merging**: AI-powered tag merge suggestions
- **Performance Optimization**: Faster tag operations
- **Real-time Updates**: Live tag usage statistics
