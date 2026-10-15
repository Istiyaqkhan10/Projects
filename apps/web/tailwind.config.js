/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#fdf8f6",
          100: "#f2e8e5",
          500: "#c85a32",
          600: "#b0431f",
          900: "#431b0e",
        },
      },
    },
  },
  plugins: [],
}
