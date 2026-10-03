// Brand palette for the Tailwind CDN. Re-mapping the palette here re-colors every
// existing class (bg-teal-500, text-amber-400, ...) without touching the markup.
//   teal    -> brand greens  (600 is the Compounding Journey forest green #1E4620)
//   emerald -> positive/growth greens
//   gold    -> Compounding Journey gold (500 is #C59B27); also replaces "sky" (info banners, currency toggle)
//   amber   -> orange, so WARNINGS stay clearly different from the gold brand color
window.tailwind = window.tailwind || {};
window.tailwind.config = {
  theme: {
    extend: {
      colors: {
        teal:    { '50': '#F1F8F1', '100': '#DDEEDD', '200': '#BBDDBD', '300': '#94C99A', '400': '#6DB274', '500': '#4C9A52', '600': '#1E4620', '700': '#173818', '800': '#112A12', '900': '#0B1D0C', '950': '#061006' },
        emerald: { '50': '#F0F9F1', '100': '#D9F0DC', '200': '#B4E1BA', '300': '#8ACF94', '400': '#66BC72', '500': '#45A455', '600': '#2F8541', '700': '#246A34', '800': '#1D532B', '900': '#194524', '950': '#0A2613' },
        gold:    { '50': '#FBF6E6', '100': '#F5EBC6', '200': '#EBD68F', '300': '#E1C05C', '400': '#D4AB3B', '500': '#C59B27', '600': '#A57F1E', '700': '#806118', '800': '#5C4614', '900': '#3F300F', '950': '#241B08' },
        sky:     { '50': '#FBF6E6', '100': '#F5EBC6', '200': '#EBD68F', '300': '#E1C05C', '400': '#D4AB3B', '500': '#C59B27', '600': '#A57F1E', '700': '#806118', '800': '#5C4614', '900': '#3F300F', '950': '#241B08' },
        amber:   { '50': '#FFF7ED', '100': '#FFEDD5', '200': '#FED7AA', '300': '#FDBA74', '400': '#FB923C', '500': '#F97316', '600': '#EA580C', '700': '#C2410C', '800': '#9A3412', '900': '#7C2D12', '950': '#431407' }
      }
    }
  }
};
