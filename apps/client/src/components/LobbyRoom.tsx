import { useState } from "react";
import type { LobbySettings, Player } from "@meme-tunes/shared";
import { ConfirmDialog } from "./ConfirmDialog";
import { PhotoCollageBackground } from "./PhotoCollageBackground";
import { SettingsPanel } from "./SettingsPanel";
import { PersonalSettingsTab } from "./PersonalSettingsTab";
import { RulesTab } from "./RulesTab";
import { LobbyMembersTab } from "./LobbyMembersTab";
import { BrowserWindow } from "./BrowserWindow";
import { playSfx } from "../sfx";

interface LobbyRoomProps {
  code: string;
  players: Player[];
  myPlayerId: string;
  settings: LobbySettings;
  onStart: () => void;
  onUpdateSettings: (settings: Partial<LobbySettings>) => void;
  error: string | null;
  musicVolume: number;
  onMusicVolumeChange: (v: number) => void;
  hudScale: number;
  onHudScaleChange: (v: number) => void;
}

export function LobbyRoom({
  code,
  players,
  myPlayerId,
  settings,
  onStart,
  onUpdateSettings,
  error,
  musicVolume,
  onMusicVolumeChange,
  hudScale,
  onHudScaleChange,
}: LobbyRoomProps) {
  const isHost = players.find((p) => p.id === myPlayerId)?.isHost ?? false;
  const [showStartConfirm, setShowStartConfirm] = useState(false);

  const handleStart = () => {
    setShowStartConfirm(false);
    playSfx("/start-game.wav", 0.5);
    onStart();
  };

  return (
    <section id="center">
      <PhotoCollageBackground />

      <div className="hud-scale-content">
        <BrowserWindow
          width="min(94vw, 860px)"
          tabs={[
            {
              id: "lobby",
              label: "Lobby",
              content: (
                <LobbyMembersTab
                  code={code}
                  players={players}
                  myPlayerId={myPlayerId}
                  isHost={isHost}
                  onStartClick={() => setShowStartConfirm(true)}
                  error={error}
                />
              ),
            },
            {
              id: "personal",
              label: "Persönliche Einstellungen",
              content: (
                <PersonalSettingsTab
                  musicVolume={musicVolume}
                  onMusicVolumeChange={onMusicVolumeChange}
                  hudScale={hudScale}
                  onHudScaleChange={onHudScaleChange}
                />
              ),
            },
            {
              id: "lobby-settings",
              label: "Lobby-Einstellungen",
              content: <SettingsPanel settings={settings} isHost={isHost} onUpdate={onUpdateSettings} />,
            },
            {
              id: "rules",
              label: "Spielprinzip",
              content: <RulesTab />,
            },
          ]}
        />
      </div>

      {showStartConfirm && (
        <ConfirmDialog
          message="Möchtest du die Runde wirklich starten?"
          onConfirm={handleStart}
          onCancel={() => setShowStartConfirm(false)}
        />
      )}
    </section>
  );
}
