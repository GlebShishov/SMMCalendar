/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: '#3B82F6',
        secondary: '#10B981',
        background: '#F9FAFB',
        card: '#FFFFFF',
        text: '#1F2937',
        dark: {
          background: '#1F2937',
          card: '#374151',
          text: '#F9FAFB',
        }
      },
    },
  },
  plugins: [],
}
