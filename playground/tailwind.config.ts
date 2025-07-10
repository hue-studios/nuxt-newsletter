import type { Config } from "tailwindcss";
import defaultTheme from "tailwindcss/defaultTheme";

const config: Config = {
  darkMode: "class",

  content: [
    "./components/**/*.{vue,js,ts}",
    "./layouts/**/*.vue",
    "./pages/**/*.vue",
    "./app.vue",
    "./plugins/**/*.{js,ts}",
    "./App.{js,ts,vue}",
    "./app.{js,ts,vue}",
    "./nuxt.config.{js,ts}",
  ],

  theme: {
    container: {
      center: true,
    },
    extend: {
      maxWidth: {
        "2xlarge": "1420px",
      },
      keyframes: {
        "accordion-down": {
          from: { height: 0 },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: 0 },
        },
        bounce: {
          "0%, 20%, 53%, 80%, 100%": {
            transform: "translate3d(0,0,0)",
          },
          "40%, 43%": {
            transform: "translate3d(0, -8px, 0)",
          },
          "70%": {
            transform: "translate3d(0, -4px, 0)",
          },
          "90%": {
            transform: "translate3d(0, -2px, 0)",
          },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        bounce: "bounce 2s infinite",
        ping: "ping 2s cubic-bezier(0, 0, 0.2, 1) infinite",
        pulse: "pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
      },

      borderRadius: {
        large: "30px",
        small: "8px",
        card: "4px",
        button: "4px",
        input: "4px",
        panel: "4px",
      },
      colors: {
        primary: "#00efd1",
        blue: "#00bfff",
        red: "#e32020",
        pink: "#fb00da",
        green: "#00ff1b",
        yellow: "#fff500",
        turquoise: "#00efd1",
        turquoisePalette: {
          100: "#edfffc",
          200: "#c0fff8",
          300: "#81fff3",
          400: "#3affed",
          500: "#00efd1",
          600: "#00e2c7",
          700: "#00b7a5",
          800: "#009184",
          900: "#00726a",
        },
      },
      fontFamily: {
        sans: [
          "AvenirNextLTW01-Regular",
          "-apple-system",
          "Roboto",
          "Helvetica Neue",
          "Helvetica",
          "Arial",
          "sans-serif",
        ],
        display: [
          "Bauer Bodoni Pro_1 W05 Roman",
          "Times New Roman",
          "Times",
          "serif",
        ],
        mono: ["var(--font-mono)", ...defaultTheme.fontFamily.mono],
        signature: ["var(--font-signature)", "cursive", "sans-serif"],
        body: ["var(--font-body)"],
        bold: ["var(--font-bold)"],
        light: ["var(--font-light)"],
        serif: ["var(--font-serif)"],
        condensed: ["var(--font-condensed)"],
        "condensed-bold": ["var(--font-condensed-bold)"],
      },
      letterSpacing: {
        ...defaultTheme.letterSpacing, // ✅ Keep built-in utilities like 'tracking-wide'
        tightest: "-.075em",
        tighter: "-.05em",
        tight: "-.025em",
        normal: "0",
        wide: ".1em",
        wider: ".2em",
        widest: ".4em",
      },
    },
  },

  plugins: [],
};

export default config;
