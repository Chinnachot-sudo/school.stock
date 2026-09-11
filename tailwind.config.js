/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        donezo: {
          bg: '#F3F4F6',
          surface: '#FFFFFF',
          border: '#E5E7EB',
          text: '#111827',
          muted: '#6B7280',
          primary: '#0B6B4F',
          'primary-dark': '#0F3D2E',
          'primary-soft': '#E6F5EF',
          'accent-mint': '#34D399',
          danger: '#B42318',
          warning: '#B54708',
          'warning-soft': '#FEF0C7',
          success: '#027A48',
        },
        paper: {
          DEFAULT: '#F3F4F6',
          bg: '#F3F4F6',
          surface: '#FFFFFF',
          border: '#E5E7EB',
          text: '#111827',
          muted: '#6B7280',
        },
        forest: {
          DEFAULT: '#0B6B4F',
          hover: '#0F3D2E',
          soft: '#E6F5EF',
        },
        terracotta: {
          DEFAULT: '#0B6B4F',
          hover: '#0F3D2E',
          soft: '#E6F5EF',
        },
        school: {
          bg: '#F3F4F6',
          surface: '#FFFFFF',
          border: '#E5E7EB',
          text: '#111827',
          muted: '#6B7280',
          primary: '#0B6B4F',
          'primary-hover': '#0F3D2E',
          'primary-soft': '#E6F5EF',
          accent: '#34D399',
          'accent-hover': '#0B6B4F',
          'accent-soft': '#E6F5EF',
          warning: '#B54708',
          'warning-soft': '#FEF0C7',
          danger: '#B42318',
          'danger-soft': '#FEE4E2',
          success: '#027A48',
          'success-soft': '#D1FADF',
        }
      },
      fontFamily: {
        sans: ['IBM Plex Sans Thai', 'Sarabun', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'Monaco', 'Consolas', 'monospace'],
      },
      borderRadius: {
        DEFAULT: '10px',
        sm: '6px',
        md: '10px',
        lg: '14px',
        xl: '18px',
        '2xl': '22px',
        '3xl': '26px',
      }
    },
  },
  plugins: [],
};
