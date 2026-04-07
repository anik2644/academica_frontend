/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{html,ts}", "./src/**/*.html", "./src/**/*.ts"],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f0f6ff',
          100: '#e0ecff',
          200: '#c7dcff',
          300: '#a4c7ff',
          400: '#7aa7ff',
          500: '#5687f7',
          600: '#1565C0',
          700: '#1250a4',
          800: '#104083',
          900: '#0d2e61',
          950: '#081a3e',
        },
        accent: {
          50: '#f0fdfb',
          100: '#d8faf4',
          200: '#b0f2e8',
          300: '#7eddd6',
          400: '#4fc3c2',
          500: '#35a9ad',
          600: '#00897B',
          700: '#006d64',
          800: '#025a50',
          900: '#024641',
          950: '#002d28',
        },
        success: '#10b981',
        warning: '#f59e0b',
        error: '#ef4444',
        info: '#3b82f6',
      },
      spacing: {
        'sidebar-expanded': '260px',
        'sidebar-collapsed': '64px',
      },
    },
  },
  plugins: [require("@tailwindcss/typography")],
};
