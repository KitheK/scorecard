import { useState, type ReactNode } from "react";

export function InteractivePlate({
  hint,
  defaultPart,
  children,
  renderRail,
  footer,
}: {
  hint?: string;
  defaultPart?: string | null;
  renderRail?: (partId: string | null) => ReactNode;
  footer?: ReactNode;
  children: (args: {
    partId: string | null;
    pick: (id: string) => void;
    selected: (id: string) => boolean;
  }) => ReactNode;
}) {
  const [partId, setPartId] = useState<string | null>(defaultPart ?? null);
  const pick = (next: string) => setPartId((current) => (current === next ? null : next));
  const selected = (next: string) => partId === next;

  return (
    <div className="interactive-plate">
      {children({ partId, pick, selected })}
      {footer}
      {renderRail?.(partId)}
    </div>
  );
}