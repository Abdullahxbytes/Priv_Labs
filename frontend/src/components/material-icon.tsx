import type { CSSProperties } from "react";

type MaterialIconProps = {
  name: string;
  size?: number;
  fill?: boolean;
  className?: string;
};

export function MaterialIcon({ name, size = 22, fill = false, className = "" }: MaterialIconProps) {
  const style: CSSProperties = {
    fontSize: `${size}px`,
    fontVariationSettings: `'FILL' ${fill ? 1 : 0}, 'wght' 500, 'GRAD' 0, 'opsz' ${Math.min(48, Math.max(20, size))}`,
  };

  return (
    <span aria-hidden="true" className={`material-symbol ${className}`.trim()} style={style}>
      {name}
    </span>
  );
}
