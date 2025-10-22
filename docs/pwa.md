# Progressive Web App (PWA)

## Configuration

### Vite PWA Plugin
**File**: `vite.config.js`

```javascript
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    VitePWA({
      registerType: 'autoUpdate',
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/api\.anthropic\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'claude-api-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 15 * 60 // 15 minutes
              }
            }
          }
        ]
      },
      manifest: {
        name: 'Meal Planner',
        short_name: 'MealPlanner',
        description: 'Personal meal planning tool',
        theme_color: '#000000',
        background_color: '#F9FAFB',
        display: 'standalone',
        icons: [
          {
            src: 'icons/manifest-icon-192.maskable.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'maskable'
          }
        ]
      }
    })
  ]
})
```

## Service Worker Strategy

### Caching Rules
- **Static Assets**: Aggressive caching for JS, CSS, HTML, images
- **API Responses**: Cache-first for Claude API (15-minute expiration)
- **Dynamic Content**: Network-first for user data

### Offline Functionality
- **Full CRUD**: All operations work offline with IndexedDB
- **Background Sync**: Queue operations when offline, sync when online
- **Graceful Degradation**: AI features disabled offline, data features work

## HTTPS Development Setup

### Local HTTPS Server
For proper PWA testing, serve the app over HTTPS:

```bash
# Install local SSL proxy
npm install -g local-ssl-proxy

# Start HTTPS server
local-ssl-proxy --source 3001 --target 3000
```

### Content Security Policy
**File**: `src/components/SecurityComponents.jsx`

```javascript
const contentSecurityPolicy = `
  default-src 'self';
  script-src 'self' 'unsafe-inline' 'unsafe-eval';
  style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://api.fontshare.com;
  font-src 'self' https://fonts.gstatic.com https://api.fontshare.com;
  img-src 'self' data: https:;
  connect-src 'self' https://*.supabase.co https://api.emailjs.com https://localhost:* wss://localhost:*;
  frame-src 'none';
`
```

## Known Issues & Solutions

### Service Worker Registration Conflicts
**Problem**: Multiple service workers or registration failures
**Solution**: 
- Clear browser cache and service workers
- Check for conflicting registrations
- Ensure single service worker per origin

### SPA Routing Issues
**Problem**: 404 errors on refresh for client-side routes
**Solution**: 
```bash
# Use serve with SPA mode
npx serve dist -p 3000 -s
```

### HTTPS Requirements
**Problem**: PWA features require HTTPS
**Solution**: 
- Use `local-ssl-proxy` for development
- Ensure production uses HTTPS
- Update CSP to allow localhost HTTPS

## Troubleshooting Checklist

### PWA Installation Issues
- [ ] App served over HTTPS
- [ ] Valid manifest.json
- [ ] Service worker registered
- [ ] Icons present and correct sizes
- [ ] CSP allows required resources

### Offline Functionality Issues
- [ ] Service worker active
- [ ] IndexedDB accessible
- [ ] Network detection working
- [ ] Cache strategies configured
- [ ] Background sync enabled

### Performance Issues
- [ ] Bundle size optimized
- [ ] Images compressed
- [ ] Lazy loading implemented
- [ ] Cache strategies appropriate
- [ ] Service worker not blocking main thread

## Development Workflow

### Testing PWA Features
1. **Build the app**: `npm run build`
2. **Start HTTPS server**: `local-ssl-proxy --source 3001 --target 3000`
3. **Open in browser**: `https://localhost:3001`
4. **Test installation**: Use browser install prompt
5. **Test offline**: Disable network in DevTools

### Debugging Service Worker
1. **Open DevTools** → Application → Service Workers
2. **Check registration status**
3. **View cache storage**
4. **Monitor network requests**
5. **Check console for errors**

### Updating PWA
- **Automatic updates**: Vite PWA handles this
- **Manual updates**: User can refresh or reinstall
- **Version management**: Service worker versioning

## Production Deployment

### Netlify Configuration
**File**: `netlify.toml`

```toml
[build]
  command = "npm run build"
  publish = "dist"

[[headers]]
  for = "/*"
  [headers.values]
    X-Frame-Options = "DENY"
    X-Content-Type-Options = "nosniff"
    Referrer-Policy = "strict-origin-when-cross-origin"

[[headers]]
  for = "/sw.js"
  [headers.values]
    Cache-Control = "public, max-age=0, must-revalidate"
```

### Performance Monitoring
- **Lighthouse audits**: Regular PWA audits
- **Core Web Vitals**: Monitor LCP, FID, CLS
- **Service worker metrics**: Cache hit rates
- **Offline usage**: Track offline feature usage
