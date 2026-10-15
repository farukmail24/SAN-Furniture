/** @type {import('tailwindcss').Config['theme']} */
export const brandTokens = {
  colors: {
    navy: {
      950: '#070D1E', // Ultra-deep background
      900: '#0B132B', // Brand Primary
      800: '#1C2541', // Secondary Navy
      700: '#3A506B',
      600: '#4F6D7A',
      50: '#F0F4F8'
    },
    sand: {
      50: '#FAF8F5',  // Warm limestone body
      100: '#F4F1EA', // Card background
      200: '#E8E2D5', // Dividers & borders
      300: '#D5CDBF',
      400: '#B8AD99',
      500: '#9B8E78'
    },
    brass: {
      400: '#D9B45C',
      500: '#C89B3C', // Signature Brass/Gold accent
      600: '#B5882D',
      700: '#8F681F'
    },
    sage: {
      50: '#F1F7F4',
      600: '#3D8B68',
      700: '#2D6A4F', // Trust & Compliance
      800: '#1F4B37'
    }
  },
  fontFamily: {
    display: ['var(--font-outfit)', 'Outfit', 'sans-serif'],
    sans: ['var(--font-inter)', 'Inter', 'sans-serif']
  },
  borderRadius: {
    sm: '4px',
    md: '6px',
    lg: '8px',
    xl: '12px',
    '2xl': '16px',
    '3xl': '24px'
  },
  boxShadow: {
    ambient: '0 4px 20px -2px rgba(11, 19, 43, 0.05)',
    card: '0 8px 24px -4px rgba(11, 19, 43, 0.08)',
    elevation: '0 16px 36px -6px rgba(11, 19, 43, 0.12)',
    drawer: '0 24px 64px -12px rgba(7, 13, 30, 0.25)'
  }
};

export default brandTokens;
