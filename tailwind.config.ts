import type { Config } from "tailwindcss";

export default {
    darkMode: ["class"],
    content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  prefix: "",
  theme: {
	  container: {
		  center: true,
		  padding: '2rem',
		  screens: {
			  '2xl': '1400px'
		  }
	  },
	  extend: {
		  colors: {
			  border: 'hsl(var(--border))',
			  input: 'hsl(var(--input))',
			  ring: 'hsl(var(--ring))',
			  background: 'hsl(var(--background))',
			  foreground: 'hsl(var(--foreground))',
			  primary: {
				  DEFAULT: 'hsl(var(--primary))',
				  foreground: 'hsl(var(--primary-foreground))'
			  },
			  secondary: {
				  DEFAULT: 'hsl(var(--secondary))',
				  foreground: 'hsl(var(--secondary-foreground))'
			  },
			  destructive: {
				  DEFAULT: 'hsl(var(--destructive))',
				  foreground: 'hsl(var(--destructive-foreground))'
			  },
			  muted: {
				  DEFAULT: 'hsl(var(--muted))',
				  foreground: 'hsl(var(--muted-foreground))'
			  },
			  accent: {
				  DEFAULT: 'hsl(var(--accent))',
				  foreground: 'hsl(var(--accent-foreground))'
			  },
			  popover: {
				  DEFAULT: 'hsl(var(--popover))',
				  foreground: 'hsl(var(--popover-foreground))'
			  },
			  card: {
				  DEFAULT: 'hsl(var(--card))',
				  foreground: 'hsl(var(--card-foreground))'
			  },
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
			  // Custom colors for PickCreator
			  pick: {
				  blue: '#0EA5E9',
				  purple: '#8B5CF6',
				  pink: '#EC4899',
				  orange: '#F97316',
				  light: '#F9FAFB',
				  dark: '#111827'
			  }
		  },
		  borderRadius: {
			  lg: 'var(--radius)',
			  md: 'calc(var(--radius) - 2px)',
			  sm: 'calc(var(--radius) - 4px)'
		  },
		  keyframes: {
			  'accordion-down': {
				  from: { height: '0' },
				  to: { height: 'var(--radix-accordion-content-height)' }
			  },
			  'accordion-up': {
				  from: { height: 'var(--radix-accordion-content-height)' },
				  to: { height: '0' }
			  },
			  'fade-in': {
				  '0%': { opacity: '0' },
				  '100%': { opacity: '1' }
			  },
			  'fade-out': {
				  '0%': { opacity: '1' },
				  '100%': { opacity: '0' }
			  },
			  'scale-in': {
				  '0%': { transform: 'scale(0.95)', opacity: '0' },
				  '100%': { transform: 'scale(1)', opacity: '1' }
			  },
			  'bounce-in': {
				  '0%': { transform: 'translateY(20px)', opacity: '0' },
				  '70%': { transform: 'translateY(-5px)' },
				  '100%': { transform: 'translateY(0)', opacity: '1' }
			  },
			  'slide-in': {
				  '0%': { transform: 'translateY(100%)', opacity: '0' },
				  '100%': { transform: 'translateY(0)', opacity: '1' }
			  },
			  'slide-up': {
				  '0%': { transform: 'translateY(20px)', opacity: '0' },
				  '100%': { transform: 'translateY(0)', opacity: '1' }
			  },
			  'float': {
				  '0%, 100%': { transform: 'translateY(0)' },
				  '50%': { transform: 'translateY(-10px)' }
			  },
			  'pulse-soft': {
				  '0%, 100%': { opacity: '1' },
				  '50%': { opacity: '0.7' }
			  },
			  'text-reveal': {
				  '0%': { width: '0%' },
				  '100%': { width: '100%' }
			  },
			  'spin-slow': {
				  '0%': { transform: 'rotate(0deg)' },
				  '100%': { transform: 'rotate(360deg)' }
			  },
			  'icons-meet': {
				  '0%': { transform: 'translateX(-100px)' },
				  '50%': { transform: 'translateX(0px)' },
				  '100%': { transform: 'translateX(0px) scale(1.2)' }
			  },
			  'glow-pulse': {
				  '0%, 100%': { filter: 'drop-shadow(0 0 2px rgba(14, 165, 233, 0.6))' },
				  '50%': { filter: 'drop-shadow(0 0 15px rgba(14, 165, 233, 0.8))' }
			  },
              'heartbeat': {
                  '0%': { transform: 'scale(1)' },
                  '14%': { transform: 'scale(1.3)' },
                  '28%': { transform: 'scale(1)' },
                  '42%': { transform: 'scale(1.3)' },
                  '70%': { transform: 'scale(1)' }
              }
		  },
		  animation: {
			  'accordion-down': 'accordion-down 0.2s ease-out',
			  'accordion-up': 'accordion-up 0.2s ease-out',
			  'fade-in': 'fade-in 0.4s ease-out forwards',
			  'fade-out': 'fade-out 0.4s ease-out forwards',
			  'scale-in': 'scale-in 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards',
			  'bounce-in': 'bounce-in 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards',
			  'slide-in': 'slide-in 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards',
			  'slide-up': 'slide-up 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards',
			  'float': 'float 3s ease-in-out infinite',
			  'pulse-soft': 'pulse-soft 2s ease-in-out infinite',
			  'text-reveal': 'text-reveal 0.5s ease-out forwards',
			  'spin-slow': 'spin-slow 8s linear infinite',
			  'icons-meet': 'icons-meet 1.5s ease-in-out forwards',
			  'glow-pulse': 'glow-pulse 2s ease-in-out infinite',
			  'heartBeat': 'heartbeat 1.5s ease-in-out'
		  },
		  fontFamily: {
			  'sans': ['SF Pro Display', 'Inter', 'sans-serif'],
			  'serif': ['Georgia', 'serif'],
			  'mono': ['SF Mono', 'monospace']
		  }
	  }
  },
  plugins: [
    require('tailwind-scrollbar-hide'),
    require("tailwindcss-animate"),
    require('tailwind-scrollbar'),
  ],

} as Config;
