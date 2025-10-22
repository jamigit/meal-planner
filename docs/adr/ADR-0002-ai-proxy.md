# ADR-0002: AI Service Architecture (Node.js Proxy)

## Status
**Accepted** - 2025-10-22

## Context
The meal planner application needs AI-powered features for meal suggestions and recipe analysis. The application must integrate with external AI services (Claude API) while maintaining security, performance, and offline capability.

### Requirements
- **AI Integration**: Claude API for meal suggestions and recipe analysis
- **Security**: Keep API keys server-side, not exposed to client
- **Performance**: Caching and rate limiting to control costs
- **Offline Capability**: Graceful degradation when AI services unavailable
- **Development Experience**: Easy local development with AI services

### Constraints
- **No Backend Infrastructure**: Application is client-side only
- **API Key Security**: Cannot expose API keys in client code
- **Cost Control**: Need to limit AI API usage and costs
- **PWA Requirements**: Must work offline for installation
- **Development Workflow**: Need local development server

## Decision
We will implement a **Node.js proxy server** that:
- **Runs locally** on port 3002 for development
- **Proxies AI requests** to Claude API with proper authentication
- **Handles caching** and rate limiting server-side
- **Provides fallbacks** when AI services are unavailable
- **Uses Netlify Functions** for production deployment

### Architecture Components

#### Node.js Development Server
**File**: `server.js` (Port 3002)

```javascript
// Express server with AI proxy endpoints
app.post('/api/claude', async (req, res) => {
  try {
    const response = await claudeAPI.generateText(req.body)
    res.json({ success: true, data: response })
  } catch (error) {
    res.json({ success: false, error: error.message })
  }
})
```

#### Environment Detection
```javascript
// All AI services use this pattern
const isProduction = import.meta.env.PROD && !window.location.hostname.includes('localhost')
const apiUrl = isProduction 
  ? 'https://your-app.netlify.app/.netlify/functions/claude'
  : 'http://localhost:3002/api/claude'
```

#### Service Layer
- **AI Meal Planner Service**: `aiMealPlannerService.js` for meal suggestions
- **Recipe Tag Service**: `recipeTagSuggestionService.js` for recipe analysis
- **Recipe Scraper Service**: `recipeScraperService.js` with AI integration

## Consequences

### Positive Outcomes ✅
- **Security**: API keys never exposed to client
- **Cost Control**: Server-side rate limiting and caching
- **Performance**: Caching reduces API calls and improves response times
- **Development**: Easy local development with AI services
- **Fallbacks**: Graceful degradation when AI unavailable
- **Scalability**: Can add more AI services easily

### Negative Outcomes ⚠️
- **Complexity**: Additional server component to maintain
- **Development Setup**: Developers need to run local server
- **Deployment**: Need to deploy both client and server
- **Dependencies**: Additional Node.js dependencies
- **Debugging**: More complex debugging with proxy layer

### Risks & Mitigations
- **Risk**: Server downtime affects AI features
  - **Mitigation**: Fallback to keyword-based suggestions
- **Risk**: API key exposure in server code
  - **Mitigation**: Environment variables and secure deployment
- **Risk**: Rate limiting affects user experience
  - **Mitigation**: Client-side caching and user feedback

## Implementation Details

### Development Server
```javascript
// server.js - Express server for AI proxy
const express = require('express')
const cors = require('cors')

const app = express()
app.use(cors())
app.use(express.json())

// AI proxy endpoint
app.post('/api/claude', async (req, res) => {
  try {
    const response = await claudeAPI.generateText(req.body)
    res.json({ success: true, data: response })
  } catch (error) {
    res.json({ success: false, error: error.message })
  }
})

app.listen(3002, () => {
  console.log('AI proxy server running on port 3002')
})
```

### Production Deployment
```javascript
// netlify/functions/claude.js - Netlify function
exports.handler = async (event, context) => {
  try {
    const response = await claudeAPI.generateText(JSON.parse(event.body))
    return {
      statusCode: 200,
      body: JSON.stringify({ success: true, data: response })
    }
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ success: false, error: error.message })
    }
  }
}
```

### Caching Strategy
```javascript
// Server-side caching for AI responses
const cache = new Map()

app.post('/api/claude', async (req, res) => {
  const cacheKey = JSON.stringify(req.body)
  
  if (cache.has(cacheKey)) {
    return res.json(cache.get(cacheKey))
  }
  
  const response = await claudeAPI.generateText(req.body)
  cache.set(cacheKey, response)
  
  res.json(response)
})
```

### Rate Limiting
```javascript
// Rate limiting to control API usage
const rateLimit = new Map()

app.post('/api/claude', async (req, res) => {
  const clientId = req.ip
  const now = Date.now()
  
  if (rateLimit.has(clientId)) {
    const lastRequest = rateLimit.get(clientId)
    if (now - lastRequest < 60000) { // 1 minute
      return res.status(429).json({ error: 'Rate limit exceeded' })
    }
  }
  
  rateLimit.set(clientId, now)
  // Process request...
})
```

## Alternatives Considered

### Client-Side AI Integration
- **Rejected**: Would expose API keys to client
- **Rejected**: No server-side caching or rate limiting
- **Rejected**: Higher costs due to no request optimization

### Third-Party AI Proxy Services
- **Rejected**: Additional cost and complexity
- **Rejected**: Less control over caching and rate limiting
- **Rejected**: Potential vendor lock-in

### Serverless Functions Only
- **Rejected**: More complex for local development
- **Rejected**: Harder to debug and test
- **Rejected**: More expensive for development

## Monitoring & Success Metrics

### Technical Metrics
- **Response Times**: Average AI response time
- **Cache Hit Rate**: Percentage of cached responses
- **Error Rates**: Frequency of AI service errors
- **Rate Limit Hits**: Frequency of rate limit violations

### Cost Metrics
- **API Usage**: Number of API calls per day
- **Cost per Request**: Average cost per AI request
- **Cache Savings**: Cost savings from caching
- **Rate Limit Savings**: Cost savings from rate limiting

### User Experience Metrics
- **AI Feature Usage**: Usage of AI-powered features
- **Fallback Usage**: Usage of fallback suggestions
- **User Satisfaction**: User feedback on AI suggestions
- **Performance**: User perception of AI response times

## Future Considerations

### Potential Enhancements
- **Multiple AI Providers**: Support for multiple AI services
- **Advanced Caching**: More sophisticated caching strategies
- **Request Optimization**: Batch requests and request deduplication
- **Analytics**: Detailed AI usage analytics

### Scalability
- **High Traffic**: Handle many concurrent AI requests
- **Cost Optimization**: More aggressive caching and rate limiting
- **Global Deployment**: Deploy AI proxy in multiple regions
- **Load Balancing**: Distribute AI requests across multiple instances

## Decision Review
This decision will be reviewed when:
- **Cost Issues**: If AI costs become too high
- **Performance Issues**: If proxy adds too much latency
- **Security Issues**: If API key security is compromised
- **Technology Changes**: If new AI integration patterns emerge

## References
- [Claude API Documentation](https://docs.anthropic.com/)
- [Netlify Functions](https://docs.netlify.com/functions/)
- [Express.js Documentation](https://expressjs.com/)
- [API Security Best Practices](https://owasp.org/www-project-api-security/)
