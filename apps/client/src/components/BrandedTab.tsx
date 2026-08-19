import type { ReactNode } from "react";

const BRANDS = {
  youtube: { background: "#ffffff", color: "#0f0f0f" },
  itunes: { background: "linear-gradient(135deg, #fa233b, #fb5c74 60%, #ff9a9e)", color: "#ffffff" },
  deezer: { background: "linear-gradient(135deg, #191414, #a238ff 70%, #ff0092)", color: "#ffffff" },
} as const;

interface BrandedTabProps {
  brand: keyof typeof BRANDS;
  children: ReactNode;
}

export function BrandedTab({ brand, children }: BrandedTabProps) {
  const theme = BRANDS[brand];
  return (
    <div style={{ margin: "-20px", padding: "20px", minHeight: "260px", background: theme.background, color: theme.color }}>
      {children}
    </div>
  );
}
