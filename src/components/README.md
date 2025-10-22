# Component Organization

This document outlines the organization and usage patterns for components in the meal planner application.

## Directory Structure

```
src/components/
├── layout/                    # Layout components
│   ├── PageContainer.jsx      # Standard page wrapper
│   ├── PageHeader.jsx        # Page titles with optional hero images
│   ├── PageSection.jsx       # Content sections with variants
│   └── index.js              # Central exports
├── ui/                       # Reusable UI components
│   ├── Button.jsx            # Button variants
│   ├── Card.jsx              # Card containers
│   ├── Input.jsx             # Form inputs
│   ├── Message.jsx           # Alert/message boxes
│   ├── MultiSelectDropdown.jsx # Multi-select dropdowns
│   ├── Tabs.jsx              # Tab navigation
│   └── Toggle.jsx            # Toggle switches
├── [feature components]      # Feature-specific components
└── README.md                 # This file
```

## Layout Components (`layout/`)

### PageContainer
Standard page wrapper providing consistent spacing and layout.

```jsx
import { PageContainer } from './layout'

<PageContainer>
  {/* Page content */}
</PageContainer>
```

**Props:**
- `className` (string, optional): Additional CSS classes

### PageHeader
Reusable page header with optional hero image and action buttons.

```jsx
import { PageHeader } from './layout'

<PageHeader
  title="Page Title"
  subtitle="Optional subtitle"
  showHeroImage={true}
  actions={<button>Action</button>}
/>
```

**Props:**
- `title` (string, required): Page title
- `subtitle` (string, optional): Subtitle text
- `actions` (ReactNode, optional): Action buttons
- `showHeroImage` (boolean, optional): Show kiwi hero image
- `className` (string, optional): Additional CSS classes

### PageSection
Consistent content sections with variants.

```jsx
import { PageSection } from './layout'

<PageSection variant="card">
  {/* Section content */}
</PageSection>
```

**Props:**
- `variant` (string, optional): Section variant (`default`, `card`, `elevated`)
- `className` (string, optional): Additional CSS classes

## UI Components (`ui/`)

### Message
Standardized message/alert boxes for success, warning, error, and info messages.

```jsx
import Message from './ui/Message'

<Message variant="success" onClose={handleClose}>
  Success message content
</Message>
```

**Props:**
- `variant` (string, optional): Message type (`success`, `warning`, `error`, `info`)
- `onClose` (function, optional): Close handler
- `className` (string, optional): Additional CSS classes
- `children` (ReactNode, required): Message content

## Usage Guidelines

### Page Structure
All pages should follow this consistent pattern:

```jsx
import { PageContainer, PageHeader, PageSection } from './layout'

function MyPage() {
  return (
    <PageContainer>
      <PageHeader 
        title="Page Title" 
        showHeroImage={true} 
        actions={<button>Action</button>} 
      />
      
      <PageSection variant="card">
        {/* Main content section */}
      </PageSection>
      
      <PageSection>
        {/* Secondary content section */}
      </PageSection>
    </PageContainer>
  )
}
```

### Styling Guidelines

#### Use Design System Utilities
- Import utilities from `utils/designSystem.js`
- Use semantic color tokens instead of hardcoded colors
- Leverage CSS utility classes from `index.css`

```jsx
// ✅ Good - Using design system
import { colors, typography } from '../utils/designSystem'

<div className={`${colors.bg.surface} ${typography.heading.lg}`}>
  Content
</div>

// ❌ Avoid - Hardcoded styles
<div className="bg-white text-lg font-bold">
  Content
</div>
```

#### Surface Colors
Use semantic surface colors instead of hardcoded backgrounds:

```jsx
// ✅ Good - Semantic tokens
<div className="surface-elevated">White cards</div>
<div className="surface-page">Page backgrounds</div>

// ❌ Avoid - Hardcoded colors
<div className="bg-white">White cards</div>
<div className="bg-gray-50">Page backgrounds</div>
```

#### Message Boxes
Use the Message component for all alerts and notifications:

```jsx
// ✅ Good - Using Message component
<Message variant="success">Operation completed!</Message>
<Message variant="error">Something went wrong</Message>

// ❌ Avoid - Hardcoded message styles
<div className="bg-green-50 border border-green-200 p-4 rounded-lg">
  Success message
</div>
```

