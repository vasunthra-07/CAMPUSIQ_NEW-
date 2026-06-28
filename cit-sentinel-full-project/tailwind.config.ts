import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: ["./pages/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./app/**/*.{ts,tsx}", "./src/**/*.{ts,tsx}"],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: { "2xl": "1400px" },
    },
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: { DEFAULT: "hsl(var(--primary))", foreground: "hsl(var(--primary-foreground))" },
        secondary: { DEFAULT: "hsl(var(--secondary))", foreground: "hsl(var(--secondary-foreground))" },
        destructive: { DEFAULT: "hsl(var(--destructive))", foreground: "hsl(var(--destructive-foreground))" },
        muted: { DEFAULT: "hsl(var(--muted))", foreground: "hsl(var(--muted-foreground))" },
        accent: { DEFAULT: "hsl(var(--accent))", foreground: "hsl(var(--accent-foreground))" },
        popover: { DEFAULT: "hsl(var(--popover))", foreground: "hsl(var(--popover-foreground))" },
        card: { DEFAULT: "hsl(var(--card))", foreground: "hsl(var(--card-foreground))" },
        gold: { DEFAULT: "hsl(var(--gold))", foreground: "hsl(var(--gold-foreground))" },
        maroon: { DEFAULT: "hsl(var(--maroon))", light: "hsl(var(--maroon-light))" },
        surface: { DEFAULT: "hsl(var(--surface))", hover: "hsl(var(--surface-hover))" },
        sidebar: {
          DEFAULT: "hsl(var(--sidebar-background))",
          foreground: "hsl(var(--sidebar-foreground))",
          primary: "hsl(var(--sidebar-primary))",
          "primary-foreground": "hsl(var(--sidebar-primary-foreground))",
          accent: "hsl(var(--sidebar-accent))",
          "accent-foreground": "hsl(var(--sidebar-accent-foreground))",
          border: "hsl(var(--sidebar-border))",
          ring: "hsl(var(--sidebar-ring))",
        },
        "chart-safe": "hsl(var(--chart-safe))",
        "chart-critical": "hsl(var(--chart-critical))",
        "chart-observation": "hsl(var(--chart-observation))",
        "chart-at-risk": "hsl(var(--chart-at-risk))",
        "teal": "hsl(175 60% 40%)",
        "purple-soft": "hsl(260 40% 55%)",
        "rose-warm": "hsl(350 70% 55%)",
        "gold-light": "hsl(45 100% 65%)",
        "surface-warm": "hsl(25 12% 15%)",
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": { from: { height: "0" }, to: { height: "var(--radix-accordion-content-height)" } },
        "accordion-up": { from: { height: "var(--radix-accordion-content-height)" }, to: { height: "0" } },
        "pulse-gold": { "0%, 100%": { opacity: "1" }, "50%": { opacity: "0.6" } },
        "slide-in": { from: { transform: "translateX(-100%)" }, to: { transform: "translateX(0)" } },
        "fade-up": {
          from: { opacity: "0", transform: "translateY(14px)" },
          to: { opacity: "1", transform: "translateY(0)" }
        },
        "scale-in": {
          from: { opacity: "0", transform: "scale(0.94)" },
          to: { opacity: "1", transform: "scale(1)" }
        },
        "slide-right": {
          from: { opacity: "0", transform: "translateX(-16px)" },
          to: { opacity: "1", transform: "translateX(0)" }
        },
        "glow-breathe": {
          "0%, 100%": { boxShadow: "0 0 20px hsl(42 95% 52% / 0.15)" },
          "50%": { boxShadow: "0 0 40px hsl(42 95% 52% / 0.35)" }
        },
        "sentinel-beat": {
          "0%, 100%": { transform: "scale(1)" },
          "50%": { transform: "scale(1.08)" }
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "pulse-gold": "pulse-gold 2s ease-in-out infinite",
        "slide-in": "slide-in 0.3s ease-out",
        "fade-up": "fade-up 0.4s ease forwards",
        "scale-in": "scale-in 0.3s ease forwards",
        "slide-right": "slide-right 0.35s ease forwards",
        "glow-breathe": "glow-breathe 3s ease-in-out infinite",
        "sentinel-beat": "sentinel-beat 2s ease-in-out infinite",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;
