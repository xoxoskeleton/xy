import type { Config } from 'tailwindcss'

const config: Config = {
  content: ['./pages/**/*.{ts,tsx}', './components/**/*.{ts,tsx}', './lib/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        tray: {
          frequent: '#fda4af',
          growing: '#fdba74',
          strong: '#86efac',
          mastered: '#93c5fd'
        }
      }
    }
  },
  plugins: []
}

export default config
