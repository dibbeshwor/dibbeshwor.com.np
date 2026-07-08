import { useEffect, useReducer, useRef } from "react";

type Mode = "NORMAL" | "INSERT" | "COMMAND";

interface S {
  lines: string[];
  row: number;
  col: number;
  mode: Mode;
  cmd: string;
  visitorName: string | null;
  saved: boolean;
  pendingG: boolean;
  pendingD: boolean;
  lastMsg: string;
}

const WELCOME = [
  '" ~/guestbook.md ────────────────────────────────',
  '"',
  '" hi! this is a little vim I built so you can',
  '" leave a note. a few things that work:',
  '"',
  '"   i        → enter insert mode, type anything',
  '"   Esc      → back to normal mode',
  '"   :name X  → introduce yourself as X',
  '"   :w       → "save" (you\'ll see a greeting)',
  '"   :q       → clear and start over',
  '"   :help    → this message',
  '"',
  '" go ahead — press  i  and say hi.',
  "",
  "",
];

const INIT: S = {
  lines: WELCOME.slice(),
  row: WELCOME.length - 1,
  col: 0,
  mode: "NORMAL",
  cmd: "",
  visitorName: null,
  saved: false,
  pendingG: false,
  pendingD: false,
  lastMsg: "",
};

function esc(s: string) {
  return s.replace(
    /[&<>]/g,
    (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" })[c] ?? c,
  );
}

function synHtml(line: string): string {
  if (/^\s*"/.test(line)) return `<span class="comment">${esc(line)}</span>`;
  if (/^---+$/.test(line)) return `<span class="tilde">${esc(line)}</span>`;
  return esc(line);
}

function execCmd(s: S, raw: string): S {
  const cmd = raw.trim();
  s = { ...s, lastMsg: "" };
  if (!cmd) return s;

  if (cmd === "w" || cmd === "write") {
    const who = s.visitorName ?? "stranger";
    return {
      ...s,
      saved: true,
      lastMsg: `<span class="ok">✓ saved. thanks for stopping by, ${esc(who)}.</span>`,
    };
  }
  if (cmd === "q" || cmd === "quit") {
    return {
      ...s,
      lines: WELCOME.slice(),
      row: WELCOME.length - 1,
      col: 0,
      saved: false,
      lastMsg: `<span class="ok">buffer cleared. fresh page. ✿</span>`,
    };
  }
  if (cmd === "wq" || cmd === "x") {
    const who = s.visitorName ?? "stranger";
    return {
      ...s,
      saved: true,
      lastMsg: `<span class="ok">✓ saved &amp; closed. take care, ${esc(who)}.</span>`,
    };
  }
  if (cmd === "help" || cmd === "h") {
    return {
      ...s,
      lastMsg: `<span class="comment">i=insert · Esc=normal · :name X · :w · :q · :about · :contact</span>`,
    };
  }
  if (cmd === "about") {
    const lines = [
      '" about dibbeshwor',
      "",
      "full-stack & AI engineer based in nepal.",
      "building AI infra for content @ mediastack ai.",
      "previously at kantipur media and uptrendly.",
      "typescript, react, hono, postgres, ffmpeg, a lot of LLMs.",
      "",
      "I like quiet tools that do loud work.",
      "",
    ];
    return { ...s, lines, row: lines.length - 1, col: 0, saved: false };
  }
  if (cmd === "contact") {
    const lines = [
      '" get in touch',
      "",
      "email     hi@dibbeshwor.com.np",
      "phone     +977 9709061216",
      "linkedin  linkedin.com/in/dbeee",
      "",
    ];
    return { ...s, lines, row: lines.length - 1, col: 0, saved: false };
  }
  const m = cmd.match(/^name\s+(.+)$/i);
  if (m) {
    const name = m[1].trim().slice(0, 40);
    return {
      ...s,
      visitorName: name,
      lastMsg: `<span class="ok">nice to meet you, ${esc(name)}. press  i  and tell me what's on your mind.</span>`,
    };
  }
  return {
    ...s,
    lastMsg: `<span class="err">E492: not a vim command: ${esc(cmd)}</span>`,
  };
}

function reduce(s: S, key: string): S {
  s = { ...s };
  if (s.mode !== "COMMAND" && s.lastMsg && key !== "Shift") s.lastMsg = "";

  if (s.mode === "COMMAND") {
    if (key === "Escape") {
      s.mode = "NORMAL";
      s.cmd = "";
    } else if (key === "Enter") {
      const c = s.cmd;
      s.cmd = "";
      s.mode = "NORMAL";
      s = execCmd(s, c);
    } else if (key === "Backspace") {
      if (s.cmd.length === 0) s.mode = "NORMAL";
      else s.cmd = s.cmd.slice(0, -1);
    } else if (key.length === 1) s.cmd += key;
    return s;
  }

  if (s.mode === "INSERT") {
    if (key === "Escape") {
      s.mode = "NORMAL";
      s.col = Math.max(0, s.col - 1);
    } else if (key === "Backspace") {
      const ln = s.lines[s.row];
      if (s.col > 0) {
        s.lines = [...s.lines];
        s.lines[s.row] = ln.slice(0, s.col - 1) + ln.slice(s.col);
        s.col--;
      } else if (s.row > 0) {
        const prev = s.lines[s.row - 1];
        s.lines = [...s.lines];
        s.lines[s.row - 1] = prev + ln;
        s.lines.splice(s.row, 1);
        s.col = prev.length;
        s.row--;
      }
      s.saved = false;
    } else if (key === "Enter") {
      const ln = s.lines[s.row];
      s.lines = [...s.lines];
      s.lines[s.row] = ln.slice(0, s.col);
      s.lines.splice(s.row + 1, 0, ln.slice(s.col));
      s.row++;
      s.col = 0;
      s.saved = false;
    } else if (key === "Tab") {
      const ln = s.lines[s.row];
      s.lines = [...s.lines];
      s.lines[s.row] = ln.slice(0, s.col) + "  " + ln.slice(s.col);
      s.col += 2;
      s.saved = false;
    } else if (key === "ArrowLeft") {
      s.col = Math.max(0, s.col - 1);
    } else if (key === "ArrowRight") {
      s.col = Math.min(s.lines[s.row].length, s.col + 1);
    } else if (key === "ArrowUp") {
      if (s.row > 0) {
        s.row--;
        s.col = Math.min(s.col, s.lines[s.row].length);
      }
    } else if (key === "ArrowDown") {
      if (s.row < s.lines.length - 1) {
        s.row++;
        s.col = Math.min(s.col, s.lines[s.row].length);
      }
    } else if (key.length === 1) {
      const ln = s.lines[s.row];
      s.lines = [...s.lines];
      s.lines[s.row] = ln.slice(0, s.col) + key + ln.slice(s.col);
      s.col++;
      s.saved = false;
    }
    return s;
  }

  // NORMAL mode
  const ln = () => s.lines[s.row] ?? "";
  switch (key) {
    case "i":
      s.mode = "INSERT";
      break;
    case "I":
      s.mode = "INSERT";
      s.col = ln().search(/\S|$/);
      break;
    case "a":
      s.mode = "INSERT";
      s.col = Math.min(ln().length, s.col + 1);
      break;
    case "A":
      s.mode = "INSERT";
      s.col = ln().length;
      break;
    case "o":
      s.lines = [...s.lines];
      s.lines.splice(s.row + 1, 0, "");
      s.row++;
      s.col = 0;
      s.mode = "INSERT";
      s.saved = false;
      break;
    case "O":
      s.lines = [...s.lines];
      s.lines.splice(s.row, 0, "");
      s.col = 0;
      s.mode = "INSERT";
      s.saved = false;
      break;
    case "h":
    case "ArrowLeft":
      s.col = Math.max(0, s.col - 1);
      break;
    case "l":
    case "ArrowRight":
      s.col = Math.min(ln().length, s.col + 1);
      break;
    case "k":
    case "ArrowUp":
      if (s.row > 0) {
        s.row--;
        s.col = Math.min(s.col, ln().length);
      }
      break;
    case "j":
    case "ArrowDown":
      if (s.row < s.lines.length - 1) {
        s.row++;
        s.col = Math.min(s.col, ln().length);
      }
      break;
    case "0":
    case "Home":
      s.col = 0;
      break;
    case "$":
    case "End":
      s.col = ln().length;
      break;
    case "g":
      if (s.pendingG) {
        s.row = 0;
        s.col = 0;
        s.pendingG = false;
      } else s.pendingG = true;
      break;
    case "G":
      s.row = s.lines.length - 1;
      s.col = 0;
      break;
    case "x": {
      const l = ln();
      if (l.length > 0) {
        s.lines = [...s.lines];
        s.lines[s.row] = l.slice(0, s.col) + l.slice(s.col + 1);
        s.col = Math.min(s.col, s.lines[s.row].length);
        s.saved = false;
      }
      break;
    }
    case "d":
      if (s.pendingD) {
        s.lines = [...s.lines];
        s.lines.splice(s.row, 1);
        if (s.lines.length === 0) s.lines = [""];
        s.row = Math.min(s.row, s.lines.length - 1);
        s.col = 0;
        s.saved = false;
        s.pendingD = false;
      } else s.pendingD = true;
      break;
    case ":":
      s.mode = "COMMAND";
      s.cmd = "";
      break;
    case "Escape":
      s.pendingG = false;
      s.pendingD = false;
      break;
  }
  if (key !== "g") s.pendingG = false;
  if (key !== "d") s.pendingD = false;

  return s;
}

// keys handled via keydown; anything else (mobile virtual keyboards often
// report "Unidentified") falls through to the hidden textarea's input events
const NAMED_KEYS = new Set([
  "Escape",
  "Enter",
  "Backspace",
  "Tab",
  "ArrowLeft",
  "ArrowRight",
  "ArrowUp",
  "ArrowDown",
  "Home",
  "End",
]);

// zero-width space kept in the hidden textarea so backspace on virtual
// keyboards always has something to delete (and thus fires an input event)
const SENTINEL = "\u200b";

export function NeovimEditor() {
  const [s, dispatch] = useReducer(reduce, INIT);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const bufRef = useRef<HTMLDivElement>(null);

  // scroll current line into view after every state change
  useEffect(() => {
    const buf = bufRef.current;
    if (!buf) return;
    const cur = buf.querySelector<HTMLElement>(".line.cur");
    if (!cur) return;
    const top = cur.offsetTop;
    const view = buf.clientHeight;
    if (top < buf.scrollTop) buf.scrollTop = top - 8;
    else if (top + cur.offsetHeight > buf.scrollTop + view)
      buf.scrollTop = top + cur.offsetHeight - view + 8;
  });

  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    // in NORMAL mode let Tab move focus so keyboard users aren't trapped
    if (e.key === "Tab" && s.mode === "NORMAL") return;
    if (e.key.length === 1 || NAMED_KEYS.has(e.key)) {
      e.preventDefault();
      dispatch(e.key);
    }
  };

  // mobile virtual keyboards don't produce reliable keydown events — read
  // whatever landed in the hidden textarea, dispatch it, and reset
  const flushInput = () => {
    const el = inputRef.current;
    if (!el) return;
    const v = el.value;
    el.value = SENTINEL;
    el.setSelectionRange(SENTINEL.length, SENTINEL.length);
    if (!v.startsWith(SENTINEL)) dispatch("Backspace");
    const typed = v.startsWith(SENTINEL) ? v.slice(SENTINEL.length) : v;
    for (const ch of typed) dispatch(ch === "\n" ? "Enter" : ch);
  };

  const onInput = (e: React.FormEvent<HTMLTextAreaElement>) => {
    if ((e.nativeEvent as InputEvent).isComposing) return;
    flushInput();
  };

  const focusInput = () => inputRef.current?.focus();

  const touchKey = (key: string) => (
    <button
      type="button"
      className="tkey"
      // keep the hidden textarea focused (and the keyboard up) while tapping
      onPointerDown={(e) => e.preventDefault()}
      onClick={() => {
        dispatch(key === "esc" ? "Escape" : key);
        focusInput();
      }}
    >
      {key}
    </button>
  );

  // gutter
  const total = Math.max(s.lines.length, 18);
  const gutterItems = Array.from({ length: total }, (_, i) => {
    if (i < s.lines.length) {
      const shown = i === s.row ? i + 1 : Math.abs(i - s.row);
      return (
        <span key={i} className={`lnum${i === s.row ? " cur" : ""}`}>
          {shown}
        </span>
      );
    }
    return (
      <span key={i} className="lnum tilde">
        ~
      </span>
    );
  });

  // buffer lines
  const bufLines = s.lines.map((ln, i) => {
    if (i !== s.row) {
      return (
        <div
          key={i}
          className="line"
          dangerouslySetInnerHTML={{ __html: synHtml(ln) || "&nbsp;" }}
        />
      );
    }
    const c = Math.min(s.col, ln.length);
    if (s.mode === "INSERT") {
      return (
        <div key={i} className="line cur">
          {ln.slice(0, c)}
          <span className="caret insert" />
          {ln.slice(c)}
        </div>
      );
    }
    return (
      <div key={i} className="line cur">
        {ln.slice(0, c)}
        <span className="caret" style={{ width: Math.max(8, 0.6 * 14) }}>
          &nbsp;
        </span>
        {ln.slice(c + 1)}
      </div>
    );
  });

  const tildes = Array.from(
    { length: Math.max(0, 14 - s.lines.length) },
    (_, i) => (
      <div key={`~${i}`} className="line">
        <span className="tilde">~</span>
      </div>
    ),
  );

  const modeStyle =
    s.mode === "INSERT"
      ? { background: "rgba(154,184,154,0.25)" }
      : s.mode === "COMMAND"
        ? { background: "rgba(184,196,216,0.2)" }
        : { background: "rgba(0,0,0,0.18)" };

  const cmdHtml =
    s.mode === "COMMAND"
      ? `<span class="prompt">:</span>${esc(s.cmd)}<span class="caret insert"></span>`
      : s.lastMsg
        ? s.lastMsg
        : "&nbsp;";

  return (
    <section className="term-section" id="terminal">
      <div className="term-label">leave a note ↓</div>
      <div className="term" onClick={focusInput}>
        <textarea
          ref={inputRef}
          className="term-input"
          defaultValue={SENTINEL}
          onKeyDown={onKeyDown}
          onInput={onInput}
          onCompositionEnd={flushInput}
          autoCapitalize="off"
          autoCorrect="off"
          autoComplete="off"
          spellCheck={false}
          aria-label="Neovim-style guestbook editor"
        />
        <div className="term-chrome">
          <div className="dots">
            <span className="dot" />
            <span className="dot" />
            <span className="dot" />
          </div>
          <div className="title">~/guestbook — nvim</div>
        </div>
        <div className="term-body">
          <div className="term-gutter">{gutterItems}</div>
          <div className="term-buf" ref={bufRef}>
            {bufLines}
            {tildes}
          </div>
        </div>
        <div
          className="term-cmd"
          dangerouslySetInnerHTML={{ __html: cmdHtml }}
        />
        <div className="term-status">
          <span className="mode" style={modeStyle}>
            {s.mode}
          </span>
          <span className="file">guestbook.md{s.saved ? "" : " [+]"}</span>
          <span className="right">
            utf-8 · {s.row + 1}:{s.col + 1}
          </span>
        </div>
        <div className="term-touchbar" aria-label="editor keys for touch screens">
          {touchKey("esc")}
          {touchKey("i")}
          {touchKey(":")}
          <span className="tkey-hint">no keyboard? tap these</span>
        </div>
      </div>
    </section>
  );
}
