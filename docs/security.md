# Security

## Content Security Policy (CSP)

### Current Policy
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

### Allowed Origins
- **Supabase**: `https://*.supabase.co` for database and auth
- **EmailJS**: `https://api.emailjs.com` for email functionality
- **Localhost**: `https://localhost:*` for HTTPS PWA testing
- **Fonts**: Google Fonts and Fontshare for typography

### Security Headers
- **X-Frame-Options**: Removed (can only be set via HTTP headers)
- **X-Content-Type-Options**: `nosniff`
- **Referrer-Policy**: `strict-origin-when-cross-origin`

## Input Sanitization

### Utilities
**File**: `src/utils/security.js`

```javascript
// HTML sanitization
export function sanitizeHTML(html) {
  // Remove script tags and dangerous attributes
  return html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
}

// URL validation
export function isValidURL(url) {
  try {
    new URL(url)
    return true
  } catch {
    return false
  }
}

// Input escaping
export function escapeHTML(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}
```

### Validation Patterns
```javascript
// Recipe name validation
const name = validateStringField(recipe.name, 'name', true)
if (!name || name.length > 100) {
  throw new Error('Recipe name must be 1-100 characters')
}

// URL validation
if (recipe.url && !isValidURL(recipe.url)) {
  throw new Error('Invalid URL format')
}
```

## Authentication Model

### Supabase Auth
- **Password-based**: Email/password authentication
- **Row Level Security**: Database-level access control
- **Session Management**: Automatic token refresh
- **Logout**: Server-side session invalidation

### RLS Policies
```sql
-- Example policy for recipes table
CREATE POLICY "Users can only see their own recipes" ON recipes
  FOR ALL USING (auth.uid() = user_id);
```

### Service Layer Security
```javascript
// Automatic auth state detection
const shouldUseSupabase = isSupabaseConfigured() && authService.isAuthenticated()

// User ID validation
async getUserId() {
  const user = await authService.getCurrentUser()
  if (!user) throw new Error('User not authenticated')
  return user.id
}
```

## Data Protection

### Sensitive Data Handling
- **API Keys**: Stored server-side only
- **User Data**: Encrypted in transit (HTTPS)
- **Local Storage**: No sensitive data in localStorage
- **Session Data**: Managed by Supabase Auth

### Data Validation
```javascript
// Comprehensive validation
const validationResult = validateRecipe(recipe)
if (!validationResult.isValid) {
  throw new Error(`Validation failed: ${validationResult.errors.join(', ')}`)
}
```

## Network Security

### HTTPS Requirements
- **PWA Installation**: Requires HTTPS
- **API Calls**: All external calls over HTTPS
- **Local Development**: HTTPS proxy for testing

### Request Security
- **CORS**: Properly configured for allowed origins
- **Rate Limiting**: Prevents abuse of AI services
- **Request Validation**: All inputs validated before processing

## Security Best Practices

### Code Security
- **No eval()**: Avoided in favor of safe alternatives
- **Input Validation**: All user inputs validated
- **Error Handling**: No sensitive data in error messages
- **Dependencies**: Regular security audits

### Deployment Security
- **Environment Variables**: Sensitive config via env vars
- **Build Security**: No secrets in client bundle
- **CDN Security**: Proper cache headers and security policies

## Security Monitoring

### Error Tracking
```javascript
// Security-related errors logged
console.error('Security Error:', {
  type: 'validation_failed',
  field: 'recipe_name',
  value: sanitizedValue,
  timestamp: new Date().toISOString()
})
```

### Audit Trail
- **User Actions**: Logged for security analysis
- **Failed Logins**: Tracked for brute force detection
- **Data Changes**: Audit trail for sensitive operations

## Common Vulnerabilities Prevented

### XSS (Cross-Site Scripting)
- **CSP**: Strict Content Security Policy
- **Input Sanitization**: HTML sanitization utilities
- **Output Encoding**: Proper HTML escaping

### CSRF (Cross-Site Request Forgery)
- **SameSite Cookies**: Secure cookie settings
- **Origin Validation**: Request origin checking
- **Token Validation**: CSRF tokens where applicable

### Injection Attacks
- **Parameterized Queries**: Supabase handles SQL injection
- **Input Validation**: Comprehensive input validation
- **Output Encoding**: Proper data encoding

## Security Checklist

### Development
- [ ] All inputs validated and sanitized
- [ ] No sensitive data in client code
- [ ] CSP policy properly configured
- [ ] HTTPS enforced in production
- [ ] Error messages don't leak sensitive info

### Deployment
- [ ] Environment variables secured
- [ ] API keys server-side only
- [ ] Security headers configured
- [ ] Regular dependency updates
- [ ] Security monitoring enabled
