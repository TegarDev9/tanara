import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-poppins)", "system-ui", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "Roboto", "Helvetica Neue", "Arial", "Noto Sans", "sans-serif"],
      },
      colors: {
        background: "#121212",      // Dark background
        foreground: "#E0E0E0",      // Light gray text
        "muted-foreground": "#A0A0A0", // Muted gray text
        card: "#1E1E1E",             // Slightly lighter card background
        border: "#333333",           // Darker border
        primary: "#FFFFFF",           // White for primary actions (buttons, highlights on dark bg)
        "primary-foreground": "#121212", // Black text for primary elements
        // You can add accent colors if needed later, e.g., a subtle blue or green for links/accents
        // accent: "#4A90E2", 
        // "accent-foreground": "#FFFFFF",
      },
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "gradient-conic":
          "conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))",
      },
    },
  },
  plugins: [],
};
export default config;
