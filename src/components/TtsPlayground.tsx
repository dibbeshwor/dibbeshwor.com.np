import { useEffect, useReducer } from "react";
import "./TtsPlayground.css";

type Parcel = { id: number; progress: number };
type Game = { online: boolean; parcels: Parcel[]; sent: number; delivered: number; broken: boolean };
type Action = { type: "tick" | "send" | "power" | "reset" };
const INITIAL: Game = { online: true, parcels: [], sent: 0, delivered: 0, broken: false };
const GOAL = 5;

function moveParcels(parcels: Parcel[], online: boolean): Parcel[] {
  // Each waiting parcel gets its own parking spot before the worker.
  let waiting = 0;
  return parcels.map(parcel => {
    if (parcel.progress > 55) return { ...parcel, progress: parcel.progress + 1 };
    if (online) return { ...parcel, progress: parcel.progress + 1 };
    const stop = 43 - waiting++ * 7;
    return { ...parcel, progress: Math.min(parcel.progress + 1, Math.max(parcel.progress, stop)) };
  });
}

function reducer(game: Game, action: Action): Game {
  switch (action.type) {
    case "reset": return INITIAL;
    case "power": return { ...game, online: !game.online, broken: true };
    case "send":
      if (game.sent === GOAL) return game;
      return { ...game, sent: game.sent + 1, parcels: [...game.parcels, { id: game.sent + 1, progress: 0 }] };
    case "tick": {
      const moved = moveParcels(game.parcels, game.online);
      const arrived = moved.filter(parcel => parcel.progress >= 100);
      return { ...game, parcels: moved.filter(parcel => parcel.progress < 100), delivered: game.delivered + arrived.length };
    }
  }
}

function caption(game: Game): string {
  if (game.delivered === GOAL) return "All five delivered. No jobs lost.";
  if (!game.online) return "Worker offline. Jobs are queued until power returns.";
  if (game.broken) return "Worker online. Queued jobs resume automatically.";
  if (game.sent > 0) return "Messages are moving. Cut the power to see what happens.";
  return "Send 5 messages. Cut the power at any point.";
}

export function TtsPlayground() {
  const [game, dispatch] = useReducer(reducer, INITIAL);
  const active = game.parcels.length > 0;
  const won = game.delivered === GOAL;
  useEffect(() => {
    if (!active) return;
    const timer = window.setInterval(() => dispatch({ type: "tick" }), 65);
    return () => window.clearInterval(timer);
  }, [active]);

  return (
    <section className={`tts-game ${game.online ? "" : "is-offline"} ${won ? "is-won" : ""}`} aria-labelledby="tts-title">
      <div className="tts-heading">
        <span className="tts-eyebrow">tiny speech factory</span>
        <span className="tts-score" aria-label={`${game.delivered} of ${GOAL} messages delivered`}>{game.delivered} / {GOAL} delivered</span>
      </div>
      <h2 id="tts-title">What happens when a worker goes offline?</h2>
      <p className="tts-invitation">Send a message. Cut the power. Bring it back.</p>

      <div className="tts-world" aria-hidden="true">
        <div className="tts-cloud cloud-one">☁</div><div className="tts-cloud cloud-two">☁</div>
        <div className="tts-station tts-input"><span>✉</span><small>messages in</small></div>
        <div className="tts-robot"><span className="tts-antenna" /><div className="tts-face">{game.online ? "•ᴗ•" : "–︵–"}</div><small>{game.online ? "worker online" : "worker offline"}</small></div>
        <div className={`tts-station tts-output ${game.delivered ? "has-audio" : ""}`} key={game.delivered}><span>♫</span><small>voices out</small></div>
        <div className="tts-belt"><div className="tts-belt-tread" /></div>
        {game.parcels.map(parcel => <span key={parcel.id} className={`tts-parcel ${parcel.progress > 55 ? "is-audio" : ""}`} style={{ left: `${5 + parcel.progress * 0.9}%` }}>{parcel.progress > 55 ? "♪" : "✉"}</span>)}
        <div className="tts-ground" />
        {won && <div className="tts-victory"><span>✦</span> delivery complete! <span>✦</span></div>}
      </div>

      <div className="tts-controls">
        <button type="button" className="tts-send" disabled={game.sent === GOAL} onClick={() => dispatch({ type: "send" })}>{game.sent === GOAL ? "All messages sent ✓" : "Send a message ↗"}</button>
        <button type="button" className="tts-power" aria-pressed={!game.online} disabled={won} onClick={() => dispatch({ type: "power" })}>{game.online ? "↯ Cut power" : "⚡ Restore power"}</button>
        <button type="button" className="tts-reset" onClick={() => dispatch({ type: "reset" })}>↻ Restart</button>
      </div>
      <p className="tts-caption" role="status">{caption(game)}</p>
      <p className="tts-footnote">A simplified version of my TTS gateway: when a speech worker goes offline, queued jobs wait rather than disappear. Simulation only — no real audio or API calls.</p>
    </section>
  );
}
