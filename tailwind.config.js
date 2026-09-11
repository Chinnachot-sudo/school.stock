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
        paper: {
          DEFAULT: '#F7F4EF',
          bg: '#F7F4EF',
          surface: '#FFFFFF',
          border: '#E5E0D8',
          text: '#1A1A1A',
          muted: '#6B6560',
        },
        forest: {
          DEFAULT: '#1F4D3A',
          hover: '#183D2E',
          soft: '#E8F0EB',
        },
        terracotta: {
          DEFAULT: '#C45C26',
          hover: '#A84B1E',
          soft: '#FDF1EB',
        },
        school: {
          bg: '#F7F4EF',
          surface: '#FFFFFF',
          border: '#E5E0D8',
          text: '#1A1A1A',
          muted: '#6B6560',
          primary: '#1F4D3A',
          'primary-hover': '#183D2E',
          'primary-soft': '#E8F0EB',
          accent: '#C45C26',
          'accent-hover': '#A84B1E',
          'accent-soft': '#FDF1EB',
          warning: '#B54708',
          'warning-soft': '#FEF0C7',
          danger: '#B42318',
          'danger-soft': '#FEE4E2',
          success: '#027A48',
          'success-soft': '#D1FADF',
        }
      },
      fontFamily: {
        sans: ['Sarabun', 'IBM Plex Sans Thai', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'Monaco', 'Consolas', 'monospace'],
      },
      borderRadius: {
        DEFAULT: '8px',
        md: '8px',
        lg: '10px',
        xl: '12px',
        '2xl': '16px',
      }
    },
  },
  plugins: [],
};
