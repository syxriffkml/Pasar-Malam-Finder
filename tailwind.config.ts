import type { Config } from 'tailwindcss';

export default {
	content: ['./src/**/*.{html,js,svelte,ts}'],
	theme: {
		extend: {
			fontFamily: {
				anton: ['Anton', 'sans-serif'],
				instrument: ['"Instrument Serif"', 'serif'],
				sora: ['Sora', 'sans-serif']
			},
			colors: {
				cream: '#faf5eb',
				surface: '#ffffff',
				'soft-surface': '#f0e9d6',
				primary: '#e5311d',
				'red-tint': '#fdf0ee',
				'red-border': '#f5c4bc',
				accent: '#f5c518',
				ink: '#1a1209',
				muted: '#8a7d65',
				border: '#e0d8c8'
			},
			borderRadius: {
				card: '14px'
			},
			animation: {
				blink: 'blink 1.2s step-end infinite'
			},
			keyframes: {
				blink: {
					'0%, 100%': { opacity: '1' },
					'50%': { opacity: '0' }
				}
			}
		}
	},
	plugins: []
} satisfies Config;
