/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          primary: '#ffdd60',
          surface: '#fef9c2',
          dark: '#0c0a09'
        },
        surface: {
          light: '#fef9c2',
          card: '#ffdd60',
          dark: '#0c0a09'
        },
        text: {
          base: '#1f2937',
          subtle: '#6b7280',
          onDark: '#e5e7eb',
          onLight: '#0c0a09'
        },
        border: {
          subtle: '#e5e7eb',
          dark: '#1c1917'
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
        'display-1': ['44px', { lineHeight: '1.2', fontWeight: '900' }],
        'display-2': ['36px', { lineHeight: '1.25', fontWeight: '800' }],
        'display-3': ['30px', { lineHeight: '1.3', fontWeight: '800' }]
      },
      boxShadow: {
        card: '0 1px 2px 0 rgb(0 0 0 / 0.06), 0 1px 3px 0 rgb(0 0 0 / 0.10)'
      },
      spacing: {
        nav: '14px'
      }
    },
  },
  plugins: [],
}