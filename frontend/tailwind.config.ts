import type { Config } from "tailwindcss";
import { fontFamily } from "tailwindcss/defaultTheme";

export default {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
      },
      fontFamily: {
        satoshi: ['Satoshi', ...fontFamily.sans],
        gambarino: ['Gambarino', ...fontFamily.sans],
        switzer: ['Switzer', ...fontFamily.sans],
        sans: ['Satoshi', ...fontFamily.sans],
      },
    },
  },
  plugins: [],
} satisfies Config;