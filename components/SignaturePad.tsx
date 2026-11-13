"use client";

import { useRef, useState } from "react";

/** Finger signature. Calls onChange with a PNG data URL, or null when cleared. */
export default function SignaturePad({ onChange }: { onChange: (dataUrl: string | null) => void }) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);
  const [signed, setSigned] = useState(false);

  function point(e: React.PointerEvent<HTMLCanvasElement>) {
    const c = canvas.current!;
    const r = c.getBoundingClientRect();
    return { x: ((e.clientX - r.left) / r.width) * c.width, y: ((e.clientY - r.top) / r.height) * c.height };
  }

  function start(e: React.PointerEvent<HTMLCanvasElement>) {
    const ctx = canvas.current!.getContext("2d")!;
    ctx.lineWidth = 4;
    ctx.lineCap = "round";
    ctx.strokeStyle = "#141414";
    const p = point(e);
    ctx.beginPath();
    ctx.moveTo(p.x, p.y);
    drawing.current = true;
    canvas.current!.setPointerCapture(e.pointerId);
  }

  function move(e: React.PointerEvent<HTMLCanvasElement>) {
    if (!drawing.current) return;
    const ctx = canvas.current!.getContext("2d")!;
    const p = point(e);
    ctx.lineTo(p.x, p.y);
    ctx.stroke();
  }

  function end() {
    if (!drawing.current) return;
    drawing.current = false;
    setSigned(true);
    onChange(canvas.current!.toDataURL("image/png"));
  }

  function clear() {
    const c = canvas.current!;
    c.getContext("2d")!.clearRect(0, 0, c.width, c.height);
    setSigned(false);
    onChange(null);
  }

  return (
    <div>
      <canvas
        ref={canvas}
        width={600}
        height={220}
        aria-label="Signature pad: sign with your finger"
        className="h-40 w-full touch-none rounded-2xl bg-bone"
        onPointerDown={start}
        onPointerMove={move}
        onPointerUp={end}
        onPointerLeave={end}
      />
      <div className="mt-2 flex items-center justify-between text-sm text-smoke">
        <span>{signed ? "Signed" : "Sign with your finger"}</span>
        {signed && (
          <button type="button" onClick={clear} className="underline-offset-4 hover:text-bone hover:underline">
            Clear
          </button>
        )}
      </div>
    </div>
  );
}
