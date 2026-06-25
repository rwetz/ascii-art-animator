import { useEffect, useRef } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  PlayIcon,
  PauseIcon,
  RepeatIcon,
  LayersIcon,
} from "@hugeicons/core-free-icons";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { useEditorStore } from "@/store/editorStore";

export function PlaybackControls() {
  const {
    isPlaying, fps, onionSkin, loopPlayback,
    setPlaying, setFps, toggleOnionSkin, toggleLoopPlayback,
    advanceFrame, frames, currentFrame,
  } = useEditorStore();

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (isPlaying) {
      intervalRef.current = setInterval(() => {
        advanceFrame();
      }, 1000 / fps);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isPlaying, fps, advanceFrame]);

  return (
    <div className="flex items-center gap-3 px-3 py-1.5 border-t border-border/60">
      {/* Play/Pause */}
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant={isPlaying ? "brand" : "ghost"}
            size="icon-sm"
            className="rounded-md shrink-0"
            onClick={() => setPlaying(!isPlaying)}
          >
            <HugeiconsIcon
              icon={isPlaying ? PauseIcon : PlayIcon}
              size={14}
              strokeWidth={2}
            />
          </Button>
        </TooltipTrigger>
        <TooltipContent>{isPlaying ? "Pause" : "Play"}</TooltipContent>
      </Tooltip>

      {/* Frame counter */}
      <span className="text-xs text-muted-foreground font-mono tabular-nums shrink-0">
        {currentFrame + 1}/{frames.length}
      </span>

      {/* Loop */}
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon-sm"
            className={cn(
              "rounded-md shrink-0",
              loopPlayback ? "text-brand" : "text-muted-foreground"
            )}
            onClick={toggleLoopPlayback}
          >
            <HugeiconsIcon icon={RepeatIcon} size={14} strokeWidth={2} />
          </Button>
        </TooltipTrigger>
        <TooltipContent>Loop playback</TooltipContent>
      </Tooltip>

      {/* Onion skin */}
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon-sm"
            className={cn(
              "rounded-md shrink-0",
              onionSkin ? "text-brand" : "text-muted-foreground"
            )}
            onClick={toggleOnionSkin}
          >
            <HugeiconsIcon icon={LayersIcon} size={14} strokeWidth={2} />
          </Button>
        </TooltipTrigger>
        <TooltipContent>Onion skin (show prev frame at 25%)</TooltipContent>
      </Tooltip>

      {/* FPS */}
      <div className="flex items-center gap-2 min-w-0 flex-1 max-w-40">
        <span className="text-xs text-muted-foreground shrink-0">
          {fps} fps
        </span>
        <Slider
          min={1}
          max={30}
          step={1}
          value={[fps]}
          onValueChange={([v]) => setFps(v)}
          className="flex-1"
        />
      </div>
    </div>
  );
}
