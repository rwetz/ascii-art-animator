import { HugeiconsIcon } from "@hugeicons/react";
import {
  Moon02Icon,
  Sun01Icon,
  Download01Icon,
  FloppyDiskIcon,
  Home01Icon,
} from "@hugeicons/core-free-icons";
import { WindowControls } from "@/components/WindowControls";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { IS_MAC, USE_CUSTOM_WINDOW_CONTROLS } from "@/lib/platform";
import { useTheme } from "@/modules/theme/ThemeProvider";
import { useEditorStore } from "@/store/editorStore";
import { exportGif, exportAnsiFile, exportRustBinary, saveProject, downloadBlob } from "@/app/export/exportUtils";
import { toast } from "sonner";

interface HeaderProps {
  onShowWelcome(): void;
}

export function Header({ onShowWelcome }: HeaderProps) {
  const { resolvedMode, setMode } = useTheme();
  const { frames, cols, rows, fps } = useEditorStore();

  async function handleExportGif() {
    const id = toast.loading("Rendering GIF…");
    try {
      const blob = await exportGif(frames, cols, rows, fps);
      downloadBlob(blob, "animation.gif");
      toast.success("GIF exported!", { id });
    } catch (e) {
      toast.error("Export failed", { id, description: String(e) });
    }
  }

  function handleExportAnsi() {
    const blob = exportAnsiFile(frames, cols, rows, fps);
    downloadBlob(blob, "animation.sh");
    toast.success("Shell script exported!");
  }

  function handleExportRust() {
    const blob = exportRustBinary(frames, cols, rows, fps);
    downloadBlob(blob, "animation.rs");
    toast.success("Rust source exported! Compile with: rustc animation.rs -o anim && ./anim");
  }

  function handleSave() {
    const blob = saveProject(frames, cols, rows, fps);
    downloadBlob(blob, "project.aaa");
    toast.success("Project saved!");
  }

  return (
    <div
      data-tauri-drag-region
      className={`flex h-10 shrink-0 items-center gap-2 border-b border-border/60 bg-card select-none ${
        IS_MAC ? "pl-20 pr-2" : "pl-3 pr-0"
      }`}
    >
      {/* Home button */}
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon-sm"
            className="rounded-md text-muted-foreground hover:text-foreground"
            onClick={onShowWelcome}
          >
            <HugeiconsIcon icon={Home01Icon} size={15} strokeWidth={1.75} />
          </Button>
        </TooltipTrigger>
        <TooltipContent>Home</TooltipContent>
      </Tooltip>

      {/* App name */}
      <span className="text-sm font-semibold text-foreground/80 tracking-tight pointer-events-none">
        ASCII Art Animator
      </span>

      {/* Drag spacer */}
      <div data-tauri-drag-region className="flex-1" />

      {/* Save */}
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon-sm"
            className="rounded-md text-muted-foreground hover:text-foreground"
            onClick={handleSave}
          >
            <HugeiconsIcon icon={FloppyDiskIcon} size={15} strokeWidth={1.75} />
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p className="font-medium">Save Project</p>
          <p className="text-muted-foreground mt-0.5">Downloads as project.aaa</p>
        </TooltipContent>
      </Tooltip>

      {/* Export menu */}
      <div className="flex items-center gap-1">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon-sm"
              className="rounded-md text-muted-foreground hover:text-foreground"
              onClick={handleExportGif}
            >
              <HugeiconsIcon icon={Download01Icon} size={15} strokeWidth={1.75} />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p className="font-medium">Export</p>
            <p className="text-muted-foreground mt-0.5">Click → GIF</p>
          </TooltipContent>
        </Tooltip>

        <div className="flex gap-0.5">
          <Button
            variant="ghost"
            size="xs"
            className="rounded-md text-muted-foreground hover:text-foreground text-xs h-7 px-2"
            onClick={handleExportAnsi}
          >
            .sh
          </Button>
          <Button
            variant="ghost"
            size="xs"
            className="rounded-md text-muted-foreground hover:text-foreground text-xs h-7 px-2"
            onClick={handleExportRust}
          >
            .rs
          </Button>
        </div>
      </div>

      {/* Theme toggle */}
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon-sm"
            className="rounded-md text-muted-foreground hover:text-foreground"
            onClick={() => setMode(resolvedMode === "dark" ? "light" : "dark")}
          >
            <HugeiconsIcon
              icon={resolvedMode === "dark" ? Sun01Icon : Moon02Icon}
              size={15}
              strokeWidth={1.75}
            />
          </Button>
        </TooltipTrigger>
        <TooltipContent>Toggle theme</TooltipContent>
      </Tooltip>

      {USE_CUSTOM_WINDOW_CONTROLS && (
        <>
          <span className="ml-1 h-5 w-px shrink-0 bg-border" />
          <WindowControls />
        </>
      )}
    </div>
  );
}
