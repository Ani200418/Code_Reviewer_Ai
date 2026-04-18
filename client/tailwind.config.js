/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './lib/**/*.{js,ts,jsx,tsx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.25rem',
      },
      animation: {
        'fade-in':    'fadeIn 0.4s ease-out',
        'slide-up':   'slideUp 0.45s cubic-bezier(0.16,1,0.3,1)',
        'scale-in':   'scaleIn 0.35s cubic-bezier(0.16,1,0.3,1)',
        'spin':       'spin 0.8s linear infinite',
        'float':      'float 4s ease-in-out infinite',
        'ping-slow':  'ping 2s cubic-bezier(0,0,0.2,1) infinite',
        'shimmer':    'shimmer 1.8s infinite',
      },
      keyframes: {
        fadeIn:  { from:{opacity:'0'}, to:{opacity:'1'} },
        slideUp: { from:{opacity:'0',transform:'translateY(20px)'}, to:{opacity:'1',transform:'translateY(0)'} },
        scaleIn: { from:{opacity:'0',transform:'scale(0.96)'}, to:{opacity:'1',transform:'scale(1)'} },
        spin:    { to:{transform:'rotate(360deg)'} },
        float:   { '0%,100%':{transform:'translateY(0)'},'50%':{transform:'translateY(-6px)'} },
        shimmer: { '0%':{backgroundPosition:'-200% 0'},'100%':{backgroundPosition:'200% 0'} },
      },
      backdropBlur: { xs: '2px' },
      boxShadow: {
        'glow-sky':    '0 0 24px rgba(56,189,248,0.2)',
        'glow-purple': '0 0 24px rgba(139,92,246,0.2)',
        'glass':       '0 8px 32px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.04)',
      },
    },
  },
  plugins: [],
};
