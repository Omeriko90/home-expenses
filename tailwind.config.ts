import type { Config } from "tailwindcss";
import { colors } from "./lib/design-tokens";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors,
      borderRadius: {
        sm: "calc(0.75rem - 4px)",
        md: "calc(0.75rem - 2px)",
        lg: "0.75rem",
        xl: "calc(0.75rem + 4px)",
      },
      boxShadow: {
        xs: "0 1px 2px rgba(48, 43, 53, 0.05)",
        sm: "0 3px 8px rgba(48, 43, 53, 0.07)",
        md: "0 8px 20px rgba(48, 43, 53, 0.09)",
        divider: `0 1px 0 ${colors.border.DEFAULT}`,
      },
      fontFamily: {
        sans: ["var(--font-sans)", "ui-sans-serif", "system-ui", "sans-serif"],
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
};

export default config;
