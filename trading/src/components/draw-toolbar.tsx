"use client";

import type { Tool } from "./drawing-layer";

const TOOLS: { key: Tool; label: string; hint: string; icon: React.ReactNode }[] = [
  { key: "cursor", label: "Moure", hint: "", icon: <path d="M5 3l14 8-6 2-2 6z" /> },
  {
    key: "long",
    label: "Llarga",
    hint: "Toca on entraries comprant. Després arrossega els punts per moure l'objectiu i l'stop.",
    icon: (
      <>
        <rect x="4" y="4" width="16" height="7" fill="#16a34a" fillOpacity=".25" stroke="#16a34a" />
        <rect x="4" y="11" width="16" height="6" fill="#dc2626" fillOpacity=".25" stroke="#dc2626" />
      </>
    ),
  },
  {
    key: "short",
    label: "Curta",
    hint: "Toca on entraries venent (apostant que baixa). Després arrossega l'objectiu i l'stop.",
    icon: (
      <>
        <rect x="4" y="4" width="16" height="6" fill="#dc2626" fillOpacity=".25" stroke="#dc2626" />
        <rect x="4" y="10" width="16" height="7" fill="#16a34a" fillOpacity=".25" stroke="#16a34a" />
      </>
    ),
  },
  { key: "hline", label: "Línia", hint: "Toca el gràfic per posar una línia horitzontal (suport o resistència).", icon: <path d="M3 12h18M6 12a1 1 0 1 0 0 .01" /> },
  { key: "trend", label: "Tendència", hint: "Arrossega d'un punt a un altre per dibuixar una línia de tendència.", icon: <path d="M4 19L20 5M4 19a1 1 0 1 0 0 .01M20 5a1 1 0 1 0 0 .01" /> },
  { key: "brush", label: "Pinzell", hint: "Dibuixa lliurement amb el dit o el ratolí.", icon: <path d="M4 18c3 0 3-4 6-4s2 4 5 2 3-9 5-10" /> },
];

const btn = "flex h-11 min-w-[50px] shrink-0 flex-col items-center justify-center rounded-lg px-1.5 text-[10px] font-semibold leading-none";

export function DrawToolbar({
  tool,
  setTool,
  canUndo,
  onUndo,
  hasSelection,
  hasDrawings,
  onDelete,
}: {
  tool: Tool;
  setTool: (t: Tool) => void;
  canUndo: boolean;
  onUndo: () => void;
  hasSelection: boolean;
  hasDrawings: boolean;
  onDelete: () => void;
}) {
  const hint = TOOLS.find((t) => t.key === tool)?.hint;
  return (
    <div className="flex flex-col gap-1">
      <div className="no-scrollbar flex items-center gap-0.5 overflow-x-auto rounded-xl bg-ground p-1">
        {TOOLS.map((t) => (
          <button
            key={t.key}
            type="button"
            title={t.label}
            aria-pressed={tool === t.key}
            onClick={() => setTool(tool === t.key && t.key !== "cursor" ? "cursor" : t.key)}
            className={`${btn} gap-1 ${tool === t.key ? "bg-white text-brand shadow-sm" : "text-muted"}`}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              {t.icon}
            </svg>
            {t.label}
          </button>
        ))}
        <span className="mx-0.5 h-7 w-px shrink-0 bg-line" />
        <button type="button" title="Desfer" onClick={onUndo} disabled={!canUndo} className={`${btn} gap-1 text-muted disabled:opacity-35`}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M9 14L4 9l5-5" /><path d="M4 9h10a6 6 0 0 1 0 12h-3" /></svg>
          Desfer
        </button>
        <button type="button" title={hasSelection ? "Esborrar el seleccionat" : "Esborrar-ho tot"} onClick={onDelete} disabled={!hasDrawings} className={`${btn} gap-1 ${hasSelection ? "text-down" : "text-muted"} disabled:opacity-35`}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3" /></svg>
          {hasSelection ? "Esborrar" : "Esborrar tot"}
        </button>
      </div>
      {hint && <p className="px-1 text-xs text-brand">{hint}</p>}
      {!hint && hasSelection && <p className="px-1 text-xs text-muted">Arrossega els punts blancs per ajustar-ho. Toca fora per deseleccionar.</p>}
    </div>
  );
}
