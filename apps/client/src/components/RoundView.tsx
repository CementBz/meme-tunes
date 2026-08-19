import { useEffect, useState } from "react";
import type { LobbySettings, Player } from "@meme-tunes/shared";
import { EXTRA_TIME_TRIGGER_THRESHOLD_SECONDS } from "@meme-tunes/shared";
import type { SongSubmission } from "../types";
import { MemeMedia } from "./MemeMedia";
import { MemeTextOverlay } from "./MemeTextOverlay";
import { BrowserWindow } from "./BrowserWindow";
import { BrandedTab } from "./BrandedTab";
import { PersonalSettingsTab } from "./PersonalSettingsTab";
import { SettingsPanel } from "./SettingsPanel";
import { PlayersTab } from "./PlayersTab";
import { YoutubeTab } from "./YoutubeTab";
import { PreviewTab } from "./PreviewTab";
import { OwnFilePicker } from "./OwnFilePicker";
import { socket } from "../socket";
import { ExtraTimeBanner } from "./ExtraTimeBanner";

interface ExtraTimeState {
  voteDeadlineTs: number;
  yesVotes: number;
  eligibleVoters: number;
}

interface RoundViewProps {
  roundNumber: number;
  totalRounds: number;
  memeUrl: string;
  submitDeadlineTs: number;
  submissionsClosed: boolean;
  hasSubmitted: boolean;
  paused: boolean;
  textOnMemeAllowed: boolean;
  onSubmit: (data: SongSubmission) => void;
  extraTimeState: ExtraTimeState | null;
  extraTimeResult: boolean | null;
  hasRequestedExtraTime: boolean;
  hasVotedExtraTime: boolean;
  onRequestExtraTime: () => void;
  onVoteExtraTime: () => void;
  players: Player[];
  submittedPlayerIds: Set<string>;
  isHost: boolean;
  settings: LobbySettings;
  onUpdateSettings: (settings: Partial<LobbySettings>) => void;
  musicVolume: number;
  onMusicVolumeChange: (v: number) => void;
  hudScale: number;
  onHudScaleChange: (v: number) => void;
  previewVolume: number;
  onPreviewVolumeChange: (v: number) => void;
}

