/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        primary: { 50: '#E8F5E9', 100: '#C8E6C9', 200: '#A5D6A7', 300: '#81C784', 400: '#66BB6A', 500: '#43A047', 600: '#2E7D32', 700: '#1B5E20' },
        subject: { bg: '#E3F2FD', border: '#42A5F5', text: '#1565C0' },
        behavior: { bg: '#FFF3E0', border: '#FFA726', text: '#E65100' },
      },
      fontFamily: {
        sans: ['Pretendard', 'Apple SD Gothic Neo', 'Noto Sans KR', 'sans-serif'],
        display: ['Outfit', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
