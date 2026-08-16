interface PickerIndicatorProps {
  pickerName: string;
  isMe: boolean;
}

export function PickerIndicator({ pickerName, isMe }: PickerIndicatorProps) {
  return (
    <div
      style={{
        position: "fixed",
        top: "50%",
        right: "16px",
        transform: "translateY(-50%)",
        background: "#D16666",
        color: "#1a0505",
        padding: "12px 16px",
        fontWeight: 700,
        maxWidth: "160px",
        textAlign: "center",
        zIndex: 1000,
      }}
    >
      {isMe ? "Du wählst das Meme!" : `${pickerName} wählt das Meme`}
    </div>
  );
}
