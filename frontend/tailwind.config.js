/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        base: {
          bg: "#171B26",
          surface: "#20263A",
          surface2: "#262E45",
          border: "#333D57",
          text: "#E9ECF5",
          muted: "#8B93A8",
        },
        champion: { DEFAULT: "#D4A24C", dim: "#3A3122" },
        loyal: { DEFAULT: "#4C9A8C", dim: "#1E332F" },
        newcust: { DEFAULT: "#5B8DEF", dim: "#1E2A40" },
        atrisk: { DEFAULT: "#E0665B", dim: "#3A2422" },
      },
      fontFamily: {
        display: ["IBM Plex Sans", "sans-serif"],
        body: ["Inter", "sans-serif"],
        mono: ["JetBrains Mono", "monospace"],
      },
    },
  },
  plugins: [],
};
