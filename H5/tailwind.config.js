/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#2563EB',
        positive: '#34C759',
        negative: '#FF3B30',
        background: '#F5F7FA',
        'gray-100': '#F2F3F5',
        'gray-200': '#E5E6EB',
        'gray-500': '#86909C',
        'gray-900': '#1D2129',
      },
    },
  },
  plugins: [],
}