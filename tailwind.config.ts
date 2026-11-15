import type { Config } from "tailwindcss";

/**
 * Design tokens — "Soft Plum & Pastel" (light only).
 * Warm · playful · fresh · friendly · modern.
 *
 * All token *values* live here (no runtime CSS variables — the app is
 * single-theme). Wired in via `@config "../tailwind.config.ts"` in globals.css.
 */
const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#fbf9f7",
        surface: {
          DEFAULT: "#ffffff",
          muted: "#f4f0f5",
          subtle: "#eeeaf0",
        },
        foreground: "#302b35", // text.primary
        "muted-foreground": "#6b6571", // text.secondary
        faint: "#89838e", // text.muted
        disabled: "#b9b4be", // text.disabled

        primary: {
          DEFAULT: "#756487",
          hover: "#675775",
          pressed: "#594a67",
          foreground: "#ffffff",
          tint: "#f0ecf5",
        },
        secondary: {
          DEFAULT: "#dfa5b1",
          tint: "#f9eef0",
        },
        accent: {
          DEFAULT: "#e9c77d",
          tint: "#fbf5e7",
        },

        success: {
          DEFAULT: "#347b65",
          hover: "#2d6c59",
          pressed: "#255b4b",
          foreground: "#ffffff",
          subtle: "#e5f3ed", // background
          border: "#bfe0d1",
        },
        danger: {
          DEFAULT: "#b85f68", // error
          hover: "#a9515b",
          pressed: "#914650",
          foreground: "#ffffff",
          subtle: "#f9e9e9",
          border: "#ebc8cb",
        },
        warning: {
          DEFAULT: "#98702d",
          hover: "#855f25",
          pressed: "#704f1f",
          foreground: "#ffffff",
          subtle: "#fbf3e2",
          border: "#eeddb5",
        },
        info: {
          DEFAULT: "#52769f",
          hover: "#46678d",
          pressed: "#395778",
          foreground: "#ffffff",
          subtle: "#eaf0f8",
          border: "#c9d8eb",
        },

        income: {
          DEFAULT: "#70b69d",
          tint: "#e7f3ed",
        },
        expense: {
          DEFAULT: "#e18f87",
          tint: "#faece9",
        },
        investment: {
          DEFAULT: "#9685bb",
          tint: "#f0ecf6",
        },
        neutral: {
          DEFAULT: "#929ba5",
          tint: "#f0f2f4",
        },

        border: {
          DEFAULT: "#e9e3eb",
          strong: "#cec5d3",
        },
        input: "#cec5d3",
        ring: "#9a83b0",
      },
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
        // Bottom divider for sticky table headers (collapsed borders don't
        // render on sticky elements, so a shadow is used instead).
        divider: "0 1px 0 #e9e3eb",
      },
      fontFamily: {
        // --font-sans is injected by next/font on <html>.
        sans: ["var(--font-sans)", "ui-sans-serif", "system-ui", "sans-serif"],
      },
    },
  },
};

export default config;
