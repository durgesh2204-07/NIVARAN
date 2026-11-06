/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        midnight: {
          950: '#060912',
          900: '#0A0E1A',
          850: '#0D1326',
          800: '#12182B',
          700: '#1A233D',
          600: '#232E52',
          500: '#4F46E5',
          400: '#6366F1',
          300: '#818CF8',
        },
        vanilla: {
          50: '#FDFCF9',
          100: '#F8F5EE',
          200: '#F2ECE0',
          300: '#E7DCB',
          400: '#D8CCA8',
          500: '#C2B28B',
        },
        brand: {
          navy: '#0D1326',
          navyLight: '#1A233D',
          navyDark: '#060912',
          teal: '#4F46E5',
          tealHover: '#4338CA',
          tealLight: '#EEF2FF',
          indigo: '#4F46E5',
          vanilla: '#F8F5EE',
        },
        surface: {
          bgLight: '#F8F5EE',
          bgDark: '#0A0E1A',
          cardLight: '#FAF7F2',
          cardDark: '#12182B',
          borderLight: '#E2D8C7',
          borderDark: '#232C4A',
        },
        textTokens: {
          primary: '#0D1326',
          secondary: '#475473',
          darkPrimary: '#F8F5EE',
          darkSecondary: '#A6B0CC',
        },
        hazard: {
          safe: '#15803D',
          watch: '#CA8A04',
          orange: '#EA580C',
          red: '#B91C1C',
        }
      },
      fontFamily: {
        heading: ['"IBM Plex Sans"', '"Noto Sans Devanagari"', 'sans-serif'],
        sans: ['"IBM Plex Sans"', '"Noto Sans Devanagari"', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'monospace'],
      },
      borderRadius: {
        'card': '14px',
        'control': '10px',
        'pill': '999px',
      },
      boxShadow: {
        'soft': '8px 8px 16px var(--shadow-dark), -8px -8px 16px var(--shadow-light)',
        'soft-sm': '4px 4px 8px var(--shadow-dark), -4px -4px 8px var(--shadow-light)',
        'soft-lg': '10px 10px 20px var(--shadow-dark), -10px -10px 20px var(--shadow-light)',
        'neu-raised': '8px 8px 16px var(--shadow-dark), -8px -8px 16px var(--shadow-light)',
        'neu-sm': '4px 4px 8px var(--shadow-dark), -4px -4px 8px var(--shadow-light)',
        'neu-inset': 'inset 4px 4px 8px var(--shadow-dark), inset -4px -4px 8px var(--shadow-light)',
      }
    },
  },
  plugins: [],
}
