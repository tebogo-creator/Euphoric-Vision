/** @type {import('tailwindcss').Config} */
const c = (name) => `rgb(var(--c-${name}) / <alpha-value>)`
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        paper: c('paper'),
        ivory: c('ivory'),
        card: c('card'),
        ink: c('ink'),
        'ink-soft': c('ink-soft'),
        line: c('line'),
        forest: c('forest'),
        'forest-deep': c('forest-deep'),
        'on-forest': c('on-forest'),
        sage: c('sage'),
        amber: c('amber'),
        'amber-soft': c('amber-soft'),
      },
      fontFamily: {
        display: ['"Cormorant Garamond"', 'Georgia', '"Times New Roman"', 'serif'],
        sans: ['"Instrument Sans"', 'system-ui', '-apple-system', '"Segoe UI"', 'Roboto', 'sans-serif'],
      },
      maxWidth: { prose: '68ch' },
    },
  },
  plugins: [],
}
