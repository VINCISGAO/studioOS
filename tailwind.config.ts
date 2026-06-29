import type { Config } from "tailwindcss";
import { fontFamily } from "tailwindcss/defaultTheme";
import tailwindcssAnimate from "tailwindcss-animate";

const config = {
  darkMode: ["class"],
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}"
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: [
          "var(--font-landing-sans)",
          "var(--font-landing-cjk)",
          "Inter",
          "PingFang SC",
          "Microsoft YaHei",
          "Noto Sans SC",
          "ui-sans-serif",
          ...fontFamily.sans
        ],
        serif: ["var(--font-landing-serif)", "Georgia", "serif"]
      },
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))"
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))"
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))"
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))"
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))"
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))"
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))"
        },
        success: {
          DEFAULT: "hsl(var(--success))",
          foreground: "hsl(var(--success-foreground))"
        },
        warning: {
          DEFAULT: "hsl(var(--warning))",
          foreground: "hsl(var(--warning-foreground))"
        },
        review: {
          DEFAULT: "hsl(var(--review))",
          foreground: "hsl(var(--review-foreground))"
        },
        brand: {
          DEFAULT: "hsl(var(--brand))",
          foreground: "hsl(var(--brand-foreground))"
        },
        studio: {
          DEFAULT: "hsl(var(--studio))",
          foreground: "hsl(var(--studio-foreground))"
        },
        surface: {
          primary: "hsl(var(--surface-primary))",
          secondary: "hsl(var(--surface-secondary))"
        }
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
        button: "var(--radius-button)",
        input: "var(--radius-input)",
        card: "var(--radius-card)",
        dialog: "var(--radius-dialog)",
        video: "var(--radius-video)"
      },
      spacing: {
        "sidebar-brand": "var(--sidebar-brand)",
        "sidebar-compact": "var(--sidebar-compact)"
      },
      transitionDuration: {
        micro: "var(--motion-micro)",
        page: "var(--motion-page)"
      },
      boxShadow: {
        luxe: "0 24px 80px rgba(15, 23, 42, 0.08)",
        sm: "0 1px 3px rgba(0, 0, 0, 0.06)"
      }
    }
  },
  plugins: [tailwindcssAnimate]
} satisfies Config;

export default config;
