/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{html,ts}"
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: '#00ccff',
          hover: '#00b4e6',
          active: '#009cc8',
          subtle: '#e6faff'
        },
        slate: {
          canvas: '#edf3f8',
          surface: '#ffffff',
          subtle: '#f8fafc',
          muted: '#f1f5f9'
        },
        text: {
          primary: '#1e293b',
          secondary: '#64748b',
          muted: '#94a3b8'
        },
        border: {
          default: '#cbd5e1',
          subtle: '#e2e8f0'
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
