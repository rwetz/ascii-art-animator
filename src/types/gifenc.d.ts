declare module "gifenc" {
  interface GIFFrameOptions {
    palette?: Uint8Array;
    delay?: number;
    repeat?: number;
    transparent?: number;
    colorDepth?: number;
    dispose?: number;
  }

  interface GIFEncoder {
    writeFrame(
      index: Uint8Array,
      width: number,
      height: number,
      opts?: GIFFrameOptions
    ): void;
    finish(): void;
    bytesView(): Uint8Array<ArrayBuffer>;
    bytes(): Uint8Array<ArrayBuffer>;
  }

  export function GIFEncoder(): GIFEncoder;
  export function quantize(rgba: Uint8Array, maxColors: number, opts?: Record<string, unknown>): Uint8Array;
  export function applyPalette(rgba: Uint8Array, palette: Uint8Array, format?: string): Uint8Array;
}
