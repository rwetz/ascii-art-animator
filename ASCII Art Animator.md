---
created: 2026-06-22
tags:
  - status/raw
  - type/project
  - status/active
---

# ASCII Art Animator

## The Idea
A dedicated desktop app for creating ASCII animations — frame by frame, with a timeline editor, onion skinning (see previous frame ghosted), playback, and export to animated GIF or a self-running terminal binary.

## Why It's Cool
ASCII art animation is a completely underserved creative medium. The constraint (only characters) forces creativity. The output plays anywhere — terminals, web, plain text files. And the "export as a self-running terminal binary" angle is genuinely novel.

## Tech
**Tauri + React** — monospace canvas grid, timeline below. The terminal-binary export is a Rust codegen step: it generates a Rust file that plays the animation and compiles it.

## Shape
- Monospace character grid canvas (click/drag to place chars)
- Character palette + color picker (ANSI colors)
- Timeline: frames as thumbnails, drag to reorder
- Onion skinning toggle (previous frame at 30% opacity)
- Playback: loop, speed control
- Export: animated GIF, raw ANSI escape sequence file, self-running Rust binary

## Next Step
- [ ] Monospace grid canvas in React
- [ ] Frame list + playback loop
- [ ] Onion skin rendering
- [ ] Animated GIF export (use a JS GIF encoder)
