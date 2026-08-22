import { useState } from "react";
import { playSfx } from "../sfx";
import { PhotoCollageBackground } from "./PhotoCollageBackground";

interface HomeScreenProps {
  onCreate: (name: string) => void;
  onJoin: (name: string, code: string) => void;
  error: string | null;
}

export function HomeScreen({ onCreate, onJoin, error }: HomeScreenProps) {
  const [step, setStep] = useState<"name" | "choice">("name");
  const [name, setName] = useState("");
  const [showJoinField, setShowJoinField] = useState(false);
  const [code, setCode] = useState("");

  const canContinue = name.trim().length > 0;

  const handleNameSubmit = () => {
    if (!canContinue) return;
    setStep("choice");
  };

  return (
    <section id="center">
      <PhotoCollageBackground />

      <div className="hud-scale-content">
        {step === "name" ? (
          <>
            <input
              type="text"
              className="no-focus-outline"
              placeholder="Dein Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleNameSubmit()}
              maxLength={24}
              autoFocus
              style={{
                backgroundColor: "transparent",
                backgroundImage: "url(/dragon-ui/20240707dragonHeaderB.png)",
                backgroundSize: "100% 100%",
                backgroundRepeat: "no-repeat",
                imageRendering: "pixelated",
                border: "none",
                borderRadius: 0,
                boxShadow: "none",
                width: "min(85vw, 480px)",
                aspectRatio: "3 / 1",
                textAlign: "center",
                fontSize: "2rem",
                fontWeight: 700,
                color: "#08222a",
              }}
            />
            <button type="button" disabled={!canContinue} onClick={handleNameSubmit} style={{ fontSize: "1.2rem" }}>
              Weiter
            </button>
          </>
        ) : (
          <>
            <h1>Hallo, {name}!</h1>

            <button
              type="button"
              onClick={() => {
                playSfx("/lobby-join.wav");
                onCreate(name.trim());
              }}
              style={{
                backgroundColor: "transparent",
                backgroundImage: "url(/dragon-ui/20240709dragonBarB.png)",
                backgroundSize: "100% 100%",
                backgroundRepeat: "no-repeat",
                imageRendering: "pixelated",
                border: "none",
                borderRadius: 0,
                boxShadow: "none",
                width: "240px",
                height: "44px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                lineHeight: 1,
                fontFamily: "'Press Start 2P', monospace",
                fontSize: "0.6rem",
                fontWeight: 400,
                color: "#ffffff",
                textShadow: "1px 1px 0 #000, -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000",
              }}
            >
              Lobby erstellen
            </button>

            {!showJoinField ? (
              <button
                type="button"
                onClick={() => setShowJoinField(true)}
                style={{
                  backgroundColor: "transparent",
                  backgroundImage: "url(/dragon-ui/20240709dragonBarC.png)",
                  backgroundSize: "100% 100%",
                  backgroundRepeat: "no-repeat",
                  imageRendering: "pixelated",
                  border: "none",
                  borderRadius: 0,
                  boxShadow: "none",
                  width: "240px",
                  height: "44px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  lineHeight: 1,
                  fontFamily: "'Press Start 2P', monospace",
                  fontSize: "0.6rem",
                  fontWeight: 400,
                  color: "#ffffff",
                  textShadow: "1px 1px 0 #000, -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000",
                }}
              >
                Lobby beitreten
              </button>
            ) : (
              <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
                <input
                  type="text"
                  className="flat-input"
                  placeholder="Lobby-Code"
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  maxLength={5}
                  autoFocus
                  onKeyDown={(e) => e.key === "Enter" && code.trim() && onJoin(name.trim(), code.trim())}
                />
                <button
                  type="button"
                  disabled={code.trim().length === 0}
                  onClick={() => {
                    playSfx("/lobby-join.wav");
                    onJoin(name.trim(), code.trim());
                  }}
                >
                  Beitreten
                </button>
              </div>
            )}

            {error && <p style={{ color: "crimson" }}>{error}</p>}

            <button
              type="button"
              onClick={() => setStep("name")}
              style={{ background: "none", boxShadow: "none", fontSize: "0.8rem", color: "rgba(255,255,255,0.6)" }}
            >
              ← Name ändern
            </button>
          </>
        )}
      </div>
    </section>
  );
}
