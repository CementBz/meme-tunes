export function DragonFrameBackground() {
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: -2,
        backgroundColor: "#0a0a0a",
        backgroundImage: "url(/dragon-ui/20240713dragonEmptyFrame.png)",
        backgroundRepeat: "repeat",
        backgroundSize: "64px 64px",
        imageRendering: "pixelated",
      }}
    />
  );
}
