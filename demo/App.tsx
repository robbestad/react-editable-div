import { useRef, useState } from "react";
import { Editable } from "react-editable-div";

const SEED =
  'A caret-safe <b>contenteditable</b> for React 18/19. Type here — parent state updates on every keystroke, and the caret <i>stays put</i>.';

const RESET =
  'Reset from the parent. If the caret jumped, the old <code>shouldComponentUpdate</code> trick would have dropped this update.';

export default function App() {
  const [html, setHtml] = useState(SEED);
  const [editable, setEditable] = useState(true);
  const [plaintextOnly, setPlaintextOnly] = useState(false);
  const [pasteAsPlainText, setPasteAsPlainText] = useState(false);
  const [tagName, setTagName] = useState<"div" | "article" | "h1">("div");
  const ref = useRef<HTMLElement>(null);

  return (
    <div className="page">
      <header className="hero">
        <p className="eyebrow">react-editable-div 1.0</p>
        <h1>An editable div that does not fight React.</h1>
        <p className="lede">
          Tiny, typed, zero-dependency <code>contenteditable</code>. Caret-safe
          under controlled state, IME-aware, and small enough to read in a
          coffee break.
        </p>
        <ul className="facts">
          <li>Zero runtime deps</li>
          <li>React 18 + 19</li>
          <li>TypeScript</li>
          <li>Next.js App Router</li>
        </ul>
      </header>

      <section className="stage">
        <div className="toolbar">
          <label>
            <input
              type="checkbox"
              checked={editable}
              onChange={(event) => setEditable(event.target.checked)}
            />
            Editable
          </label>
          <label>
            <input
              type="checkbox"
              checked={plaintextOnly}
              onChange={(event) => setPlaintextOnly(event.target.checked)}
            />
            Plain text
          </label>
          <label>
            <input
              type="checkbox"
              checked={pasteAsPlainText}
              onChange={(event) => setPasteAsPlainText(event.target.checked)}
            />
            Paste as text
          </label>
          <label className="select">
            Tag
            <select
              value={tagName}
              onChange={(event) =>
                setTagName(event.target.value as typeof tagName)
              }
            >
              <option value="div">div</option>
              <option value="article">article</option>
              <option value="h1">h1</option>
            </select>
          </label>
          <button type="button" onClick={() => setHtml(RESET)}>
            Reset from parent
          </button>
          <button
            type="button"
            onClick={() => {
              ref.current?.focus();
            }}
          >
            Focus
          </button>
        </div>

        <div className="grid">
          <div className="panel">
            <div className="panel-label">Editor</div>
            <Editable
              ref={ref}
              html={html}
              onChange={setHtml}
              editable={editable}
              plaintextOnly={plaintextOnly}
              pasteAsPlainText={pasteAsPlainText}
              tagName={tagName}
              placeholder="Start writing…"
              aria-label="Demo editor"
              className={plaintextOnly ? "editor plaintext" : "editor"}
              spellCheck
            />
          </div>
          <div className="panel">
            <div className="panel-label">Live HTML · {html.length} chars</div>
            <pre className="output">{html || " "}</pre>
          </div>
        </div>
      </section>

      <section className="install">
        <code>npm install react-editable-div</code>
      </section>
    </div>
  );
}
