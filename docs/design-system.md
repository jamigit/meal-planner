# Design System

## Design Tokens

### Colors
Defined in `tailwind.config.js`:

```javascript
colors: {
  brand: {
    primary: '#000000',
    secondary: '#6B7280',
    accent: '#F59E0B',
    surface: '#F9FAFB'
  },
  surface: {
    page: '#F9FAFB',
    elevated: '#FFFFFF'
  },
  text: {
    primary: '#111827',
    secondary: '#6B7280',
    tertiary: '#9CA3AF'
  },
  message: {
    success: '#D1FAE5',
    successText: '#065F46',
    warning: '#FEF3C7',
    warningText: '#92400E',
    error: '#FEE2E2',
    errorText: '#991B1B',
    info: '#DBEAFE',
    infoText: '#1E40AF'
  }
}
```

### Typography
Defined in `tailwind.config.js`:

```javascript
fontSize: {
  'h1': ['2.25rem', { lineHeight: '2.5rem', fontWeight: '900' }],
  'h2': ['1.875rem', { lineHeight: '2.25rem', fontWeight: '800' }],
  'h3': ['1.5rem', { lineHeight: '2rem', fontWeight: '700' }],
  'h4': ['1.25rem', { lineHeight: '1.75rem', fontWeight: '600' }],
  'h5': ['1.125rem', { lineHeight: '1.75rem', fontWeight: '600' }],
  'h6': ['1rem', { lineHeight: '1.5rem', fontWeight: '600' }]
}
```

### Spacing
Defined in `tailwind.config.js`:

```javascript
spacing: {
  'nav': '4rem',
  'button-sm': '0.5rem',
  'button-md': '0.75rem',
  'button-lg': '1rem',
  'input-padding': '0.75rem',
  'card-padding': '1.5rem'
}
```

## Layout Components

### PageContainer
**File**: `src/components/layout/PageContainer.jsx`

```jsx
<PageContainer className="optional-additional-classes">
  {/* Page content */}
</PageContainer>
```

**Features**:
- Consistent max-width and padding
- Background color from design tokens
- Responsive spacing (py-8 md:py-12)

### PageHeader
**File**: `src/components/layout/PageHeader.jsx`

```jsx
<PageHeader 
  title="Page Title"
  subtitle="Optional subtitle"
  showHeroImage={true}
  actions={<Button>Action</Button>}
/>
```

**Features**:
- Consistent title styling (h1 with design tokens)
- Optional hero image positioning
- Action buttons on the right
- Responsive layout

### PageSection
**File**: `src/components/layout/PageSection.jsx`

```jsx
<PageSection variant="card">
  {/* Section content */}
</PageSection>
```

**Variants**:
- `default` - Basic spacing only
- `card` - Card styling with background and padding
- `elevated` - White background with shadow

## UI Components

### Message
**File**: `src/components/ui/Message.jsx`

```jsx
<Message variant="success">Success message</Message>
<Message variant="warning">Warning message</Message>
<Message variant="error">Error message</Message>
<Message variant="info">Info message</Message>
```

**Variants**:
- `success` - Green background with dark green text
- `warning` - Yellow background with dark yellow text
- `error` - Red background with dark red text
- `info` - Blue background with dark blue text

### Button
**File**: `src/components/ui/Button.jsx`

```jsx
<Button variant="primary" size="md">Primary Button</Button>
<Button variant="secondary" size="sm">Secondary Button</Button>
<Button variant="tertiary" size="lg">Tertiary Button</Button>
```

**Variants**:
- `primary` - Black background, white text
- `secondary` - White background, black border
- `tertiary` - Transparent background, black text

**Sizes**:
- `sm` - Small padding and text
- `md` - Medium padding and text (default)
- `lg` - Large padding and text

### Input
**File**: `src/components/ui/Input.jsx`

```jsx
<Input 
  placeholder="Enter text..."
  value={value}
  onChange={handleChange}
/>
```

**Features**:
- Consistent styling with design tokens
- Focus states with ring colors
- Placeholder text styling

### MultiSelectDropdown
**File**: `src/components/ui/MultiSelectDropdown.jsx`

```jsx
<MultiSelectDropdown
  label="Select Options"
  placeholder="Choose items..."
  options={optionsArray}
  selectedValues={selectedArray}
  onChange={setSelectedArray}
/>
```

**Features**:
- Checkbox-based multi-select
- Search functionality
- Clear individual items or all
- Selected count badges
- Design system styling

## Utility Classes

### Custom CSS Classes
Defined in `src/index.css`:

```css
/* Card variants */
.card { /* Base card styling */ }
.card-elevated { /* Elevated card with shadow */ }

/* Button variants */
.btn-primary { /* Primary button styling */ }
.btn-secondary { /* Secondary button styling */ }
.btn-outline-black { /* Outline button styling */ }

/* Surface variants */
.surface-page { /* Page background */ }
.surface-elevated { /* Elevated surface */ }

/* Input variants */
.input-standard { /* Standard input styling */ }

/* Message variants */
.message-success { /* Success message styling */ }
.message-warning { /* Warning message styling */ }
.message-error { /* Error message styling */ }
.message-info { /* Info message styling */ }
```

## Usage Guidelines

### Do's ✅
- Use layout components (`PageContainer`, `PageHeader`, `PageSection`) for consistent page structure
- Use design tokens from `tailwind.config.js` and `src/utils/designSystem.js`
- Use `Message` component for all alerts and notifications
- Use `Button` component with appropriate variants
- Use `MultiSelectDropdown` for multi-select functionality
- Use semantic color classes (`.surface-page`, `.text-primary`)

### Don'ts ❌
- Don't use hardcoded colors (`bg-white`, `text-gray-900`) - use design tokens
- Don't create custom card styling - use `.card` or `.card-elevated`
- Don't use inline styles for spacing - use Tailwind classes
- Don't create custom button styling - use `Button` component
- Don't use hardcoded message styling - use `Message` component

### Component Patterns

#### Page Structure
```jsx
function MyPage() {
  return (
    <PageContainer>
      <PageHeader 
        title="Page Title"
        subtitle="Optional subtitle"
        actions={<Button>Action</Button>}
      />
      
      <PageSection variant="card">
        {/* Main content */}
      </PageSection>
      
      <PageSection variant="card">
        {/* Secondary content */}
      </PageSection>
    </PageContainer>
  )
}
```

#### Form Structure
```jsx
function MyForm() {
  return (
    <form className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-text-primary mb-2">
          Label
        </label>
        <Input 
          placeholder="Enter value..."
          value={value}
          onChange={handleChange}
        />
      </div>
      
      <div className="flex gap-3">
        <Button type="submit">Submit</Button>
        <Button variant="secondary">Cancel</Button>
      </div>
    </form>
  )
}
```

#### Error Handling
```jsx
function MyComponent() {
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)
  
  return (
    <div>
      {error && (
        <Message variant="error" className="mb-4">
          {error}
        </Message>
      )}
      
      {success && (
        <Message variant="success" className="mb-4">
          {success}
        </Message>
      )}
      
      {/* Component content */}
    </div>
  )
}
```

## Accessibility

### ARIA Attributes
- All interactive elements have proper ARIA labels
- Form inputs have associated labels
- Error messages use `role="alert"`
- Loading states are announced to screen readers

### Focus Management
- Focus rings use design system colors
- Tab order follows logical flow
- Modal focus trapping implemented
- Skip links for main content

### Color Contrast
- All text meets WCAG AA contrast requirements
- Error states use high contrast colors
- Focus indicators are clearly visible
