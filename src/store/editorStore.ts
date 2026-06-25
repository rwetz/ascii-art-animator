import { create } from "zustand";
import { immer } from "zustand/middleware/immer";

export interface Cell {
  char: string;
  fg: number; // 0-15 ANSI, -1 = default terminal fg
  bg: number; // 0-15 ANSI, -1 = transparent
}

export interface Frame {
  id: string;
  cells: Cell[][];
}

export type Tool = "pencil" | "eraser" | "fill";

export const DEFAULT_COLS = 60;
export const DEFAULT_ROWS = 24;

function emptyCell(): Cell {
  return { char: " ", fg: -1, bg: -1 };
}

function emptyGrid(w: number, h: number): Cell[][] {
  return Array.from({ length: h }, () =>
    Array.from({ length: w }, () => emptyCell())
  );
}

function makeFrame(w: number, h: number): Frame {
  return { id: crypto.randomUUID(), cells: emptyGrid(w, h) };
}

function cloneFrame(f: Frame): Frame {
  return {
    id: crypto.randomUUID(),
    cells: f.cells.map((row) => row.map((c) => ({ ...c }))),
  };
}

interface HistoryEntry {
  frameIndex: number;
  cells: Cell[][];
}

const MAX_HISTORY = 50;

interface EditorState {
  cols: number;
  rows: number;
  frames: Frame[];
  currentFrame: number;
  activeTool: Tool;
  activeChar: string;
  activeFg: number;
  activeBg: number;
  isPlaying: boolean;
  fps: number;
  onionSkin: boolean;
  loopPlayback: boolean;
  past: HistoryEntry[];
  future: HistoryEntry[];
}

interface EditorActions {
  setCell(row: number, col: number, partial: Partial<Cell>): void;
  setCells(updates: Array<{ row: number; col: number; partial: Partial<Cell> }>): void;
  floodFill(row: number, col: number): void;
  addFrame(): void;
  duplicateFrame(idx: number): void;
  deleteFrame(idx: number): void;
  moveFrame(from: number, to: number): void;
  setCurrentFrame(idx: number): void;
  setTool(tool: Tool): void;
  setActiveChar(char: string): void;
  setActiveFg(color: number): void;
  setActiveBg(color: number): void;
  setPlaying(playing: boolean): void;
  advanceFrame(): void;
  setFps(fps: number): void;
  toggleOnionSkin(): void;
  toggleLoopPlayback(): void;
  clearFrame(idx: number): void;
  pushHistory(): void;
  undo(): void;
  redo(): void;
  loadProject(data: ProjectData): void;
}

export interface ProjectData {
  version: 1;
  cols: number;
  rows: number;
  fps: number;
  frames: Array<{ id: string; cells: Cell[][] }>;
}

export type EditorStore = EditorState & EditorActions;

