/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        mono: ['IBM Plex Mono', 'ui-monospace', 'SFMono-Regular']
      },
      colors: {
        sentinel: {
          bg: '#070b11',
          panel: '#101826',
          border: '#1f2f47',
          neon: '#18f2b2',
          warn: '#f5b042',
          danger: '#ff4d6d'
        }
      }
    }
  },
  plugins: []
};
