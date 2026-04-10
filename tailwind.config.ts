import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: {
          page: "#0D1117",
          card: "#161B22",
          row: "#1C2128",
        },
        border: {
          card: "#21262D",
        },
        text: {
          primary: "#E6EDF3",
          secondary: "#8B949E",
          muted: "#6E7681",
        },
        up: "#3FB950",
        down: "#F85149",
        blue: "#58A6FF",
        purple: "#D2A8FF",
        warning: "#E3B341",
      },
      fontFamily: {
        mono: ["JetBrains Mono", "Fira Code", "Consolas", "monospace"],
      },
    },
  },
  plugins: [],
};
export default config;
