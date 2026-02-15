import type { Config } from 'tailwindcss';

export default {
    content: ['./src/**/*.{html,js,svelte,ts}'],
    theme: {
        extend: {
            colors: {
                primary: {
                    DEFAULT: 'var(--color-primary)',
                    50: '#eef2ff',
                    100: '#e0e7ff',
                    200: '#c7d2fe',
                    300: '#a5b4fc',
                    400: '#818cf8',
                    500: '#6366f1', // Base Primary
                    600: '#4f46e5',
                    700: '#4338ca',
                    800: '#3730a3',
                    900: '#312e81',
                },
                secondary: {
                    DEFAULT: 'var(--color-secondary)',
                },
                cta: {
                    DEFAULT: 'var(--color-cta)',
                    hover: '#059669',
                },
                background: 'var(--color-background)',
                text: 'var(--color-text)',
            },
            fontFamily: {
                sans: ['"Fira Sans"', 'system-ui', 'sans-serif'],
                mono: ['"Fira Code"', 'monospace'],
                heading: ['"Fira Sans"', 'system-ui', 'sans-serif'],
            },
            boxShadow: {
                sm: 'var(--shadow-sm)',
                md: 'var(--shadow-md)',
                lg: 'var(--shadow-lg)',
                xl: 'var(--shadow-xl)',
            },
            gridTemplateColumns: {
                '16': 'repeat(16, minmax(0, 1fr))',
                '22': 'repeat(22, minmax(0, 1fr))',
            }
        }
    },
    plugins: []
} satisfies Config;
