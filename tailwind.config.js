/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Brand colors
        brand: {
          primary: '#ffdd60',
          surface: '#fef9c2',
          dark: '#0c0a09'
        },
        
        // Surface colors
        surface: {
          light: '#fef9c2',
          card: '#ffdd60',
          dark: '#0c0a09',
          overlay: 'rgba(0, 0, 0, 0.5)',
          page: '#fef9c2',        // bg-surface-page (replaces bg-gray-50 for pages)
          elevated: '#ffffff'     // bg-surface-elevated (replaces bg-white)
        },
        
        // Semantic message colors
        message: {
          success: '#dcfce7',     // message-success (replaces bg-green-50)
          'success-text': '#166534',
          warning: '#fef3c7',     // message-warning (replaces bg-yellow-50)
          'warning-text': '#92400e',
          error: '#fee2e2',       // message-error (replaces bg-red-50)
          'error-text': '#991b1b',
          info: '#dbeafe',        // message-info (replaces bg-blue-50)
          'info-text': '#1e40af'
        },
        
        // Text colors (flattened for better Tailwind class generation)
        'text-primary': '#0c0a09',
        'text-secondary': '#6b7280', 
        'text-tertiary': '#9ca3af',
        'text-inverse': '#ffffff',
        'text-on-dark': '#e5e7eb',
        'text-on-light': '#0c0a09',
        
        // Border colors (flattened)
        'border-primary': '#000000',
        'border-secondary': '#e5e7eb',
        'border-tertiary': '#d1d5db',
        'border-dark': '#1c1917',
        
        // Semantic colors
        semantic: {
          success: '#059669',
          'success-light': '#10b981',
          warning: '#d97706',
          'warning-light': '#f59e0b',
          error: '#dc2626',
          'error-light': '#ef4444',
          info: '#3b82f6'
        },
        
        // Interactive states
        state: {
          hover: 'rgba(0, 0, 0, 0.05)',
          'hover-dark': 'rgba(255, 255, 255, 0.1)',
          active: 'rgba(0, 0, 0, 0.1)',
          focus: '#3b82f6',
          disabled: '#f3f4f6'
        }
      },
      fontFamily: {
        sans: ['Nunito', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        heading: ['Cabinet Grotesk', 'ui-sans-serif', 'system-ui', 'sans-serif']
      },
      borderRadius: {
        xs: '6px',
        md: '10px',
        lg: '14px',
        xl: '18px'
      },
      fontSize: {
        // HTML Heading typography (matches h1-h6)
        'h1': ['48px', { lineHeight: '1.2', fontWeight: '900' }],        // Was display-1
        'h2': ['56px', { lineHeight: '1.25', fontWeight: '900' }],       // Current h2 size
        'h3': ['24px', { lineHeight: '1.35', fontWeight: '900' }],       // Current h3 size  
        'h4': ['26px', { lineHeight: '1.35', fontWeight: '900' }],       // Current h4 size
        'h5': ['20px', { lineHeight: '1.4', fontWeight: '900' }],        // Current h5 size
        'h6': ['16px', { lineHeight: '1.45', fontWeight: '900' }],       // Current h6 size
        
        // Display typography (for special large text)
        'display-1': ['64px', { lineHeight: '1.1', fontWeight: '900' }], // Larger than h1
        'display-2': ['48px', { lineHeight: '1.2', fontWeight: '900' }], // Same as h1
        'display-3': ['36px', { lineHeight: '1.25', fontWeight: '800' }], // Between h2 and h3
        
        // Button typography
        'button-lg': ['20px', { lineHeight: '1.2', fontWeight: '900' }],
        'button-md': ['18px', { lineHeight: '1.2', fontWeight: '900' }],
        'button-sm': ['14px', { lineHeight: '1.2', fontWeight: '900' }],
        
        // UI typography
        'ui-lg': ['16px', { lineHeight: '1.5', fontWeight: '500' }],
        'ui-md': ['14px', { lineHeight: '1.5', fontWeight: '500' }],
        'ui-sm': ['12px', { lineHeight: '1.5', fontWeight: '500' }]
      },
      boxShadow: {
        card: '0 1px 2px 0 rgb(0 0 0 / 0.06), 0 1px 3px 0 rgb(0 0 0 / 0.10)',
        'card-hover': '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
        button: '0 6px 0 #000000',
        modal: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)'
      },
      spacing: {
        nav: '14px',
        // Component spacing
        'button-sm': '8px',
        'button-md': '12px',
        'button-lg': '16px',
        'input-padding': '12px',
        'card-padding': '24px'
      }
    },
  },
  plugins: [],
}