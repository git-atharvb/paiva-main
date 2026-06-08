/** @type {import('tailwindcss').Config} */
export default {
  // Drive dark mode from the [data-theme="dark"] attribute set by ThemeContext
  darkMode: ["class", "[data-theme='dark']"],
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      // ── Color aliases → CSS custom properties ──────────────────────────────
      colors: {
        background:  'var(--color-background)',
        foreground:  'var(--color-foreground)',
        primary: {
          DEFAULT:    'var(--color-primary)',
          foreground: 'var(--color-primary-foreground)',
        },
        secondary: {
          DEFAULT:    'var(--color-secondary)',
          foreground: 'var(--color-secondary-foreground)',
        },
        muted: {
          DEFAULT:    'var(--color-muted)',
          foreground: 'var(--color-muted-foreground)',
        },
        card: {
          DEFAULT:    'var(--color-card)',
          foreground: 'var(--color-card-foreground)',
        },
        destructive: {
          DEFAULT:    'var(--color-destructive)',
          foreground: 'var(--color-destructive-foreground)',
        },
        success: {
          DEFAULT:    'var(--color-success)',
          foreground: 'var(--color-success-foreground)',
        },
        warning: {
          DEFAULT:    'var(--color-warning)',
          foreground: 'var(--color-warning-foreground)',
        },
        accent: {
          DEFAULT:    'var(--color-accent)',
          foreground: 'var(--color-accent-foreground)',
        },
        'surface-elevated': 'var(--color-surface-elevated)',
        border: 'var(--color-border)',
        input:  'var(--color-input)',
        ring:   'var(--color-ring)',
      },

      // ── Border Radii ───────────────────────────────────────────────────────
      borderRadius: {
        sm:   'var(--radius-sm)',
        md:   'var(--radius-md)',
        lg:   'var(--radius-lg)',
        xl:   'var(--radius-xl)',
        '2xl': 'var(--radius-2xl)',
        '3xl': 'var(--radius-3xl)',
        full: 'var(--radius-full)',
      },

      // ── Box Shadows (elevation system) ────────────────────────────────────
      boxShadow: {
        '0':              'var(--shadow-0)',
        '1':              'var(--shadow-1)',
        '2':              'var(--shadow-2)',
        '3':              'var(--shadow-3)',
        'premium':        'var(--shadow-premium)',
        'premium-dark':   'var(--shadow-premium-dark)',
        'neon':           'var(--shadow-neon)',
        'neon-sm':        'var(--shadow-neon-sm)',
      },

      // ── Animations ────────────────────────────────────────────────────────
      animation: {
        'gradient-x':  'gradient-x  18s  ease          infinite',
        'spotlight':   'spotlight   5s   ease-in-out   infinite alternate',
        'border-spin': 'border-spin 4s   linear        infinite',
        'shimmer':     'shimmer     2.4s linear        infinite',
        'pulse-glow':  'pulse-glow  3s   ease-in-out   infinite',
        'float':       'float       6s   ease-in-out   infinite',
        'slide-up':    'slide-up    0.4s cubic-bezier(0.22,1,0.36,1) both',
        'fade-scale':  'fade-scale  0.35s cubic-bezier(0.22,1,0.36,1) both',
        'mesh-drift':  'mesh-drift  25s  ease-in-out   infinite',
      },

      // ── Keyframes ─────────────────────────────────────────────────────────
      keyframes: {
        'gradient-x': {
          '0%, 100%': { 'background-size': '220% 220%', 'background-position': 'left center'  },
          '50%':       { 'background-size': '220% 220%', 'background-position': 'right center' },
        },
        'spotlight': {
          '0%':   { transform: 'translate(-18%, -18%) scale(1.0)',  opacity: '0.45' },
          '100%': { transform: 'translate(18%, 18%)  scale(1.25)',  opacity: '0.80' },
        },
        'border-spin': {
          '100%': { transform: 'rotate(360deg)' },
        },
        'shimmer': {
          from: { 'background-position': '0% center'    },
          to:   { 'background-position': '-200% center' },
        },
        'pulse-glow': {
          '0%, 100%': { 'box-shadow': 'var(--shadow-neon-sm)' },
          '50%':       { 'box-shadow': 'var(--shadow-neon)'    },
        },
        'float': {
          '0%, 100%': { transform: 'translateY(0px)'  },
          '50%':       { transform: 'translateY(-6px)' },
        },
        'slide-up': {
          from: { opacity: '0', transform: 'translateY(12px) scale(0.98)' },
          to:   { opacity: '1', transform: 'translateY(0) scale(1)' },
        },
        'fade-scale': {
          from: { opacity: '0', transform: 'scale(0.95)' },
          to:   { opacity: '1', transform: 'scale(1)' },
        },
        'mesh-drift': {
          '0%, 100%': { 'background-position': '0% 50%' },
          '50%':       { 'background-position': '100% 50%' },
        },
      },

      // ── Typography ────────────────────────────────────────────────────────
      fontFamily: {
        sans: ['Inter', 'Outfit', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'Cascadia Code', 'ui-monospace', 'monospace'],
      },

      // ── Letter Spacing ────────────────────────────────────────────────────
      letterSpacing: {
        tighter: '-0.04em',
        tight:   '-0.022em',
        snug:    '-0.011em',
        normal:   '0em',
        wide:     '0.05em',
        wider:    '0.10em',
        widest:   '0.16em',
      },

      // ── Line Heights ──────────────────────────────────────────────────────
      lineHeight: {
        display: '1.06',
        heading: '1.18',
        body:    '1.65',
        caption: '1.45',
      },

      // ── Transition Timing Functions ───────────────────────────────────────
      transitionTimingFunction: {
        'spring':       'cubic-bezier(0.34, 1.56, 0.64, 1)',
        'smooth':       'cubic-bezier(0.4, 0, 0.2, 1)',
        'bounce-soft':  'cubic-bezier(0.22, 1, 0.36, 1)',
      },
    },
  },
  plugins: [
    require("tailwindcss-animate"),
    require("@tailwindcss/typography")
  ],
}