export const useEditorStore = create<EditorStore>()(
  immer((set, get) => ({
    cols: DEFAULT_COLS,
    rows: DEFAULT_ROWS,
    frames: [makeFrame(DEFAULT_COLS, DEFAULT_ROWS)],
    currentFrame: 0,
    activeTool: "pencil",
    activeChar: "█",
    activeFg: 14, // bright cyan
    activeBg: -1,
    isPlaying: false,
    fps: 8,
    onionSkin: false,
    loopPlayback: true,
    past: [],
    future: [],

    setCell(row, col, partial) {
      set((s) => {
        const f = s.frames[s.currentFrame];
        if (!f || row < 0 || row >= s.rows || col < 0 || col >= s.cols) return;
        Object.assign(f.cells[row][col], partial);
      });
    },

    setCells(updates) {
      set((s) => {
        const f = s.frames[s.currentFrame];
        if (!f) return;
        for (const { row, col, partial } of updates) {
          if (row >= 0 && row < s.rows && col >= 0 && col < s.cols) {
            Object.assign(f.cells[row][col], partial);
          }
        }
      });
    },

    floodFill(startRow, startCol) {
      const { cols, rows, frames, currentFrame, activeChar, activeFg, activeBg } = get();
      const frame = frames[currentFrame];
      if (!frame) return;

      const src = frame.cells[startRow][startCol];
      if (src.char === activeChar && src.fg === activeFg && src.bg === activeBg) return;

      const srcChar = src.char;
      const srcFg = src.fg;
      const srcBg = src.bg;

      // Snapshot before fill — captured from immutable current state via get()
      const snapshot = frame.cells.map((row) => row.map((c) => ({ ...c })));

      const visited = new Uint8Array(rows * cols);
      const queue: number[] = [startRow * cols + startCol];
      const updates: Array<{ row: number; col: number; partial: Partial<Cell> }> = [];

      while (queue.length > 0) {
        const idx = queue.pop()!;
        if (visited[idx]) continue;
        const r = Math.floor(idx / cols);
        const c = idx % cols;
        if (r < 0 || r >= rows || c < 0 || c >= cols) continue;
        const cell = frame.cells[r][c];
        if (cell.char !== srcChar || cell.fg !== srcFg || cell.bg !== srcBg) continue;
        visited[idx] = 1;
        updates.push({ row: r, col: c, partial: { char: activeChar, fg: activeFg, bg: activeBg } });
        if (r > 0) queue.push((r - 1) * cols + c);
        if (r < rows - 1) queue.push((r + 1) * cols + c);
        if (c > 0) queue.push(r * cols + (c - 1));
        if (c < cols - 1) queue.push(r * cols + (c + 1));
      }

      set((s) => {
        s.past.push({ frameIndex: currentFrame, cells: snapshot });
        if (s.past.length > MAX_HISTORY) s.past.shift();
        s.future = [];
        const f = s.frames[s.currentFrame];
        if (!f) return;
        for (const { row, col, partial } of updates) {
          Object.assign(f.cells[row][col], partial);
        }
      });
    },

    addFrame() {
      set((s) => {
        const blank = makeFrame(s.cols, s.rows);
        s.frames.splice(s.currentFrame + 1, 0, blank);
        s.currentFrame += 1;
      });
    },

    duplicateFrame(idx) {
      set((s) => {
        const src = s.frames[idx];
        if (!src) return;
        s.frames.splice(idx + 1, 0, cloneFrame(src));
        s.currentFrame = idx + 1;
      });
    },

    deleteFrame(idx) {
      set((s) => {
        if (s.frames.length === 1) return;
        s.frames.splice(idx, 1);
        s.currentFrame = Math.min(s.currentFrame, s.frames.length - 1);
      });
    },

    moveFrame(from, to) {
      set((s) => {
        const [f] = s.frames.splice(from, 1);
        s.frames.splice(to, 0, f);
        s.currentFrame = to;
      });
    },

    setCurrentFrame(idx) {
      set((s) => { s.currentFrame = idx; });
    },

    setTool(tool) {
      set((s) => { s.activeTool = tool; });
    },

    setActiveChar(char) {
      set((s) => { s.activeChar = char; });
    },

    setActiveFg(color) {
      set((s) => { s.activeFg = color; });
    },

    setActiveBg(color) {
      set((s) => { s.activeBg = color; });
    },

    setPlaying(playing) {
      set((s) => { s.isPlaying = playing; });
    },

    advanceFrame() {
      set((s) => {
        if (!s.isPlaying) return;
        const next = s.currentFrame + 1;
        if (next >= s.frames.length) {
          if (s.loopPlayback) {
            s.currentFrame = 0;
          } else {
            s.isPlaying = false;
          }
        } else {
          s.currentFrame = next;
        }
      });
    },

    setFps(fps) {
      set((s) => { s.fps = fps; });
    },

    toggleOnionSkin() {
      set((s) => { s.onionSkin = !s.onionSkin; });
    },

    toggleLoopPlayback() {
      set((s) => { s.loopPlayback = !s.loopPlayback; });
    },

    clearFrame(idx) {
      set((s) => {
        const f = s.frames[idx];
        if (!f) return;
        const snapshot = f.cells.map((row) => row.map((c) => ({ ...c })));
        s.past.push({ frameIndex: idx, cells: snapshot });
        if (s.past.length > MAX_HISTORY) s.past.shift();
        s.future = [];
        f.cells = emptyGrid(s.cols, s.rows);
      });
    },

    pushHistory() {
      const { frames, currentFrame } = get();
      const f = frames[currentFrame];
      if (!f) return;
      const cells = f.cells.map((row) => row.map((c) => ({ ...c })));
      set((s) => {
        s.past.push({ frameIndex: currentFrame, cells });
        if (s.past.length > MAX_HISTORY) s.past.shift();
        s.future = [];
      });
    },

    undo() {
      set((s) => {
        if (s.past.length === 0) return;
        const entry = s.past[s.past.length - 1];
        const f = s.frames[entry.frameIndex];
        if (!f) { s.past.pop(); return; }
        s.future.push({
          frameIndex: entry.frameIndex,
          cells: f.cells.map((row) => row.map((c) => ({ ...c }))),
        });
        if (s.future.length > MAX_HISTORY) s.future.shift();
        f.cells = entry.cells.map((row) => row.map((c) => ({ ...c })));
        s.currentFrame = entry.frameIndex;
        s.past.pop();
      });
    },

    redo() {
      set((s) => {
        if (s.future.length === 0) return;
        const entry = s.future[s.future.length - 1];
        const f = s.frames[entry.frameIndex];
        if (!f) { s.future.pop(); return; }
        s.past.push({
          frameIndex: entry.frameIndex,
          cells: f.cells.map((row) => row.map((c) => ({ ...c }))),
        });
        if (s.past.length > MAX_HISTORY) s.past.shift();
        f.cells = entry.cells.map((row) => row.map((c) => ({ ...c })));
        s.currentFrame = entry.frameIndex;
        s.future.pop();
      });
    },

    loadProject(data) {
      set((s) => {
        s.cols = data.cols ?? DEFAULT_COLS;
        s.rows = data.rows ?? DEFAULT_ROWS;
        s.fps = Math.min(60, Math.max(1, data.fps ?? 8));
        s.frames = data.frames.map((f) => ({
          id: f.id ?? crypto.randomUUID(),
          cells: f.cells,
        }));
        s.currentFrame = 0;
        s.past = [];
        s.future = [];
        s.isPlaying = false;
      });
    },
  }))
);
