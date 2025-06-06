/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        "Figma Hand": ["'Figma Hand'", "sans-serif"],
      },
      colors: {
        navbar: "#81A978",
        accent: "#1CCC5D",
        dark: "#959595",
        white: "#FFFFFF",
        popup: "#F3EDCD",
        beige: "#F8F3E2",
        gray: {
          200: "#EFEFEF",
          600: "#959595",
        },
        green: {
          400: "#A7DA9B",
        },
      },
    },
  },
  plugins: [
    require("@tailwindcss/line-clamp"),
    require("@tailwindcss/typography"), // ✅ 이 줄 추가!
  ],
};