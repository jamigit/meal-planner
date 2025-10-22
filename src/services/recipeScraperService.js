import { recipeTagSuggestionService } from './recipeTagSuggestionService.js'

export async function scrapeRecipeFromUrl(url, signal, autoTag = false) {
  if (!url || typeof url !== 'string') {
    throw new Error('URL required')
  }
  const apiBase = (import.meta && import.meta.env && import.meta.env.VITE_API_BASE) || 'http://localhost:3002'
  const res = await fetch(`${apiBase}/api/scrape-recipe`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url }),
    signal
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    const code = data?.code || 'SCRAPE_ERROR'
    const message = data?.error || `Scrape failed (${res.status})`
    const err = new Error(message)
    err.code = code
    throw err
  }

  // Add auto-tagging if requested
  if (autoTag) {
    try {
      const suggestedTags = await recipeTagSuggestionService.suggestTagsForRecipe(data)
      if (suggestedTags.success) {
        data.suggested_tags = suggestedTags.data
        data.tags_auto_suggested = true
      } else {
        console.warn('Auto-tagging failed:', suggestedTags.error)
        data.suggested_tags = suggestedTags.fallback || {}
        data.tags_auto_suggested = false
      }
    } catch (error) {
      console.warn('Auto-tagging error:', error)
      data.suggested_tags = {}
      data.tags_auto_suggested = false
    }
  }

  return data
}


