/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        paper: "var(--color-paper)",
        surface: "var(--color-surface)",
        panel: "var(--color-panel)",
        rail: "var(--color-rail)",
        "rail-2": "var(--color-rail-2)",
        "rail-line": "var(--color-rail-line)",
        ink: "var(--color-ink)",
        "ink-soft": "var(--color-ink-soft)",
        "ink-faint": "var(--color-ink-faint)",
        "on-rail": "var(--color-on-rail)",
        "on-rail-soft": "var(--color-on-rail-soft)",
        border: "var(--color-border)",
        "border-strong": "var(--color-border-strong)",
        accent: "var(--color-accent)",
        "accent-soft": "var(--color-accent-soft)",
        ok: "var(--color-ok)",
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "monospace"],
        display: ["Space Grotesk", "sans-serif"],
      },
    },
  },
  plugins: [],
}
