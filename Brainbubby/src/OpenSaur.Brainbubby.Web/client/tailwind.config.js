/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{html,ts}"
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: '#ec6530',
          hover: '#d9531e',
          active: '#bf4314',
          subtle: '#fff2ec',
          border: '#fcd8c9'
        },
        slate: {
          canvas: '#f8f9fa',
          surface: '#ffffff',
          subtle: '#fbfbfb',
          muted: '#f5f5f4'
        },
        stone: {
          50: '#fafaf9',
          100: '#f5f5f4',
          200: '#e7e5e4',
          300: '#d6d3d1',
          400: '#a8a29e',
          500: '#78716c',
          600: '#57534e',
          700: '#44403c',
          800: '#292524',
          900: '#1c1917',
        },
        text: {
          primary: '#1c1917',
          secondary: '#57534e',
          muted: '#a8a29e'
        },
        border: {
          default: '#e7e5e4',
          subtle: '#f5f5f4',
          strong: '#d6d3d1'
        }
      },
      fontFamily: {
        sans: ['"Be Vietnam Pro"', 'system-ui', 'sans-serif'],
        mono: ['"Fira Code"', 'Consolas', 'monospace']
      }
    },
  },
  plugins: [],
}