#### Form Inputs
Use standardized input classes:

```jsx
// ✅ Good - Using input-standard class
<input className="input-standard" />

// ❌ Avoid - Hardcoded input styles
<input className="p-3 border-2 border-black rounded-lg focus:ring-2..." />
```

### Component Patterns

#### Consistent Card Styling
Use `card-elevated` for white cards that need to stand out:

```jsx
// ✅ Good - Using card-elevated
<div className="card-elevated">
  <h3>Card Title</h3>
  <p>Card content</p>
</div>

// ❌ Avoid - Hardcoded card styles
<div className="!bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md">
  Card content
</div>
```

#### Button Consistency
Use design system button classes:

```jsx
// ✅ Good - Using design system buttons
<button className="btn-primary">Primary Action</button>
<button className="btn-secondary">Secondary Action</button>
<button className="btn-outline-black-sm">Small Outline</button>

// ❌ Avoid - Custom button styles
<button className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
  Custom Button
</button>
```

## Migration Guide

### Converting Existing Pages

1. **Replace page wrapper:**
   ```jsx
   // Before
   <div className="mt-16 md:mt-24 relative pb-[200px]">
   
   // After
   <PageContainer>
   ```

2. **Replace page header:**
   ```jsx
   // Before
   <div className="mt-16 mb-10 relative z-10">
     <h1 className="font-heading text-display-2 uppercase text-black">
       Page Title
     </h1>
   </div>
   
   // After
   <PageHeader title="Page Title" showHeroImage={true} />
   ```

3. **Replace content sections:**
   ```jsx
   // Before
   <div className="card mb-6">
     <h2>Section Title</h2>
     {/* content */}
   </div>
   
   // After
   <PageSection variant="card">
     <h2>Section Title</h2>
     {/* content */}
   </PageSection>
   ```

4. **Replace message boxes:**
   ```jsx
   // Before
   <div className="bg-green-50 border border-green-200 rounded-lg p-4">
     Success message
   </div>
   
   // After
   <Message variant="success">Success message</Message>
   ```

### CSS Class Replacements

| Old Class | New Class | Usage |
|-----------|-----------|-------|
| `bg-white` | `surface-elevated` | White backgrounds |
| `bg-gray-50` | `surface-page` | Page backgrounds |
| `!bg-white` | `surface-elevated` | Important white backgrounds |
| `p-3 border-2 border-black rounded-lg focus:ring-2...` | `input-standard` | Form inputs |
| `bg-green-50 border border-green-200 p-4 rounded-lg` | `message-success` | Success messages |
| `bg-yellow-50 border border-yellow-200 p-4 rounded-lg` | `message-warning` | Warning messages |
| `bg-red-50 border border-red-200 p-4 rounded-lg` | `message-error` | Error messages |
| `bg-blue-50 border border-blue-200 p-4 rounded-lg` | `message-info` | Info messages |

## Best Practices

1. **Consistency First**: Always use layout components for page structure
2. **Semantic Colors**: Use design system tokens instead of hardcoded colors
3. **Component Reuse**: Leverage existing UI components before creating new ones
4. **Accessibility**: Ensure all components follow accessibility guidelines
5. **Responsive Design**: Test components across different screen sizes
6. **Performance**: Use React.memo for expensive components when appropriate

## Troubleshooting

### Common Issues

1. **Import Errors**: Ensure you're importing from the correct path
   ```jsx
   // ✅ Correct
   import { PageContainer, PageHeader, PageSection } from './layout'
   import Message from './ui/Message'
   
   // ❌ Incorrect
   import { PageContainer } from './layout/PageContainer'
   import { Message } from './ui/Message'
   ```

2. **Styling Conflicts**: Use semantic classes to avoid conflicts
   ```jsx
   // ✅ Good - Semantic class
   <div className="surface-elevated">
   
   // ❌ Avoid - Important flags
   <div className="!bg-white">
   ```

3. **Missing Props**: Check component prop requirements
   ```jsx
   // ✅ Complete
   <PageHeader title="Title" showHeroImage={true} />
   
   // ❌ Missing required prop
   <PageHeader showHeroImage={true} />
   ```

## Future Enhancements

- Add more layout variants (sidebar, multi-column)
- Expand UI component library (Modal, Dropdown, etc.)
- Add animation utilities
- Implement theme switching
- Add component testing utilities
