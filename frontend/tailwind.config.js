/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f0eeff',
          100: '#e4e0ff',
          200: '#cdc5ff',
          300: '#ae9dff',
          400: '#8b6dff',
          500: '#6C63FF',
          600: '#5a4de0',
          700: '#4a3dbb',
          800: '#3b3098',
          900: '#2f267a',
        },
        dark: {
          900: '#0A0F1E',
          800: '#0d1426',
          700: '#111827',
          600: '#1a2235',
          500: '#1e2a3d',
          400: '#243047',
          300: '#2d3a52',
        },
        accent: {
          cyan: '#00D4FF',
          violet: '#6C63FF',
          pink: '#FF6B9D',
          amber: '#FFB347',
          green: '#00C896',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      backgroundImage: {
        'gradient-primary': 'linear-gradient(135deg, #6C63FF 0%, #00D4FF 100%)',
        'gradient-dark': 'linear-gradient(135deg, #0A0F1E 0%, #1a2235 100%)',
        'glass': 'linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.02) 100%)',
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-in-out',
        'slide-in': 'slideIn 0.3s ease-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'spin-slow': 'spin 3s linear infinite',
      },
      keyframes: {
        fadeIn: { '0%': { opacity: '0' }, '100%': { opacity: '1' } },
        slideIn: { '0%': { transform: 'translateX(-20px)', opacity: '0' }, '100%': { transform: 'translateX(0)', opacity: '1' } },
        slideUp: { '0%': { transform: 'translateY(10px)', opacity: '0' }, '100%': { transform: 'translateY(0)', opacity: '1' } },
      },
      boxShadow: {
        'glass': '0 4px 24px rgba(108, 99, 255, 0.15)',
        'glow': '0 0 20px rgba(108, 99, 255, 0.4)',
        'card': '0 2px 16px rgba(0, 0, 0, 0.4)',
      },
    },
  },
  plugins: [],
}
