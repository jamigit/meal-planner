# Patterns and Conventions

This document captures repeatable patterns used across the codebase to keep implementations consistent and maintainable.

## Service-first Data Access
- Components never talk directly to Supabase or IndexedDB.
- Use `src/services/*` and `src/services/serviceSelector.js`.
- Example:
```js
import serviceSelector from '@/services/serviceSelector';

export async function loadRecipes() {
  const recipeService = await serviceSelector.getRecipeService();
  return recipeService.getAll();
}
```

## Request Lifecycle UX
- Use `src/hooks/useRequestLifecycle.js` for loading, error, and success states.
- Show optimistic updates where appropriate with `useOptimisticUpdates`.

## Accessibility Defaults
- Prefer semantic elements and `aria-live` for async status where needed.
- Ensure keyboard navigability; preserve focus on modal open/close.

## Error Boundaries
- Wrap route-level UI in `src/components/ErrorBoundary.jsx`.
- Provide `fallback` UI and reset handlers.

## Testing
- Co-locate tests: `Component.test.jsx` next to component.
- Use Testing Library patterns: query by role, name, label.
- Avoid testing implementation details; focus on behavior.

## Styling
- Use Tailwind utility classes with small component-specific wrappers when needed.
- Avoid deep custom CSS unless part of the design system.

## AI Integration
- Go through Netlify Function proxy for Claude per environment.
- Parse and validate AI outputs before rendering.

## Commit Hygiene
- Small, focused commits.
- Useful messages: imperative mood, reference issue when applicable.


