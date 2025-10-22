# ADR-0001: Dual Storage Architecture (Supabase + IndexedDB)

## Status
**Accepted** - 2025-10-22

## Context
The meal planner application needs to support both authenticated users (with cloud sync) and guest users (offline-only). The application must work seamlessly in both scenarios while maintaining data consistency and providing a good user experience.

### Requirements
- **Authenticated Users**: Cloud storage with real-time sync across devices
- **Guest Users**: Local storage with offline capability
- **Seamless Transition**: Easy migration from local to cloud storage
- **Data Consistency**: Same data structure across both storage types
- **Performance**: Fast local operations with cloud sync when available

### Constraints
- **No Server Backend**: Application is client-side only
- **PWA Requirements**: Must work offline for installation
- **Real-time Collaboration**: Need live updates for authenticated users
- **Data Migration**: Users should be able to migrate data when they sign up

## Decision
We will implement a **dual storage architecture** using:
- **Supabase** (PostgreSQL) for authenticated users with real-time subscriptions
- **IndexedDB** (via Dexie) for guest users with offline capability
- **Service Selector** pattern to automatically choose storage based on authentication status

### Architecture Components

#### Service Layer Pattern
```javascript
// All services follow this interface
class ServiceName {
  async getAll()           // Get all records
  async getById(id)       // Get single record
  async add(data)         // Create new record
  async update(id, data)  // Update existing record
  async delete(id)        // Delete record
}

// Service selector automatically routes to appropriate storage
const service = await serviceSelector.getRecipeService()
// Returns supabaseRecipeService or recipeService based on auth status
```

#### Dual Service Implementation
- **Supabase Services**: `supabaseRecipeService.js`, `supabaseWeeklyPlanService.js`, etc.
- **IndexedDB Services**: `recipeService.js`, `weeklyPlanService.js`, etc.
- **Service Selector**: `serviceSelector.js` routes based on authentication

#### Data Consistency Strategy
- **Same API Interface**: Both services implement identical methods
- **Data Normalization**: Consistent data structure across storage types
- **Field Mapping**: Proper mapping between snake_case (Supabase) and camelCase (IndexedDB)
- **Validation**: Same validation rules applied to both storage types

## Consequences

### Positive Outcomes ✅
- **Seamless User Experience**: Users don't need to choose storage type
- **Offline-First**: App works without internet connection
- **Real-time Collaboration**: Live updates for authenticated users
- **Easy Migration**: Simple data migration when users sign up
- **Performance**: Fast local operations with cloud sync
- **PWA Compliance**: Meets offline requirements for app installation

### Negative Outcomes ⚠️
- **Code Duplication**: Similar logic in both service implementations
- **Complexity**: More complex than single storage solution
- **Testing Overhead**: Need to test both storage paths
- **Data Sync Challenges**: Potential inconsistencies during migration
- **Maintenance**: Two codebases to maintain and keep in sync

### Risks & Mitigations
- **Risk**: Data inconsistency between storage types
  - **Mitigation**: Comprehensive validation and normalization
- **Risk**: Migration failures during auth signup
  - **Mitigation**: Robust error handling and rollback mechanisms
- **Risk**: Code drift between service implementations
  - **Mitigation**: Shared validation utilities and consistent patterns

## Implementation Details

### Service Selector Pattern
```javascript
class ServiceSelector {
  async getRecipeService() {
    const shouldUseSupabase = isSupabaseConfigured() && authService.isAuthenticated()
    return shouldUseSupabase ? supabaseRecipeService : recipeService
  }
}
```

### Data Migration Flow
1. **User Signs Up**: Authentication state changes
2. **Service Selector**: Switches to Supabase services
3. **Data Migration**: IndexedDB data synced to Supabase
4. **Cleanup**: IndexedDB data cleared after successful sync
5. **Real-time**: Supabase subscriptions activated

### Error Handling
- **Network Errors**: Graceful fallback to IndexedDB
- **Migration Errors**: Rollback to IndexedDB with user notification
- **Sync Conflicts**: Last-write-wins with user notification

## Alternatives Considered

### Single Storage Solutions
- **Supabase Only**: Would require internet connection, not PWA-compliant
- **IndexedDB Only**: No real-time collaboration, no cloud sync
- **LocalStorage Only**: Limited storage capacity, no structured queries

### Hybrid Approaches
- **Server-Side Sync**: Would require backend infrastructure
- **Progressive Enhancement**: Start with IndexedDB, add Supabase later
- **User Choice**: Let users choose storage type (rejected for UX reasons)

## Monitoring & Success Metrics

### Technical Metrics
- **Migration Success Rate**: Percentage of successful local-to-cloud migrations
- **Sync Performance**: Time to sync data between storage types
- **Error Rates**: Frequency of storage-related errors
- **Data Consistency**: Validation of data integrity across storage types

### User Experience Metrics
- **Offline Usage**: Percentage of users using offline features
- **Migration Completion**: Percentage of users who complete data migration
- **Real-time Usage**: Usage of collaborative features
- **Performance**: Response times for different operations

## Future Considerations

### Potential Enhancements
- **Conflict Resolution**: More sophisticated conflict resolution strategies
- **Selective Sync**: Sync only changed data for better performance
- **Offline Queuing**: Queue operations when offline, sync when online
- **Data Compression**: Compress data for faster sync

### Scalability
- **Large Datasets**: Handle users with thousands of recipes
- **Real-time Performance**: Optimize for many concurrent users
- **Storage Limits**: Handle IndexedDB storage limits gracefully
- **API Rate Limits**: Respect Supabase API rate limits

## Decision Review
This decision will be reviewed when:
- **Performance Issues**: If dual storage causes significant performance problems
- **Maintenance Burden**: If maintaining two codebases becomes too costly
- **User Feedback**: If users report issues with the dual storage approach
- **Technology Changes**: If new storage solutions become available

## References
- [Supabase Documentation](https://supabase.com/docs)
- [Dexie.js Documentation](https://dexie.org/)
- [PWA Storage Best Practices](https://web.dev/storage-for-the-web/)
- [Service Worker Patterns](https://developers.google.com/web/fundamentals/primers/service-workers)
