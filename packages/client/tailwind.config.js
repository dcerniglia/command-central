/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      colors: {
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        // Design system surfaces
        surface: {
          root: 'hsl(var(--surface-root))',
          base: 'hsl(var(--surface-base))',
          raised: 'hsl(var(--surface-raised))',
          overlay: 'hsl(var(--surface-overlay))',
        },
        // Semantic status colors
        status: {
          'urgency-low': 'hsl(var(--status-urgency-low))',
          'urgency-high': 'hsl(var(--status-urgency-high))',
          positive: 'hsl(var(--status-positive))',
          info: 'hsl(var(--status-info))',
          warning: 'hsl(var(--status-warning))',
        },
        // Escalation gradient
        escalation: {
          1: 'hsl(var(--escalation-1))',
          2: 'hsl(var(--escalation-2))',
          3: 'hsl(var(--escalation-3))',
          4: 'hsl(var(--escalation-4))',
        },
        // Module accents
        module: {
          fitness: 'hsl(var(--module-fitness))',
          projects: 'hsl(var(--module-projects))',
        },
        // Sidebar
        sidebar: {
          DEFAULT: 'hsl(var(--sidebar-background))',
          foreground: 'hsl(var(--sidebar-foreground))',
          primary: 'hsl(var(--sidebar-primary))',
          'primary-foreground': 'hsl(var(--sidebar-primary-foreground))',
          accent: 'hsl(var(--sidebar-accent))',
          'accent-foreground': 'hsl(var(--sidebar-accent-foreground))',
          border: 'hsl(var(--sidebar-border))',
          ring: 'hsl(var(--sidebar-ring))',
        },
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      fontSize: {
        display: ['2rem', { lineHeight: '1.2', fontWeight: '700', letterSpacing: '-0.02em' }],
        h1: ['1.5rem', { lineHeight: '1.3', fontWeight: '600', letterSpacing: '-0.015em' }],
        h2: ['1.25rem', { lineHeight: '1.35', fontWeight: '600', letterSpacing: '-0.01em' }],
        h3: ['1rem', { lineHeight: '1.4', fontWeight: '600' }],
        body: ['0.875rem', { lineHeight: '1.5', fontWeight: '400' }],
        'body-medium': ['0.875rem', { lineHeight: '1.5', fontWeight: '500' }],
        caption: ['0.75rem', { lineHeight: '1.5', letterSpacing: '0.01em' }],
        overline: ['0.6875rem', { lineHeight: '1.5', fontWeight: '600', letterSpacing: '0.05em' }],
      },
      boxShadow: {
        sm: '0 1px 2px rgba(0,0,0,0.3)',
        md: '0 4px 12px rgba(0,0,0,0.4)',
        lg: '0 8px 24px rgba(0,0,0,0.5)',
        glow: '0 0 20px hsl(var(--primary) / 0.15)',
      },
      transitionTimingFunction: {
        'ease-out-custom': 'cubic-bezier(0.25, 0.1, 0.25, 1.0)',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
};
