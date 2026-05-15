import { BookOpen, ExternalLink, Leaf, Moon, Sun } from 'lucide-react';

interface Props {
  dark: boolean;
  onToggleTheme: () => void;
  onOpenAnexos: () => void;
}

const iconBtn =
  'flex h-11 min-w-[44px] items-center justify-center gap-1.5 rounded-xl border border-slate-200 px-2.5 text-sm font-medium transition hover:bg-slate-100 active:scale-95 dark:border-slate-700 dark:hover:bg-slate-800';

export default function Header({ dark, onToggleTheme, onOpenAnexos }: Props) {
  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/85 backdrop-blur-xl dark:border-slate-800 dark:bg-slate-950/85">
      <div className="mx-auto flex max-w-[1500px] items-center gap-2 px-3 py-2.5 sm:gap-3 sm:px-6 sm:py-3">
        <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-emerald-700 text-white shadow-lg shadow-brand-500/30 sm:size-10">
          <Leaf className="size-5" />
        </div>
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-sm font-extrabold tracking-tight sm:text-lg">
            Fauna CITES · Perú
          </h1>
          <p className="truncate text-[11px] text-slate-500 dark:text-slate-400 sm:text-xs">
            Listado oficial MINAM 2023
          </p>
        </div>

        <button
          onClick={onOpenAnexos}
          aria-label="Anexos y fuentes"
          className={iconBtn}
        >
          <BookOpen className="size-[18px]" />
          <span className="hidden sm:inline">Anexos</span>
        </button>

        <a
          href="https://cites.org/esp"
          target="_blank"
          rel="noreferrer"
          title="Sitio oficial de la Convención CITES"
          className={`${iconBtn} hidden sm:flex`}
        >
          CITES <ExternalLink className="size-3.5" />
        </a>

        <button
          onClick={onToggleTheme}
          aria-label={dark ? 'Activar modo claro' : 'Activar modo oscuro'}
          className={iconBtn}
        >
          {dark ? <Sun className="size-[18px]" /> : <Moon className="size-[18px]" />}
        </button>
      </div>
    </header>
  );
}
