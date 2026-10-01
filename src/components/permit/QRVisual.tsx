import { cn } from "@/lib/utils";

/**
 * Deterministic decorative QR-style matrix. Not a real QR code — the demo
 * shows a convincing verification graphic without a scanning library.
 */
function hash(value: string): number {
  let h = 2166136261;
  for (let i = 0; i < value.length; i += 1) {
    h ^= value.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function isFinder(x: number, y: number, size: number): boolean {
  const inBox = (bx: number, by: number) =>
    x >= bx &&
    x < bx + 7 &&
    y >= by &&
    y < by + 7 &&
    (x === bx ||
      x === bx + 6 ||
      y === by ||
      y === by + 6 ||
      (x >= bx + 2 && x <= bx + 4 && y >= by + 2 && y <= by + 4));
  return inBox(0, 0) || inBox(size - 7, 0) || inBox(0, size - 7);
}

export function QRVisual({
  value,
  size = 29,
  className,
}: {
  value: string;
  size?: number;
  className?: string;
}) {
  const seed = hash(value);
  const cells: { x: number; y: number }[] = [];

  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      if (isFinder(x, y, size)) continue;
      const bit = ((seed >>> ((x * 7 + y * 13) % 29)) ^ (x * y + seed)) & 1;
      if (bit) cells.push({ x, y });
    }
  }

  const finders = [
    { x: 0, y: 0 },
    { x: size - 7, y: 0 },
    { x: 0, y: size - 7 },
  ];

  return (
    <svg
      viewBox={`0 0 ${size} ${size}`}
      className={cn("h-32 w-32", className)}
      role="img"
      aria-label={`QR ${value}`}
    >
      <rect width={size} height={size} fill="var(--surface)" />
      {cells.map((cell) => (
        <rect
          key={`${cell.x}-${cell.y}`}
          x={cell.x}
          y={cell.y}
          width={1}
          height={1}
          fill="var(--navy-deep)"
        />
      ))}
      {finders.map((finder) => (
        <g key={`${finder.x}-${finder.y}`}>
          <rect
            x={finder.x}
            y={finder.y}
            width={7}
            height={7}
            fill="none"
            stroke="var(--navy-deep)"
            strokeWidth={1}
          />
          <rect x={finder.x + 2} y={finder.y + 2} width={3} height={3} fill="var(--navy-deep)" />
        </g>
      ))}
    </svg>
  );
}
