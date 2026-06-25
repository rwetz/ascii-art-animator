import { useEffect, useRef, useState } from "react";
import { useEditorStore } from "@/store/editorStore";
import type { ProjectData } from "@/store/editorStore";
import { toast } from "sonner";
import ASCII_ART from "@/assets/ascii-art.txt?raw";
import { WindowControls } from "@/components/WindowControls";
import { IS_MAC, USE_CUSTOM_WINDOW_CONTROLS } from "@/lib/platform";

interface WelcomeScreenProps {
  onNewProject(): void;
  onProjectLoaded(): void;
}

export function WelcomeScreen({ onNewProject, onProjectLoaded }: WelcomeScreenProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const artPreRef = useRef<HTMLPreElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [zoom, setZoom] = useState<number | null>(null);

  const { loadProject } = useEditorStore();
  const art = ASCII_ART.replace(/\n+$/, "");

  // "Contain" zoom: scale so the entire art fits inside the viewport with no clipping.
  // We measure the pre's natural scrollWidth × scrollHeight (with zoom=1),
  // then take the minimum of the two scale factors.
  useEffect(() => {
    const container = containerRef.current;
    const pre = artPreRef.current;
    if (!container || !pre) return;

    const naturalW = pre.scrollWidth;
    const naturalH = pre.scrollHeight;
    const cW = container.clientWidth;
    const cH = container.clientHeight;

    if (naturalW > 0 && naturalH > 0 && cW > 0 && cH > 0) {
      setZoom(Math.min(cW / naturalW, cH / naturalH));
    }
  }, []);

  // Any non-modifier keypress → new project
  useEffect(() => {
    const skip = new Set([
      "Escape","Tab","Shift","Control","Meta","Alt",
      "F1","F2","F3","F4","F5","F6","F7","F8","F9","F10","F11","F12",
    ]);
    function onKey(e: KeyboardEvent) {
      if (e.ctrlKey || e.metaKey || e.altKey || skip.has(e.key)) return;
      onNewProject();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onNewProject]);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const data = JSON.parse(text) as ProjectData;
      if (data.version !== 1 || !Array.isArray(data.frames)) {
        throw new Error("Not a valid .aaa project file");
      }
      loadProject(data);
      onProjectLoaded();
    } catch (err) {
      toast.error("Failed to open project", { description: String(err) });
    }
    e.target.value = "";
  }

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 z-50 overflow-hidden"
      style={{ background: "#000" }}
    >
      {/* Window chrome — drag region + controls (mirrors the header layout) */}
      <div
        data-tauri-drag-region
        className={`absolute inset-x-0 top-0 z-10 flex h-10 items-center select-none ${
          IS_MAC ? "pl-20 pr-2" : "pr-1"
        }`}
      >
        <div data-tauri-drag-region className="flex-1" />
        {USE_CUSTOM_WINDOW_CONTROLS && <WindowControls />}
      </div>

      {/* Full ASCII art — centered, contained, no clipping */}
      <div className="absolute inset-0 flex items-center justify-center">
        <pre
          ref={artPreRef}
          style={{
            zoom: zoom ?? 1,
            visibility: zoom == null ? "hidden" : "visible",
            fontFamily: "'Courier New', 'Lucida Console', monospace",
            fontSize: 14,
            lineHeight: 1,
            letterSpacing: 0,
            color: "#6e6e6e",
            whiteSpace: "pre",
            margin: 0,
            padding: 0,
          }}
        >
          {art}
        </pre>
      </div>

      {/* Minimal button strip pinned to the bottom — overlaid on the art */}
      <div
        className="absolute inset-x-0 bottom-0 flex items-center justify-center gap-4 py-3 select-none"
      >
        <button
          onClick={onNewProject}
          style={{
            color: "#888",
            fontSize: 11,
            fontFamily: "inherit",
            background: "none",
            border: "1px solid #333",
            borderRadius: 99,
            padding: "3px 14px",
            cursor: "pointer",
            letterSpacing: "0.04em",
          }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = "#bbb"; (e.currentTarget as HTMLElement).style.borderColor = "#555"; }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = "#888"; (e.currentTarget as HTMLElement).style.borderColor = "#333"; }}
        >
          New Project
        </button>

        <button
          onClick={() => fileInputRef.current?.click()}
          style={{
            color: "#444",
            fontSize: 11,
            fontFamily: "inherit",
            background: "none",
            border: "none",
            cursor: "pointer",
            letterSpacing: "0.04em",
            padding: "3px 0",
          }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = "#777"; }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = "#444"; }}
        >
          Open Project…
        </button>

        <input
          ref={fileInputRef}
          type="file"
          accept=".aaa,application/json"
          style={{ display: "none" }}
          onChange={handleFileChange}
        />
      </div>
    </div>
  );
}
