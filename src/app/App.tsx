import { useEffect, useState, useCallback } from "react";
import { ThemeProvider } from "@/modules/theme/ThemeProvider";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/sonner";
import { Separator } from "@/components/ui/separator";
import { Header } from "@/app/header/Header";
import { AsciiCanvas } from "@/app/canvas/AsciiCanvas";
import { CharPalette } from "@/app/palette/CharPalette";
import { ColorPicker } from "@/app/colors/ColorPicker";
import { Timeline } from "@/app/timeline/Timeline";
import { PlaybackControls } from "@/app/controls/PlaybackControls";
import { Toolbar } from "@/app/controls/Toolbar";
import { WelcomeScreen } from "@/app/welcome/WelcomeScreen";
import { useEditorStore } from "@/store/editorStore";

function EditorShell() {
  const [showWelcome, setShowWelcome] = useState(true);
  const { setTool, setActiveChar, undo, redo } = useEditorStore();

  const dismissWelcome = useCallback(() => setShowWelcome(false), []);

  // Global keyboard shortcuts (only active when welcome is dismissed)
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (showWelcome) return;
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      const ctrl = e.ctrlKey || e.metaKey;

      switch (e.key.toLowerCase()) {
        case "z":
          if (ctrl) { e.preventDefault(); if (e.shiftKey) redo(); else undo(); }
          break;
        case "y":
          if (ctrl) { e.preventDefault(); redo(); }
          break;
        case "p": if (!ctrl) setTool("pencil"); break;
        case "e": if (!ctrl) setTool("eraser"); break;
        case "f": if (!ctrl) setTool("fill"); break;
        default:
          if (e.key.length === 1 && !ctrl && !e.altKey) setActiveChar(e.key);
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [showWelcome, setTool, setActiveChar, undo, redo]);

  return (
    <div className="relative flex h-full flex-col">
      {showWelcome && (
        <WelcomeScreen
          onNewProject={dismissWelcome}
          onProjectLoaded={dismissWelcome}
        />
      )}

      {!showWelcome && <Header onShowWelcome={() => setShowWelcome(true)} />}

      {/* Main workspace */}
      <div className="flex min-h-0 flex-1">
        {/* Left: tool strip + char palette */}
        <div className="flex shrink-0 border-r border-border/60 bg-sidebar">
          <Toolbar />
          <Separator orientation="vertical" />
          <div className="w-52">
            <CharPalette />
          </div>
        </div>

        {/* Center: auto-scaling canvas */}
        <AsciiCanvas />

        {/* Right: color picker */}
        <div className="w-52 shrink-0 border-l border-border/60 bg-sidebar">
          <ColorPicker />
        </div>
      </div>

      {/* Bottom: playback + timeline */}
      <div className="shrink-0">
        <PlaybackControls />
        <Timeline />
      </div>
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <TooltipProvider delayDuration={0}>
        <EditorShell />
        <Toaster />
      </TooltipProvider>
    </ThemeProvider>
  );
}
