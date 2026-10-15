import type { Config } from "tailwindcss";

const brandTokens = {
  colors: {
    navy: {
      50: '#F0F4F8',
      600: '#4F6D7A',
      700: '#3A506B',
      800: '#1C2541',
      900: '#0B132B',
      950: '#070D1E',
    },
    sand: {
      50: '#FAF8F5',
      100: '#F4F1EA',
      200: '#E8E2D5',
      300: '#D5CDBF',
      400: '#B8AD99',
      500: '#9B8E78',
    },
    brass: {
      400: '#D9B45C',
      500: '#C89B3C',
      600: '#B5882D',
      700: '#8F681F',
    },
    sage: {
      50: '#F1F7F4',
      600: '#3D8B68',
      700: '#2D6A4F',
      800: '#1F4B37',
    },
    terracotta: {
      400: '#E07A5F',
      500: '#C85A32',
      600: '#B34A25',
    },
  },
  fontFamily: {
    display: ['var(--font-outfit)', 'Outfit', 'sans-serif'],
    sans: ['var(--font-inter)', 'Inter', 'sans-serif'],
  },
  borderRadius: {
    sm: '4px',
    md: '6px',
    lg: '8px',
    xl: '12px',
    '2xl': '16px',
    '3xl': '24px',
  },
  boxShadow: {
    ambient: '0 4px 20px -2px rgba(11, 19, 43, 0.05)',
    card: '0 8px 24px -4px rgba(11, 19, 43, 0.08)',
    elevation: '0 16px 36px -6px rgba(11, 19, 43, 0.12)',
    drawer: '0 24px 64px -12px rgba(7, 13, 30, 0.25)',
  },
};

const config: Config = {
  darkMode: ["class"],
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
        border: "var(--border)",
        input: "var(--input)",
        ring: "var(--ring)",
        card: "var(--card)",
        "card-foreground": "var(--card-foreground)",
        primary: "var(--primary)",
        "primary-foreground": "var(--primary-foreground)",
        secondary: "var(--secondary)",
        "secondary-foreground": "var(--secondary-foreground)",
        muted: "var(--muted)",
        "muted-foreground": "var(--muted-foreground)",
        accent: "var(--accent)",
        "accent-foreground": "var(--accent-foreground)",
        navy: brandTokens.colors.navy,
        sand: brandTokens.colors.sand,
        brass: brandTokens.colors.brass,
        sage: brandTokens.colors.sage,
        terracotta: brandTokens.colors.terracotta,
      },
      fontFamily: {
        display: brandTokens.fontFamily.display,
        sans: brandTokens.fontFamily.sans,
      },
      borderRadius: brandTokens.borderRadius,
      boxShadow: brandTokens.boxShadow,
    },
  },
  plugins: [],
};

export default config;
