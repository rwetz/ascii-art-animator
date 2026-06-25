import { useEffect, useRef, useState, useCallback } from "react";
import { useEditorStore } from "@/store/editorStore";
import { renderFrameToContext } from "@/app/export/exportUtils";
import { CANVAS_BG, CELL_W, CELL_H } from "@/lib/ansiColors";

export function AsciiCanvas() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isDrawingRef = useRef(false);
  const lastCellRef = useRef<[number, number] | null>(null);
  const [hoverCell, setHoverCell] = useState<[number, number] | null>(null);
  const [scale, setScale] = useState(1);

  const store = useEditorStore();
  const { cols, rows, frames, currentFrame, onionSkin, activeTool, activeChar, activeFg, activeBg } = store;

  const frame = frames[currentFrame];
  const prevFrame = currentFrame > 0 ? frames[currentFrame - 1] : null;

  const canvasW = cols * CELL_W;
  const canvasH = rows * CELL_H;

  // Watch container size and compute CSS scale to fill available space
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const observer = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      const pad = 48;
      const s = Math.min((width - pad) / canvasW, (height - pad) / canvasH);
      setScale(Math.max(0.3, Math.min(s, 4)));
    });

    observer.observe(container);
    return () => observer.disconnect();
  }, [canvasW, canvasH]);

  // Render canvas whenever state changes
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !frame) return;
    const ctx = canvas.getContext("2d")!;

    ctx.fillStyle = CANVAS_BG;
    ctx.fillRect(0, 0, canvasW, canvasH);

    if (onionSkin && prevFrame) {
      renderFrameToContext(ctx, prevFrame.cells, cols, rows, 0.25);
    }

    renderFrameToContext(ctx, frame.cells, cols, rows, 1);

    // Hover cursor
    if (hoverCell) {
      const [r, c] = hoverCell;
      ctx.strokeStyle = "rgba(255,255,255,0.55)";
      ctx.lineWidth = 1;
      ctx.strokeRect(c * CELL_W + 0.5, r * CELL_H + 0.5, CELL_W - 1, CELL_H - 1);
    }
  }, [frame, prevFrame, onionSkin, hoverCell, cols, rows, canvasW, canvasH]);

  const getCellFromEvent = useCallback((e: React.MouseEvent): [number, number] => {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    // rect already reflects CSS scaling, so scaleX/Y correctly map screen→canvas pixels
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;
    return [
      Math.max(0, Math.min(rows - 1, Math.floor(y / CELL_H))),
      Math.max(0, Math.min(cols - 1, Math.floor(x / CELL_W))),
    ];
  }, [cols, rows]);

  const applyTool = useCallback((row: number, col: number) => {
    if (activeTool === "pencil") {
      store.setCell(row, col, { char: activeChar, fg: activeFg, bg: activeBg });
    } else if (activeTool === "eraser") {
      store.setCell(row, col, { char: " ", fg: -1, bg: -1 });
    } else if (activeTool === "fill") {
      store.floodFill(row, col);
    }
  }, [activeTool, activeChar, activeFg, activeBg, store]);

  function handleMouseDown(e: React.MouseEvent) {
    if (e.button !== 0) return;
    // floodFill pushes its own history entry; pencil/eraser need one per stroke
    if (activeTool !== "fill") store.pushHistory();
    isDrawingRef.current = true;
    const cell = getCellFromEvent(e);
    lastCellRef.current = cell;
    applyTool(cell[0], cell[1]);
  }

  function handleMouseMove(e: React.MouseEvent) {
    const cell = getCellFromEvent(e);
    setHoverCell(cell);
    if (!isDrawingRef.current) return;
    const last = lastCellRef.current;
    if (last && last[0] === cell[0] && last[1] === cell[1]) return;
    lastCellRef.current = cell;
    if (activeTool !== "fill") applyTool(cell[0], cell[1]);
  }

  function handleMouseUp() {
    isDrawingRef.current = false;
    lastCellRef.current = null;
  }

  function handleMouseLeave() {
    setHoverCell(null);
    isDrawingRef.current = false;
    lastCellRef.current = null;
  }

  return (
    <div ref={containerRef} className="relative flex-1 overflow-hidden bg-background">
      <div
        className="absolute"
        style={{
          top: "50%",
          left: "50%",
          transform: `translate(-50%, -50%) scale(${scale})`,
        }}
      >
        <div className="relative rounded-md shadow-2xl ring-1 ring-border/40" style={{ lineHeight: 0 }}>
          <canvas
            ref={canvasRef}
            width={canvasW}
            height={canvasH}
            className="block"
            style={{ imageRendering: "pixelated" }}
          />
          {/* Invisible overlay captures mouse events without interfering with canvas rendering */}
          <div
            className="absolute inset-0 cursor-crosshair"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseLeave}
          />
        </div>
      </div>
    </div>
  );
}
