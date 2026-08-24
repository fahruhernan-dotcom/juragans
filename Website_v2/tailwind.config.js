/** @type {import('tailwindcss').Config} */
export default {
    darkMode: ["class"],
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
  	extend: {
  		colors: {
  			background: 'hsl(var(--background))',
  			foreground: 'hsl(var(--foreground))',
  			card: {
  				DEFAULT: 'hsl(var(--card))',
  				foreground: 'hsl(var(--card-foreground))'
  			},
  			popover: {
  				DEFAULT: 'hsl(var(--popover))',
  				foreground: 'hsl(var(--popover-foreground))'
  			},
  			primary: {
  				DEFAULT: 'hsl(var(--primary))',
  				foreground: 'hsl(var(--primary-foreground))'
  			},
  			secondary: {
  				DEFAULT: 'hsl(var(--secondary))',
  				foreground: 'hsl(var(--secondary-foreground))'
  			},
  			muted: {
  				DEFAULT: 'hsl(var(--muted))',
  				foreground: 'hsl(var(--muted-foreground))'
  			},
  			accent: {
  				DEFAULT: 'hsl(var(--accent))',
  				foreground: 'hsl(var(--accent-foreground))'
  			},
  			destructive: {
  				DEFAULT: 'hsl(var(--destructive))',
  				foreground: 'hsl(var(--destructive-foreground))'
  			},
  			border: 'hsl(var(--border))',
  			input: 'hsl(var(--input))',
  			ring: 'hsl(var(--ring))',
  			'bg-base': 'var(--bg-base-val)',
  			'bg-1': 'var(--bg-1-val)',
  			'bg-2': 'var(--bg-2-val)',
  			'bg-3': 'var(--bg-3-val)',
  			'border-subtle': 'var(--border-sub-val)',
  			'border-default': 'var(--border-def-val)',
  			'border-strong': 'var(--border-strong-val)',
  			'border-accent': 'var(--border-acc-val)',
  			'emerald-50': 'var(--emerald-50)',
  			'emerald-300': 'var(--emerald-300)',
  			'emerald-400': 'var(--emerald-400)',
  			'emerald-500': 'var(--emerald-500)',
  			'emerald-600': 'var(--emerald-600)',
  			'emerald-glow': 'rgba(2, 26, 2, 0.12)',
  			'emerald-glow-strong': 'rgba(2, 26, 2, 0.20)',
  			'gold-400': '#FBBF24',
  			'gold-500': '#F59E0B',
  			'gold-glow': 'rgba(245, 158, 11, 0.12)',
  			'text-primary': 'var(--text-primary-val)',
  			'text-secondary': 'var(--text-secondary-val)',
  			'text-muted': 'var(--text-muted-val)',
  			'text-accent': 'var(--text-accent-val)',
  			red: '#F87171',
  			'red-bg': 'rgba(248, 113, 113, 0.10)',
  			// Short aliases used by landing page
  			'em-400': 'var(--emerald-400)',
  			'em-500': 'var(--emerald-500)',
  			'em-600': 'var(--emerald-600)',
  			'tx-1': 'var(--text-primary-val)',
  			'tx-2': 'var(--text-secondary-val)',
  			'tx-3': 'var(--text-muted-val)',
  			'border-sub': 'var(--border-sub-val)',
  			'border-def': 'var(--border-def-val)',
  			'border-acc': 'var(--border-acc-val)',
  			gold: '#FBBF24',
  			'em-glow': 'rgba(2, 26, 2, 0.12)',
  			// ── Juragan Landing Page Brand Colors ──
  			'brand-maroon': '#7A1E31',
  			'brand-maroon-dark': '#5C1322',
  			'brand-maroon-light': '#9B3048',
  			'brand-cream': '#FAF6EE',
  			'brand-cream-dark': '#F3ECE0',
  			'brand-cream-light': '#FDFBFC',
  			'brand-gold': '#C5A880',
  			'brand-gold-dark': '#A58B65',
  			'brand-gold-light': '#DFD0BD',
  			'brand-charcoal': '#2C2627',
  			sidebar: {
  				DEFAULT: 'hsl(var(--sidebar-background))',
  				foreground: 'hsl(var(--sidebar-foreground))',
  				primary: 'hsl(var(--sidebar-primary))',
  				'primary-foreground': 'hsl(var(--sidebar-primary-foreground))',
  				accent: 'hsl(var(--sidebar-accent))',
  				'accent-foreground': 'hsl(var(--sidebar-accent-foreground))',
  				border: 'hsl(var(--sidebar-border))',
  				ring: 'hsl(var(--sidebar-ring))'
  			},
  			'tko-forest': {
  				900: 'var(--forest-900)',
  				950: 'var(--forest-950)'
  			},
  			'tko-brand': {
  				50: 'var(--brand-50)',
  				100: 'var(--brand-100)',
  				200: 'var(--brand-200)',
  				300: 'var(--brand-300)',
  				400: 'var(--brand-400)',
  				500: 'var(--brand-500)',
  				600: 'var(--brand-600)',
  				700: 'var(--brand-700)'
  			},
  			'tko-bg-page': 'var(--bg-page)',
  			'tko-bg-surface': 'var(--bg-surface)',
  			'tko-bg-subtle': 'var(--bg-subtle)',
  			'tko-text-primary': 'var(--text-primary)',
  			'tko-text-secondary': 'var(--text-secondary)',
  			'tko-text-muted': 'var(--text-muted)',
  			'tko-border-soft': 'var(--border-soft)',
  			'tko-border-muted': 'var(--border-muted)'
  		},
  		fontFamily: {
  			sans: [
  				'var(--font-sans)',
  				'sans-serif'
  			],
  			display: [
  				'var(--font-sans)',
  				'sans-serif'
  			],
  			body: [
  				'var(--font-sans)',
  				'sans-serif'
  			],
  			serif: [
  				'Playfair Display',
  				'Georgia',
  				'serif'
  			]
  		},
  		borderRadius: {
  			lg: 'var(--radius)',
  			md: 'calc(var(--radius) - 2px)',
  			sm: 'calc(var(--radius) - 4px)',
  			'tko-xs': 'var(--radius-tko-xs)',
  			'tko-sm': 'var(--radius-tko-sm)',
  			'tko-md': 'var(--radius-tko-md)',
  			'tko-lg': 'var(--radius-tko-lg)',
  			'tko-xl': 'var(--radius-tko-xl)',
  			'tko-2xl': 'var(--radius-tko-2xl)',
  			'tko-3xl': 'var(--radius-tko-3xl)',
  			'tko-full': 'var(--radius-tko-full)'
  		},
  		boxShadow: {
  			'tko-xs': 'var(--shadow-tko-xs)',
  			'tko-sm': 'var(--shadow-tko-sm)',
  			'tko-md': 'var(--shadow-tko-md)',
  			'tko-lg': 'var(--shadow-tko-lg)',
  			'tko-brand': 'var(--shadow-tko-brand)'
  		},
  		keyframes: {
  			'accordion-down': {
  				from: {
  					height: '0'
  				},
  				to: {
  					height: 'var(--radix-accordion-content-height)'
  				}
  			},
  			'accordion-up': {
  				from: {
  					height: 'var(--radix-accordion-content-height)'
  				},
  				to: {
  					height: '0'
  				}
  			}
  		},
  		animation: {
  			'accordion-down': 'accordion-down 0.2s ease-out',
  			'accordion-up': 'accordion-up 0.2s ease-out'
  		}
  	}
  },
  plugins: [require("tailwindcss-animate"), require("@tailwindcss/typography")],
}

