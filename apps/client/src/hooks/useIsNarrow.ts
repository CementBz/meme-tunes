import { useEffect, useState } from "react";

const NARROW_BREAKPOINT = 700;

export function useIsNarrow(): boolean {
  const [isNarrow, setIsNarrow] = useState(() => window.innerWidth < NARROW_BREAKPOINT);

  useEffect(() => {
    const onResize = () => setIsNarrow(window.innerWidth < NARROW_BREAKPOINT);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  return isNarrow;
}
