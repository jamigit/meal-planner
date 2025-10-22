# AI Services

## Service Architecture

### Node.js Proxy Server
**File**: `server.js` (Port 3002)

The Express server acts as a proxy between the React app and external AI services, providing:
- **API Key Security**: Keeps Claude API keys server-side
- **Request Transformation**: Formats requests for Claude API
- **Error Handling**: Standardized error responses
- **Rate Limiting**: Prevents API abuse
- **Caching**: Reduces API calls and costs

### Environment Detection
```javascript
// All AI services use this pattern
const isProduction = import.meta.env.PROD && !window.location.hostname.includes('localhost')
const apiUrl = isProduction 
  ? 'https://your-app.netlify.app/.netlify/functions/claude'
  : 'http://localhost:3002/api/claude'
```

## AI Meal Planner V2

### Service
**File**: `src/services/aiMealPlannerService.js`

### Prompt Strategy
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

### Response Format
```json
{
  "success": true,
  "data": [
    "Spaghetti Carbonara",
    "Chicken Tikka Masala", 
    "Beef Stir Fry",
    "Vegetable Curry",
    "Fish Tacos",
    "Pasta Primavera",
    "Chicken Teriyaki",
    "Lentil Soup"
  ],
  "reasoning": "Selected 2 popular meals (Carbonara, Tikka Masala), 2 less common (Stir Fry, Curry), and 4 random variety meals for balanced weekly planning."
}
```

### Error Handling
- **Timeout**: 30-second timeout with fallback suggestions
- **Rate Limiting**: 10 requests per minute per user
- **Caching**: 15-minute cache for identical requests
- **Fallback**: Keyword-based suggestions when AI unavailable

## Recipe Tag Suggestions

### Service
**File**: `src/services/recipeTagSuggestionService.js`

### Prompt Strategy
```javascript
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
```

### Response Format
```json
{
  "success": true,
  "data": {
    "cuisine_tags": ["Italian"],
    "ingredient_tags": ["Pasta", "Cheese"],
    "convenience_tags": ["Quick"],
    "dietary_tags": ["Vegetarian"]
  }
}
```

### Fallback System
When AI is unavailable, uses keyword detection:
```javascript
const fallbackSuggestions = {
  cuisine_tags: detectCuisine(recipeData),
  ingredient_tags: detectMainIngredients(recipeData),
  convenience_tags: detectConvenience(recipeData),
  dietary_tags: detectDietary(recipeData)
}
```

## Recipe Scraper Integration

### Auto-Tagging Flow
**File**: `src/services/recipeScraperService.js`

```javascript
// When autoTag is enabled
const scrapedData = await scrapeRecipeFromUrl(url)
if (autoTag) {
  const tagSuggestions = await recipeTagSuggestionService.suggestTagsForRecipe(scrapedData)
  return {
    ...scrapedData,
    ...tagSuggestions.data
  }
}
```

## API Endpoints

### Claude Proxy
**Endpoint**: `POST /api/claude`

```javascript
// Request
{
  "model": "claude-3-5-sonnet-20241022",
  "messages": [
    {"role": "system", "content": "..."},
    {"role": "user", "content": "..."}
  ],
  "max_tokens": 1000,
  "temperature": 0.7
}

// Response
{
  "success": true,
  "data": "AI response content",
  "usage": {
    "input_tokens": 150,
    "output_tokens": 75
  }
}
```

### Tag Suggestions
**Endpoint**: `POST /api/suggest-tags`

```javascript
// Request
{
  "recipeData": {
    "name": "Spaghetti Carbonara",
    "ingredients": ["pasta", "eggs", "cheese", "bacon"],
    "instructions": ["Boil pasta", "Mix eggs", "Combine"]
  }
}

// Response
{
  "success": true,
  "data": {
    "cuisine_tags": ["Italian"],
    "ingredient_tags": ["Pasta", "Cheese"],
    "convenience_tags": ["Quick"],
    "dietary_tags": []
  }
}
```

## Error Patterns & Handling

### Common Error Types
1. **Network Errors**: Connection refused, timeout
2. **API Errors**: Rate limit exceeded, invalid request
3. **Parse Errors**: Invalid JSON response
4. **Validation Errors**: Missing required fields

### Error Response Format
```javascript
{
  "success": false,
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Too many requests. Please try again in a minute.",
    "details": "Rate limit: 10 requests per minute"
  },
  "fallback": {
    "suggestions": ["Fallback suggestion 1", "Fallback suggestion 2"]
  }
}
```

### Retry Logic
```javascript
const retryConfig = {
  maxRetries: 3,
  baseDelay: 1000,
  maxDelay: 10000,
  backoffFactor: 2
}
```

## Performance Optimization

### Caching Strategy
- **AI Responses**: 15-minute cache with request fingerprinting
- **Tag Suggestions**: Cache by recipe content hash
- **Rate Limiting**: In-memory tracking per user session

### Request Optimization
- **Batch Requests**: Combine multiple operations when possible
- **Request Deduplication**: Prevent duplicate simultaneous requests
- **Timeout Management**: Appropriate timeouts for different operations

## Monitoring & Debugging

### Logging
```javascript
console.log('AI Service Debug:', {
  endpoint: apiUrl,
  isProduction,
  requestType: 'meal_suggestions',
  timestamp: new Date().toISOString()
})
```

### Metrics to Track
- **Response Times**: Average API response time
- **Success Rate**: Percentage of successful requests
- **Cache Hit Rate**: Percentage of cached responses
- **Error Rate**: Percentage of failed requests by type

### Debug Tools
- **Network Tab**: Monitor API requests and responses
- **Console Logs**: Detailed request/response logging
- **Service Health**: Server health check endpoint
