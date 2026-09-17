/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'Segoe UI', 'sans-serif'],
        mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
      },
      colors: {
        ink: '#12161c',
        muted: '#5b6472',
        line: '#e3e7ed',
        surface: '#f7f8fa',
        accent: '#1c5fd6',
        flag: '#b45309',
        bad: '#b42318',
        good: '#087443',
      },
    },
  },
  plugins: [],
}
