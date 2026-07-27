/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html", 
    "./main.js"
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        dark: { 
          900: '#0f172a', 
          800: '#1e293b', 
          700: '#334155', 
          600: '#475569' 
        },
      },
      fontFamily: {
        sans: [
          'ui-sans-serif', 
          'system-ui', 
          '-apple-system', 
          'BlinkMacSystemFont', 
          'Segoe UI', 
          'Roboto', 
          'Helvetica Neue', 
          'Arial', 
          'sans-serif'
        ],
      },
      animation: {
        'pop-in': 'popIn 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards',
        'spin-fast': 'spin 0.7s linear infinite',
        'score-pop': 'scorePop 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
        'fill-bar': 'fillBar 1s linear forwards',
        'fire-pulse': 'firePulse 1.5s ease-in-out infinite',
        'text-shimmer': 'textShimmer 2s linear infinite',
        'shake-intense': 'shakeIntense 0.5s cubic-bezier(.36,.07,.19,.97) both',
        'bg-pan': 'bgPan 10s ease infinite',
        'heat-wave': 'heatWave 2s ease-in-out infinite',
        'logo-shake': 'logoShake 3s ease-in-out infinite',
        'float-up-fade': 'floatUpFade 1s ease-out forwards',
      },
      keyframes: {
        popIn: { 
          '0%': { opacity: '0', transform: 'scale(0.9)' }, 
          '100%': { opacity: '1', transform: 'scale(1)' } 
        },
        scorePop: { 
          '0%': { transform: 'scale(1)' }, 
          '50%': { transform: 'scale(1.5)', color: '#fbbf24' }, 
          '100%': { transform: 'scale(1)' } 
        },
        firePulse: { 
          '0%, 100%': { opacity: '1', transform: 'scale(1)' }, 
          '50%': { opacity: '0.8', transform: 'scale(1.05)' } 
        },
        textShimmer: { 
          '0%': { backgroundPosition: '0% 50%' }, 
          '100%': { backgroundPosition: '200% 50%' } 
        },
        shakeIntense: {
          '10%, 90%': { transform: 'translate3d(-1px, 0, 0)' },
          '20%, 80%': { transform: 'translate3d(2px, 0, 0)' },
          '30%, 50%, 70%': { transform: 'translate3d(-2px, 0, 0)' },
          '40%, 60%': { transform: 'translate3d(2px, 0, 0)' }
        },
        bgPan: { 
          '0%': { backgroundPosition: '0% 50%' }, 
          '50%': { backgroundPosition: '100% 50%' }, 
          '100%': { backgroundPosition: '0% 50%' } 
        },
        heatWave: { 
          '0%': { opacity: '0.3' }, 
          '50%': { opacity: '0.6' }, 
          '100%': { opacity: '0.3' } 
        },
        logoShake: { 
          '0%, 100%': { transform: 'rotate(0deg)' }, 
          '2%': { transform: 'rotate(-2deg)' }, 
          '4%': { transform: 'rotate(2deg)' }, 
          '6%': { transform: 'rotate(0deg)' } 
        },
        fillBar: { 
          '0%': { width: '0%' }, 
          '100%': { width: '100%' } 
        },
        floatUpFade: { 
          '0%': { opacity: '1', transform: 'translateY(0)' }, 
          '100%': { opacity: '0', transform: 'translateY(-40px)' } 
        }
      }
    }
  },
  plugins: [],
}