import type { RefObject } from "react";

export type CursorOverlayProps = {
  cursorRef: RefObject<HTMLDivElement | null>;
};

export function CursorOverlay({ cursorRef }: CursorOverlayProps) {
  if (!cursorRef)
    return null;

  return (
    <div
      ref={cursorRef}
      className={`
        pointer-events-none absolute top-0 left-0 z-[2000] hidden size-2.5
        -translate-x-1/2 -translate-y-1/2 rounded-full bg-blue-600/90
      `}
    />
  );
}
