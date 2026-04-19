/** @type {import('tailwindcss').Config} */
export default {
    content: ['./index.html', './src/**/*.{js,jsx}'],
    theme: {
        extend: {
            fontFamily: {
                display: ['Outfit', 'system-ui', 'sans-serif'],
                sans: ['DM Sans', 'system-ui', 'sans-serif'],
            },
            colors: {
                ink: {
                    950: '#f8fafc',
                    900: '#f1f5f9',
                    800: '#e2e8f0',
                    700: '#cbd5e1',
                },
                accent: {
                    coral: '#ef4444',
                    mint: '#14b8a6',
                    violet: '#6366f1',
                    gold: '#f59e0b',
                },
            },
            backgroundImage: {
                'grid-fade':
                    'linear-gradient(to right, rgba(99,102,241,0.07) 1px, transparent 1px), linear-gradient(to bottom, rgba(99,102,241,0.07) 1px, transparent 1px)',
                'hero-glow':
                    'radial-gradient(ellipse 80% 50% at 50% -20%, rgba(99,102,241,0.15), transparent), radial-gradient(ellipse 60% 40% at 100% 0%, rgba(20,184,166,0.12), transparent), radial-gradient(ellipse 50% 30% at 0% 100%, rgba(14,165,233,0.08), transparent)',
            },
            animation: {
                float: 'float 6s ease-in-out infinite',
                shimmer: 'shimmer 2s linear infinite',
            },
            keyframes: {
                float: {
                    '0%, 100%': { transform: 'translateY(0)' },
                    '50%': { transform: 'translateY(-12px)' },
                },
                shimmer: {
                    '0%': { backgroundPosition: '-200% 0' },
                    '100%': { backgroundPosition: '200% 0' },
                },
            },
        },
    },
    plugins: [],
};
