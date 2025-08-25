/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          light: "#edfbe2",   // fond principal
          DEFAULT: "#54b435", // vert marque
          dark: "#222222",    // texte sombre
        },
        white: "#ffffff",
      },
      borderRadius: {
        "2xl": "1rem",
      },
      boxShadow: {
        soft: "0 10px 30px -10px rgba(0,0,0,0.15)",
      },
    },
  },
  plugins: [],
};
