export async function scrapeRecipeFromUrl(url, signal) {
  if (!url || typeof url !== 'string') {
    throw new Error('URL required')
  }
  const apiBase = (import.meta && import.meta.env && import.meta.env.VITE_API_BASE) || 'http://localhost:3001'
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
  return data
}


