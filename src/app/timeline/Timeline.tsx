import { useEffect, useRef } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Add01Icon,
  Copy01Icon,
  Delete02Icon,
} from "@hugeicons/core-free-icons";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { useEditorStore, type Frame } from "@/store/editorStore";
import { ANSI_COLORS, CANVAS_BG } from "@/lib/ansiColors";

const THUMB_W = 90;
const THUMB_H = 38;

function FrameThumbnail({ frame, cols, rows }: { frame: Frame; cols: number; rows: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    const cw = THUMB_W / cols;
    const ch = THUMB_H / rows;

    ctx.fillStyle = CANVAS_BG;
    ctx.fillRect(0, 0, THUMB_W, THUMB_H);

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const cell = frame.cells[r]?.[c];
        if (!cell) continue;
        const x = c * cw;
        const y = r * ch;
        if (cell.bg >= 0) {
          ctx.fillStyle = ANSI_COLORS[cell.bg];
          ctx.fillRect(x, y, cw + 0.5, ch + 0.5);
        } else if (cell.char !== " " && cell.fg >= 0) {
          ctx.fillStyle = ANSI_COLORS[cell.fg] + "80"; // 50% opacity for characters without bg
          ctx.fillRect(x, y, cw + 0.5, ch + 0.5);
        }
      }
    }
  }, [frame, cols, rows]);

  return (
    <canvas
      ref={canvasRef}
      width={THUMB_W}
      height={THUMB_H}
      className="block rounded-sm"
      style={{ imageRendering: "pixelated" }}
    />
  );
}

export function Timeline() {
  const {
    frames, currentFrame, cols, rows,
    setCurrentFrame, addFrame, duplicateFrame, deleteFrame,
  } = useEditorStore();

  const scrollRef = useRef<HTMLDivElement>(null);

  // Scroll the selected frame into view
  useEffect(() => {
    const container = scrollRef.current;
    if (!container) return;
    const selected = container.children[currentFrame] as HTMLElement | undefined;
    if (selected) {
      selected.scrollIntoView({ inline: "center", block: "nearest", behavior: "smooth" });
    }
  }, [currentFrame]);

  return (
    <div className="flex items-stretch border-t border-border/60 bg-sidebar">
      {/* Frame actions */}
      <div className="flex flex-col justify-center gap-1 px-2 border-r border-border/60 shrink-0">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon-xs"
              className="rounded-md text-muted-foreground hover:text-foreground"
              onClick={addFrame}
            >
              <HugeiconsIcon icon={Add01Icon} size={13} strokeWidth={2} />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="right">Add frame after current</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon-xs"
              className="rounded-md text-muted-foreground hover:text-foreground"
              onClick={() => duplicateFrame(currentFrame)}
            >
              <HugeiconsIcon icon={Copy01Icon} size={13} strokeWidth={2} />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="right">Duplicate frame</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon-xs"
              className="rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10"
              onClick={() => deleteFrame(currentFrame)}
              disabled={frames.length === 1}
            >
              <HugeiconsIcon icon={Delete02Icon} size={13} strokeWidth={2} />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="right">Delete frame</TooltipContent>
        </Tooltip>
      </div>

      {/* Scrollable frame strip */}
      <div
        ref={scrollRef}
        className="flex flex-1 gap-2 overflow-x-auto px-2 py-2 nexis-scrollbar"
      >
        {frames.map((frame, i) => (
          <button
            key={frame.id}
            type="button"
            onClick={() => setCurrentFrame(i)}
            className={cn(
              "relative shrink-0 flex flex-col items-center gap-1 rounded-md border-2 p-0.5 transition-all",
              i === currentFrame
                ? "border-brand brand-glow"
                : "border-border/60 hover:border-border"
            )}
          >
            <FrameThumbnail frame={frame} cols={cols} rows={rows} />
            <span className="text-[9px] text-muted-foreground tabular-nums">
              {i + 1}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
