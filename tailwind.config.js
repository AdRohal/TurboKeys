/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f7f4f8',
          100: '#ede7f0',
          200: '#ddd2e2',
          300: '#c4b0cd',
          400: '#a688b3',
          500: '#8d629b',
          600: '#704d7f',
          700: '#5a3e67',
          800: '#4b3355',
          900: '#371931',
          950: '#25101f',
        },
        ember: { 200: '#ffe3c4', 300: '#ffca8d', 400: '#f5b06a' },
        dark: {
          100: '#1f2937',
          200: '#374151',
          300: '#4b5563',
          400: '#6b7280',
          500: '#9ca3af',
          600: '#d1d5db',
          700: '#e5e7eb',
          800: '#f3f4f6',
          900: '#f9fafb',
        }
      },
      fontFamily: {
        sans: ['var(--font-sans)', 'system-ui', 'sans-serif'],
        mono: ['var(--font-mono)', 'ui-monospace', 'Consolas', 'monospace'],
      },
      boxShadow: {
        panel: '0 1px 0 0 rgb(255 255 255 / 0.04) inset, 0 18px 40px -18px rgb(10 2 12 / 0.7)',
        lift: '0 10px 24px -12px rgb(10 2 12 / 0.55)',
      },
      animation: {
        'typing': 'typing 0.5s ease-in-out infinite alternate',
        'fadeIn': 'fadeIn 0.5s ease-in-out',
      },
      keyframes: {
        typing: {
          '0%': { opacity: '1' },
          '100%': { opacity: '0.3' },
        },
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        }
      }
    },
  },
  plugins: [],
}
