import { cn } from "@/lib/utils";
import { useEditorStore } from "@/store/editorStore";
import { ANSI_COLORS, ANSI_COLOR_NAMES } from "@/lib/ansiColors";

type Target = "fg" | "bg";

export function ColorPicker() {
  const { activeFg, activeBg, setActiveFg, setActiveBg } = useEditorStore();
  const [activeTarget, setActiveTarget] = useState<Target>("fg");

  const selectedColor = activeTarget === "fg" ? activeFg : activeBg;
  const setColor = activeTarget === "fg" ? setActiveFg : setActiveBg;

  return (
    <div className="flex flex-col gap-2 p-2">
      {/* FG / BG selector */}
      <div className="flex items-center gap-1.5 px-1">
        <span className="text-xs text-muted-foreground">Colors</span>
        <div className="ml-auto flex gap-1">
          {(["fg", "bg"] as const).map((t) => {
            const color = t === "fg" ? activeFg : activeBg;
            return (
              <button
                key={t}
                type="button"
                onClick={() => setActiveTarget(t)}
                title={t === "fg" ? "Foreground" : "Background"}
                className={cn(
                  "flex h-7 w-12 items-center justify-center gap-1 rounded-md border text-xs font-medium transition-colors",
                  activeTarget === t
                    ? "border-brand bg-brand/10 text-brand"
                    : "border-border text-muted-foreground hover:border-border/80 hover:text-foreground"
                )}
              >
                <span
                  className="size-3 rounded-sm border border-white/20"
                  style={{
                    background: color >= 0 ? ANSI_COLORS[color] : "transparent",
                    backgroundImage: color < 0
                      ? "repeating-linear-gradient(45deg, #666 0, #666 2px, transparent 0, transparent 50%)"
                      : undefined,
                    backgroundSize: "6px 6px",
                  }}
                />
                {t.toUpperCase()}
              </button>
            );
          })}
        </div>
      </div>

      {/* None / transparent option */}
      <button
        type="button"
        onClick={() => setColor(-1)}
        className={cn(
          "mx-1 flex h-7 items-center gap-2 rounded-md px-2 text-xs transition-colors",
          selectedColor === -1
            ? "bg-brand/15 text-brand"
            : "text-muted-foreground hover:bg-accent hover:text-foreground"
        )}
      >
        <span
          className="size-4 rounded-sm border border-border"
          style={{
            backgroundImage:
              "repeating-linear-gradient(45deg, #666 0, #666 2px, transparent 0, transparent 50%)",
            backgroundSize: "6px 6px",
          }}
        />
        None (transparent)
      </button>

      {/* 16 ANSI colors — 8 standard + 8 bright */}
      <div className="flex flex-col gap-1 px-1">
        <span className="text-[10px] text-muted-foreground">Standard</span>
        <div className="grid grid-cols-8 gap-1">
          {ANSI_COLORS.slice(0, 8).map((hex, i) => (
            <ColorSwatch
              key={i}
              hex={hex}
              index={i}
              selected={selectedColor === i}
              label={ANSI_COLOR_NAMES[i]}
              onClick={() => setColor(i)}
            />
          ))}
        </div>
        <span className="mt-1 text-[10px] text-muted-foreground">Bright</span>
        <div className="grid grid-cols-8 gap-1">
          {ANSI_COLORS.slice(8).map((hex, i) => (
            <ColorSwatch
              key={i + 8}
              hex={hex}
              index={i + 8}
              selected={selectedColor === i + 8}
              label={ANSI_COLOR_NAMES[i + 8]}
              onClick={() => setColor(i + 8)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function ColorSwatch({
  hex,
  index,
  selected,
  label,
  onClick,
}: {
  hex: string;
  index: number;
  selected: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      title={`${index}: ${label} (${hex})`}
      onClick={onClick}
      className={cn(
        "aspect-square w-full rounded-sm border-2 transition-all",
        selected ? "border-brand scale-110 shadow-md" : "border-transparent hover:border-white/30"
      )}
      style={{ background: hex }}
    />
  );
}

// Needed import
import { useState } from "react";
