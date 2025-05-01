import { useState, useEffect } from "react";

type KeyboardGeometry = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export function useVirtualKeyboard() {
  const [keyboard, setKeyboard] = useState<KeyboardGeometry>({
    x: 0,
    y: 0,
    width: 0,
    height: 0,
  });

  useEffect(() => {
    if (!("virtualKeyboard" in navigator)) return;

    const handleGeometryChange = (e: any) => {
      const { x, y, width, height } = e.target.boundingRect;
      setKeyboard({
        x: Math.abs(x),
        y: Math.abs(y),
        width: Math.abs(width),
        height: Math.abs(height),
      });
      console.log(keyboard);
    };

    (navigator as any).virtualKeyboard.addEventListener("geometrychange", handleGeometryChange);

    
  }, []);

  return keyboard;
}
