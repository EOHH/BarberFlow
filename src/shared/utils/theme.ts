export type ThemeColorName = 'gold' | 'emerald' | 'indigo' | 'rose' | 'slate' | 'default';

export interface ThemeClasses {
  text: string;
  textHover: string;
  bg: string;
  bgHover: string;
  bgLight: string; // para fondos semitransparentes como bg-emerald-500/10
  border: string;
  ring: string;
  selectionBg: string;
}

export const getThemeClasses = (colorName?: string | null): ThemeClasses => {
  // Normalize string from "Premium Gold" to "gold", etc.
  let name = 'emerald'; // default
  if (colorName) {
    const lower = colorName.toLowerCase();
    if (lower.includes('gold')) name = 'gold';
    else if (lower.includes('emerald')) name = 'emerald';
    else if (lower.includes('indigo')) name = 'indigo';
    else if (lower.includes('rose')) name = 'rose';
    else if (lower.includes('slate')) name = 'slate';
  }
  const themes: Record<string, ThemeClasses> = {
    gold: {
      text: 'text-amber-500',
      textHover: 'hover:text-amber-400',
      bg: 'bg-amber-600',
      bgHover: 'hover:bg-amber-500',
      bgLight: 'bg-amber-500/10',
      border: 'border-amber-500',
      ring: 'ring-amber-500',
      selectionBg: 'selection:bg-amber-500/30 selection:text-amber-500'
    },
    emerald: {
      text: 'text-emerald-500',
      textHover: 'hover:text-emerald-400',
      bg: 'bg-emerald-600',
      bgHover: 'hover:bg-emerald-500',
      bgLight: 'bg-emerald-500/10',
      border: 'border-emerald-500',
      ring: 'ring-emerald-500',
      selectionBg: 'selection:bg-emerald-500/30 selection:text-emerald-500'
    },
    indigo: {
      text: 'text-indigo-500',
      textHover: 'hover:text-indigo-400',
      bg: 'bg-indigo-600',
      bgHover: 'hover:bg-indigo-500',
      bgLight: 'bg-indigo-500/10',
      border: 'border-indigo-500',
      ring: 'ring-indigo-500',
      selectionBg: 'selection:bg-indigo-500/30 selection:text-indigo-500'
    },
    rose: {
      text: 'text-rose-500',
      textHover: 'hover:text-rose-400',
      bg: 'bg-rose-600',
      bgHover: 'hover:bg-rose-500',
      bgLight: 'bg-rose-500/10',
      border: 'border-rose-500',
      ring: 'ring-rose-500',
      selectionBg: 'selection:bg-rose-500/30 selection:text-rose-500'
    },
    slate: {
      text: 'text-slate-400',
      textHover: 'hover:text-slate-300',
      bg: 'bg-slate-600',
      bgHover: 'hover:bg-slate-500',
      bgLight: 'bg-slate-500/10',
      border: 'border-slate-500',
      ring: 'ring-slate-500',
      selectionBg: 'selection:bg-slate-500/30 selection:text-slate-500'
    }
  };

  return themes[name] || themes.emerald; // Fallback to emerald
};
