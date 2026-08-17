import { useState } from "react";
import { playSfx } from "../sfx";
import { PhotoCollageBackground } from "./PhotoCollageBackground";

interface HomeScreenProps {
  onCreate: (name: string) => void;
  onJoin: (name: string, code: string) => void;
  error: string | null;
}

export function HomeScreen({ onCreate, onJoin, error }: HomeScreenProps) {
  const [name, setName] = useState("");
  const [code, setCode] = useState("");

  const canSubmit = name.trim().length > 0;

  return (
    <section id="center">
      <PhotoCollageBackground />

      <div className="hud-scale-content">
        <input
          type="text"
          className="flat-input"
          placeholder="Dein Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={24}
        />

        <div style={{ display: "flex", gap: "0.5rem" }}>
          <button
            type="button"
            disabled={!canSubmit}
            onClick={() => {
              playSfx("/lobby-join.wav");
              onCreate(name.trim());
            }}
          >
            Lobby erstellen
          </button>
        </div>

        <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
          <input
            type="text"
            className="flat-input"
            placeholder="Lobby-Code"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            maxLength={5}
          />
          <button
            type="button"
            disabled={!canSubmit || code.trim().length === 0}
            onClick={() => {
              playSfx("/lobby-join.wav");
              onJoin(name.trim(), code.trim());
            }}
          >
            Beitreten
          </button>
        </div>

        {error && <p style={{ color: "crimson" }}>{error}</p>}
      </div>
    </section>
  );
}
