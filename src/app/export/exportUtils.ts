import type { Cell, Frame, ProjectData } from "@/store/editorStore";
import { ANSI_COLORS, CANVAS_BG, DEFAULT_FG, CELL_W, CELL_H, FONT_SIZE, FONT } from "@/lib/ansiColors";

// ── Project save ─────────────────────────────────────────────────────────────

export function saveProject(frames: Frame[], cols: number, rows: number, fps: number): Blob {
  const data: ProjectData = {
    version: 1,
    cols,
    rows,
    fps,
    frames: frames.map((f) => ({ id: f.id, cells: f.cells })),
  };
  return new Blob([JSON.stringify(data)], { type: "application/json" });
}

// ── Download helper ──────────────────────────────────────────────────────────

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

// ── Canvas frame renderer ────────────────────────────────────────────────────

export function renderFrameToContext(
  ctx: CanvasRenderingContext2D,
  cells: Cell[][],
  cols: number,
  rows: number,
  opacity = 1
) {
  ctx.save();
  ctx.globalAlpha = opacity;
  ctx.font = `${FONT_SIZE}px ${FONT}`;
  ctx.textAlign = "left";
  ctx.textBaseline = "top";

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const cell = cells[row]?.[col];
      if (!cell) continue;
      const x = col * CELL_W;
      const y = row * CELL_H;

      if (cell.bg >= 0) {
        ctx.fillStyle = ANSI_COLORS[cell.bg];
        ctx.fillRect(x, y, CELL_W, CELL_H);
      }

      if (cell.char !== " ") {
        ctx.fillStyle = cell.fg >= 0 ? ANSI_COLORS[cell.fg] : DEFAULT_FG;
        ctx.fillText(cell.char, x, y + 2);
      }
    }
  }

  ctx.restore();
}

// ── GIF export ───────────────────────────────────────────────────────────────

export async function exportGif(
  frames: Frame[],
  cols: number,
  rows: number,
  fps: number
): Promise<Blob> {
  const { GIFEncoder, quantize, applyPalette } = await import("gifenc");

  const canvasW = cols * CELL_W;
  const canvasH = rows * CELL_H;

  const canvas = document.createElement("canvas");
  canvas.width = canvasW;
  canvas.height = canvasH;
  const ctx = canvas.getContext("2d", { willReadFrequently: true })!;

  await document.fonts.load(`${FONT_SIZE}px 'JetBrains Mono'`);

  const gif = GIFEncoder();
  const delay = Math.round(100 / fps); // centiseconds

  for (const frame of frames) {
    ctx.fillStyle = CANVAS_BG;
    ctx.fillRect(0, 0, canvasW, canvasH);
    renderFrameToContext(ctx, frame.cells, cols, rows);

    const imageData = ctx.getImageData(0, 0, canvasW, canvasH);
    const rgba = new Uint8Array(imageData.data.buffer);
    const palette = quantize(rgba, 256);
    const index = applyPalette(rgba, palette);
    gif.writeFrame(index, canvasW, canvasH, { palette, delay, repeat: 0 });
  }

  gif.finish();
  return new Blob([gif.bytesView()], { type: "image/gif" });
}

// ── ANSI escape export ───────────────────────────────────────────────────────

function cellToAnsi(cell: Cell): string {
  let codes = "0";
  if (cell.fg >= 0) codes += `;${cell.fg < 8 ? 30 + cell.fg : 90 + cell.fg - 8}`;
  if (cell.bg >= 0) codes += `;${cell.bg < 8 ? 40 + cell.bg : 100 + cell.bg - 8}`;
  return `\x1b[${codes}m${cell.char}`;
}

function frameToAnsiString(cells: Cell[][], cols: number, rows: number): string {
  let out = "";
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      out += cellToAnsi(cells[r][c]);
    }
    out += "\x1b[0m\n";
  }
  return out;
}

export function exportAnsiFile(frames: Frame[], cols: number, rows: number, fps: number): Blob {
  const delayMs = Math.round(1000 / fps);
  let script = "#!/usr/bin/env bash\n# ASCII Art Animation — play with: bash animation.sh\n\nclear\n\nwhile true; do\n";

  for (const frame of frames) {
    const ansi = frameToAnsiString(frame.cells, cols, rows);
    const escaped = ansi.replace(/\\/g, "\\\\").replace(/`/g, "\\`").replace(/\$/g, "\\$");
    script += `  printf '\\033[H${escaped}'\n`;
    script += `  sleep ${(delayMs / 1000).toFixed(3)}\n`;
  }

  script += "done\n";
  return new Blob([script], { type: "text/x-sh" });
}

// ── Self-running Rust binary export ─────────────────────────────────────────

export function exportRustBinary(frames: Frame[], cols: number, rows: number, fps: number): Blob {
  const delayMs = Math.round(1000 / fps);
  const frameStrings = frames.map((f) => frameToAnsiString(f.cells, cols, rows));

  const framesConst = frameStrings
    .map((s) => {
      const escaped = s
        .replace(/\\/g, "\\\\")
        .replace(/"/g, '\\"')
        .replace(/\x1b/g, "\\x1b")
        .replace(/\n/g, "\\n");
      return `    "${escaped}",`;
    })
    .join("\n");

  const src = `use std::io::{self, Write};
use std::thread;
use std::time::Duration;

const FRAMES: &[&str] = &[
${framesConst}
];

fn main() {
    let delay = Duration::from_millis(${delayMs});
    let mut stdout = io::BufWriter::new(io::stdout().lock());
    loop {
        for frame in FRAMES {
            write!(stdout, "\\x1b[2J\\x1b[H{frame}").unwrap();
            stdout.flush().unwrap();
            thread::sleep(delay);
        }
    }
}
`;

  return new Blob([src], { type: "text/x-rust" });
}
