import type { Settings } from "../types";

export const DEFAULT_SETTINGS: Settings = {
  accent: "#c96b2e",
  logo: null,
  shopName: "Navalha de Ouro",
};

/* ---------- conversões ---------- */

function hexToHsl(hex: string): { h: number; s: number; l: number } {
  const clean = hex.replace("#", "");
  const r = parseInt(clean.slice(0, 2), 16) / 255;
  const g = parseInt(clean.slice(2, 4), 16) / 255;
  const b = parseInt(clean.slice(4, 6), 16) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  if (max === min) return { h: 0, s: 0, l: Math.round(l * 100) };
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h = 0;
  if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
  else if (max === g) h = ((b - r) / d + 2) / 6;
  else h = ((r - g) / d + 4) / 6;
  return { h: Math.round(h * 360), s: Math.round(s * 100), l: Math.round(l * 100) };
}

const clamp = (v: number, lo = 0, hi = 100) => Math.min(hi, Math.max(lo, v));

function hslToHex(h: number, s: number, l: number): string {
  const sat = clamp(s) / 100;
  const lig = clamp(l) / 100;
  const k = (n: number) => (n + h / 30) % 12;
  const a = sat * Math.min(lig, 1 - lig);
  const f = (n: number) => lig - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
  const toHex = (v: number) =>
    Math.round(255 * v)
      .toString(16)
      .padStart(2, "0");
  return `#${toHex(f(0))}${toHex(f(8))}${toHex(f(4))}`;
}

/** deriva a escala do acento (equivalentes aos tokens ember-*) a partir de um hex */
export function accentScale(accent: string) {
  const { h, s, l } = hexToHsl(accent);
  return {
    100: hslToHex(h, Math.max(s - 10, 20), clamp(l + 48, 0, 94)),
    200: hslToHex(h, s, clamp(l + 34, 0, 88)),
    400: hslToHex(h, s, clamp(l + 10, 0, 90)),
    500: accent,
    600: hslToHex(h, s, clamp(l - 9, 6, 100)),
    700: hslToHex(h, s, clamp(l - 20, 4, 100)),
  };
}

/* ---------- favicon ---------- */

function buildFavicon(settings: Settings): string {
  if (settings.logo) return settings.logo;
  const initial = settings.shopName.trim().charAt(0).toUpperCase() || "B";
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="14" fill="#12100d"/><text x="32" y="44" font-family="Arial, sans-serif" font-size="36" font-weight="700" text-anchor="middle" fill="${settings.accent}">${initial}</text></svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

/** aplica o tema nas variáveis CSS do Tailwind v4 e no favicon */
export function applyTheme(settings: Settings): void {
  const scale = accentScale(settings.accent);
  const root = document.documentElement;
  for (const [shade, hex] of Object.entries(scale)) {
    root.style.setProperty(`--color-ember-${shade}`, hex);
  }
  let icon = document.querySelector<HTMLLinkElement>('link[rel="icon"]');
  if (!icon) {
    icon = document.createElement("link");
    icon.rel = "icon";
    document.head.appendChild(icon);
  }
  icon.href = buildFavicon(settings);
}

/** redimensiona imagem enviada para até 512px e devolve dataURL PNG */
export function processLogoFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith("image/")) {
      reject(new Error("Arquivo não é uma imagem."));
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const size = 512;
        const ratio = Math.min(size / img.width, size / img.height, 1);
        const canvas = document.createElement("canvas");
        canvas.width = Math.round(img.width * ratio);
        canvas.height = Math.round(img.height * ratio);
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("Canvas indisponível."));
          return;
        }
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL("image/png"));
      };
      img.onerror = () => reject(new Error("Imagem inválida."));
      img.src = String(reader.result);
    };
    reader.onerror = () => reject(new Error("Falha ao ler o arquivo."));
    reader.readAsDataURL(file);
  });
}
