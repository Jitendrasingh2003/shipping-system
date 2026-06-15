/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        slate: {
          950: '#0b0f19',
          900: '#111827',
          800: '#1f2937',
          700: '#374151',
          600: '#4b5563',
          400: '#9ca3af',
          100: '#f3f4f6',
        },
        indigo: {
          500: '#6366f1',
          600: '#4f46e5',
          700: '#4338ca',
        },
        cyan: {
          400: '#22d3ee',
          500: '#06b6d4',
        }
      },
      fontFamily: {
        sans: ['Outfit', 'Inter', 'sans-serif'],
      },
      boxShadow: {
        'glow-indigo': '0 0 15px rgba(99, 102, 241, 0.4)',
        'glow-cyan': '0 0 15px rgba(34, 211, 238, 0.4)',
        'glass': '0 8px 32px 0 rgba(15, 23, 42, 0.3)',
      }
    },
  },
  plugins: [],
}
