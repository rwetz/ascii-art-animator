import { HugeiconsIcon } from "@hugeicons/react";
import {
  PencilEdit01Icon,
  EraserIcon,
  PaintBucketIcon,
  Delete01Icon,
} from "@hugeicons/core-free-icons";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { useEditorStore, type Tool } from "@/store/editorStore";

const TOOLS: { id: Tool; icon: unknown; label: string; shortcut: string }[] = [
  { id: "pencil", icon: PencilEdit01Icon, label: "Pencil", shortcut: "P" },
  { id: "eraser", icon: EraserIcon, label: "Eraser", shortcut: "E" },
  { id: "fill",   icon: PaintBucketIcon, label: "Fill bucket", shortcut: "F" },
];

export function Toolbar() {
  const { activeTool, setTool, currentFrame, clearFrame } = useEditorStore();

  return (
    <div className="flex flex-col items-center gap-1 p-2 border-r border-border/60">
      {TOOLS.map((t) => (
        <Tooltip key={t.id}>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon-sm"
              className={cn(
                "rounded-md",
                activeTool === t.id
                  ? "bg-brand/15 text-brand"
                  : "text-muted-foreground hover:text-foreground"
              )}
              onClick={() => setTool(t.id)}
            >
              <HugeiconsIcon icon={t.icon as Parameters<typeof HugeiconsIcon>[0]["icon"]} size={16} strokeWidth={1.75} />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="right">
            {t.label} <span className="ml-1 text-muted-foreground">{t.shortcut}</span>
          </TooltipContent>
        </Tooltip>
      ))}

      <Separator className="my-1" />

      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon-sm"
            className="rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10"
            onClick={() => clearFrame(currentFrame)}
          >
            <HugeiconsIcon icon={Delete01Icon} size={16} strokeWidth={1.75} />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="right">Clear frame</TooltipContent>
      </Tooltip>
    </div>
  );
}
