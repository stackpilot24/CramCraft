import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: 'class',
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        background: '#FDF6EC',
        primary: {
          DEFAULT: '#E6B566',
          50:  '#FEF8EC',
          100: '#FDF0CC',
          200: '#FAE096',
          300: '#F5C85A',
          400: '#EDBA48',
          500: '#E6B566',
          600: '#D4994A',
          700: '#B87D35',
          800: '#8A5E28',
          900: '#5C3E1A',
        },
        accent: {
          DEFAULT: '#C77DFF',
          50:  '#F9F0FF',
          100: '#F2DFFF',
          200: '#E5BFFF',
          300: '#D49AFF',
          400: '#C77DFF',
          500: '#B55FE8',
          600: '#9A44CC',
          700: '#7A2FAD',
          800: '#5A1F8A',
          900: '#3D1163',
        },
        // Warm leather brown scale — replaces default gray
        // dark:bg-gray-900 → #2C1810, text-gray-400 → warm muted, etc.
        gray: {
          50:  '#FDF6EC',
          100: '#F5E8D4',
          200: '#E8D5C4',
          300: '#D4B896',
          400: '#A8896E',
          500: '#8A6E58',
          600: '#6B5344',
          700: '#523D30',
          800: '#3D2B1F',
          900: '#2C1810',
          950: '#1A0E09',
        },
        success: '#4CAF50',
        danger: '#E57373',
        card: '#FFFFFF',
        brown: {
          dark:   '#2C1810',
          medium: '#4A2C20',
          light:  '#7A6352',
          cream:  '#FDF6EC',
        },
      },
      fontFamily: {
        serif: ['Playfair Display', 'Georgia', 'serif'],
        sans: ['DM Sans', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        card: '0 1px 3px 0 rgba(44,24,16,0.08), 0 1px 2px -1px rgba(44,24,16,0.06)',
        'card-hover': '0 4px 12px 0 rgba(44,24,16,0.14), 0 2px 4px -1px rgba(44,24,16,0.10)',
        'card-lg': '0 8px 24px 0 rgba(44,24,16,0.14), 0 4px 8px -2px rgba(44,24,16,0.10)',
      },
      keyframes: {
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        flip: {
          '0%': { transform: 'rotateY(0deg)' },
          '100%': { transform: 'rotateY(180deg)' },
        },
        'flip-back': {
          '0%': { transform: 'rotateY(180deg)' },
          '100%': { transform: 'rotateY(0deg)' },
        },
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        fadeUp: {
          '0%': { opacity: '0', transform: 'translateY(22px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        fadeDown: {
          '0%': { opacity: '0', transform: 'translateY(-10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        shimmer: 'shimmer 2s linear infinite',
        'fade-in': 'fadeIn 0.3s ease-out',
        'fade-up': 'fadeUp 0.5s cubic-bezier(0.22,1,0.36,1) both',
        'fade-down': 'fadeDown 0.4s cubic-bezier(0.22,1,0.36,1) both',
      },
      perspective: {
        '1000': '1000px',
      },
    },
  },
  plugins: [require('@tailwindcss/typography')],
};

export default config;
