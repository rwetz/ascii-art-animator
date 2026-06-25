import { useState } from "react";
import { cn } from "@/lib/utils";
import { useEditorStore } from "@/store/editorStore";
import { ScrollArea } from "@/components/ui/scroll-area";

const GROUPS: { label: string; chars: string[] }[] = [
  {
    label: "Blocks",
    chars: ["█", "▓", "▒", "░", "▀", "▄", "▌", "▐", "▖", "▗", "▘", "▙", "▚", "▛", "▜", "▝", "▞", "▟"],
  },
  {
    label: "Box",
    chars: [
      "─", "│", "┌", "┐", "└", "┘", "├", "┤", "┬", "┴", "┼",
      "═", "║", "╔", "╗", "╚", "╝", "╠", "╣", "╦", "╩", "╬",
      "╒", "╓", "╕", "╖", "╘", "╙", "╛", "╜", "╞", "╟", "╡", "╢",
    ],
  },
  {
    label: "Shapes",
    chars: ["■", "□", "▪", "▫", "◆", "◇", "●", "○", "◉", "◎", "◐", "◑", "◒", "◓", "◼", "◻", "⬛", "⬜"],
  },
  {
    label: "Arrows",
    chars: ["←", "→", "↑", "↓", "↔", "↕", "↖", "↗", "↘", "↙", "◄", "►", "▲", "▼", "⇐", "⇒", "⇑", "⇓"],
  },
  {
    label: "Symbols",
    chars: ["★", "☆", "♦", "♣", "♠", "♥", "•", "·", "°", "∞", "≈", "±", "×", "÷", "√", "∑", "π", "Ω"],
  },
  {
    label: "Faces",
    chars: ["☺", "☻", "☼", "♪", "♫", "♂", "♀", "⚡", "☁", "☂", "⚙", "✓", "✗", "✦", "✧", "❤", "⚔", "⚑"],
  },
  {
    label: "ASCII",
    chars: [
      "!", "@", "#", "$", "%", "^", "&", "*", "(", ")", "-", "+",
      "=", "[", "]", "{", "}", "|", "\\", "/", ":", ";", '"', "'",
      "<", ">", ",", ".", "?", "~", "`", "_",
    ],
  },
];

export function CharPalette() {
  const { activeChar, setActiveChar } = useEditorStore();
  const [activeGroup, setActiveGroup] = useState(0);

  return (
    <div className="flex flex-col gap-2 p-2">
      {/* Active char preview */}
      <div className="flex items-center gap-2 px-1">
        <span className="text-xs text-muted-foreground">Char</span>
        <div className="flex h-8 w-8 items-center justify-center rounded-md border border-border bg-muted font-mono text-base text-foreground">
          {activeChar}
        </div>
      </div>

      {/* Group tabs */}
      <div className="flex flex-wrap gap-1">
        {GROUPS.map((g, i) => (
          <button
            key={g.label}
            type="button"
            onClick={() => setActiveGroup(i)}
            className={cn(
              "rounded px-1.5 py-0.5 text-[10px] font-medium transition-colors",
              activeGroup === i
                ? "bg-brand text-brand-foreground"
                : "text-muted-foreground hover:text-foreground hover:bg-accent"
            )}
          >
            {g.label}
          </button>
        ))}
      </div>

      {/* Character grid */}
      <ScrollArea className="h-40">
        <div className="grid grid-cols-6 gap-px">
          {GROUPS[activeGroup].chars.map((ch) => (
            <button
              key={ch}
              type="button"
              title={`U+${ch.codePointAt(0)?.toString(16).toUpperCase().padStart(4, "0")}`}
              onClick={() => setActiveChar(ch)}
              className={cn(
                "flex h-7 w-full items-center justify-center rounded font-mono text-sm transition-colors",
                ch === activeChar
                  ? "bg-brand text-brand-foreground"
                  : "text-foreground hover:bg-accent"
              )}
            >
              {ch}
            </button>
          ))}
        </div>
      </ScrollArea>

      {/* Keyboard shortcut hint */}
      <p className="px-1 text-[10px] text-muted-foreground leading-tight">
        Or press any key while hovering the canvas to use that character.
      </p>
    </div>
  );
}