export function RoundView({
  roundNumber,
  totalRounds,
  memeUrl,
  submitDeadlineTs,
  submissionsClosed,
  hasSubmitted,
  paused,
  textOnMemeAllowed,
  onSubmit,
  extraTimeState,
  extraTimeResult,
  hasRequestedExtraTime,
  hasVotedExtraTime,
  onRequestExtraTime,
  onVoteExtraTime,
  players,
  submittedPlayerIds,
  isHost,
  settings,
  onUpdateSettings,
  musicVolume,
  onMusicVolumeChange,
  hudScale,
  onHudScaleChange,
  previewVolume,
  onPreviewVolumeChange,
}: RoundViewProps) {
  const [remainingSeconds, setRemainingSeconds] = useState(() =>
    Math.max(0, Math.round((submitDeadlineTs - Date.now()) / 1000))
  );
  const [memeText, setMemeText] = useState("");
  const [textPosition, setTextPosition] = useState<"top" | "bottom">("bottom");

  useEffect(() => {
    setMemeText("");
    setTextPosition("bottom");
  }, [roundNumber, memeUrl]);

  useEffect(() => {
    if (paused) return;
    const interval = setInterval(() => {
      setRemainingSeconds(Math.max(0, Math.round((submitDeadlineTs - Date.now()) / 1000)));
    }, 250);
    return () => clearInterval(interval);
  }, [submitDeadlineTs, paused]);

  const canRequestExtraTime =
    !hasSubmitted &&
    !hasRequestedExtraTime &&
    !submissionsClosed &&
    remainingSeconds > 0 &&
    remainingSeconds <= EXTRA_TIME_TRIGGER_THRESHOLD_SECONDS;

  const handleSubmitWithMeme = (data: SongSubmission) => {
    const trimmed = memeText.trim();
    onSubmit({ ...data, memeText: trimmed || null, memeTextPosition: trimmed ? textPosition : null });
  };

  return (
    <section id="center">
      <div
        style={{
          position: "fixed",
          inset: 0,
          backgroundImage: "url(/bg-round.png)",
          backgroundSize: "cover",
          backgroundPosition: "center",
          zIndex: -2,
        }}
      />
      <div className="hud-scale-content">
        <h1>
          Runde {roundNumber} / {totalRounds}
        </h1>

        <div style={{ position: "relative", display: "inline-block" }}>
          <MemeMedia url={memeUrl} alt="Meme der Runde" style={{ maxWidth: "50vw", maxHeight: "38vh", display: "block" }} />
          {textOnMemeAllowed && !hasSubmitted && !submissionsClosed && (
            <MemeTextOverlay text={memeText} onTextChange={setMemeText} position={textPosition} onPositionChange={setTextPosition} />
          )}
        </div>

        {!submissionsClosed && <p>Verbleibende Zeit: {remainingSeconds}s</p>}
        {paused && <p>⏸ Pausiert</p>}

        {canRequestExtraTime && (
          <button type="button" onClick={onRequestExtraTime} className="pill-badge" style={{ background: "rgba(209, 102, 102, 0.85)", color: "#2b0a0a" }}>
            ⏱️ +20 Sekunden anfordern
          </button>
        )}

        {extraTimeResult !== null && (
          <p style={{ fontSize: "0.9rem" }}>
            {extraTimeResult ? "✅ Mehrheit dafür — 20 Sekunden extra!" : "❌ Keine Mehrheit — keine Extra-Zeit."}
          </p>
        )}

        {submissionsClosed ? (
          <p>Einreichungen geschlossen – Wiedergabe folgt.</p>
        ) : hasSubmitted ? (
          <p>Song eingereicht ✅ Warte auf die anderen Spieler…</p>
        ) : (
          <div style={{ display: "flex", justifyContent: "center" }}>
            <BrowserWindow
              width="min(94vw, 760px)"
              tabs={[
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
                  id: "players",
                  label: "Spieler",
                  content: <PlayersTab players={players} submittedPlayerIds={submittedPlayerIds} />,
                },
                {
                  id: "youtube",
                  label: "YouTube",
                  accentColor: "#ff0000",
                  content: (
                    <BrandedTab brand="youtube">
                      <YoutubeTab previewVolume={previewVolume} onPreviewVolumeChange={onPreviewVolumeChange} onSubmit={handleSubmitWithMeme} />
                    </BrandedTab>
                  ),
                },
                {
                  id: "itunes",
                  label: "iTunes",
                  accentColor: "#fa233b",
                  content: (
                    <BrandedTab brand="itunes">
                      <PreviewTab
                        source="itunes"
                        hint="Kostenlose Vorschau von Apple — jeder Treffer ist ein ca. 30-Sekunden-Ausschnitt, kein ganzer Song. Die Rundenzeit läuft beim Suchen weiter, also nicht endlos durchskippen."
                        search={(q, ack) => socket.emit("search-itunes", q, ack)}
                        previewVolume={previewVolume}
                        onPreviewVolumeChange={onPreviewVolumeChange}
                        onSubmit={handleSubmitWithMeme}
                      />
                    </BrandedTab>
                  ),
                },
                {
                  id: "deezer",
                  label: "Deezer",
                  accentColor: "#a238ff",
                  content: (
                    <BrandedTab brand="deezer">
                      <PreviewTab
                        source="deezer"
                        hint="Kostenlose Vorschau von Deezer — jeder Treffer ist ein ca. 30-Sekunden-Ausschnitt, kein ganzer Song. Die Rundenzeit läuft beim Suchen weiter, also nicht endlos durchskippen."
                        search={(q, ack) => socket.emit("search-deezer", q, ack)}
                        previewVolume={previewVolume}
                        onPreviewVolumeChange={onPreviewVolumeChange}
                        onSubmit={handleSubmitWithMeme}
                      />
                    </BrandedTab>
                  ),
                },
                {
                  id: "own-files",
                  label: "Eigene Dateien",
                  content: <OwnFilePicker onSubmit={handleSubmitWithMeme} />,
                },
              ]}
            />
          </div>
        )}
      </div>

      {extraTimeState && (
        <ExtraTimeBanner
          voteDeadlineTs={extraTimeState.voteDeadlineTs}
          yesVotes={extraTimeState.yesVotes}
          eligibleVoters={extraTimeState.eligibleVoters}
          canVote={hasSubmitted}
          hasVoted={hasVotedExtraTime}
          onVote={onVoteExtraTime}
        />
      )}
    </section>
  );
}
