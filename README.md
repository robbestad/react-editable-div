# react-editable-div

[![npm](https://img.shields.io/npm/v/react-editable-div.svg)](https://www.npmjs.com/package/react-editable-div)
[![types](https://img.shields.io/npm/types/react-editable-div.svg)](https://www.npmjs.com/package/react-editable-div)
[![license](https://img.shields.io/npm/l/react-editable-div.svg)](./LICENSE)

A tiny, caret-safe `contenteditable` for React 18 and 19.

Drop it in when you need an editable div — comments, titles, notes, inline labels — without pulling in a document editor. Typing updates parent state; the caret does not jump. Zero runtime dependencies.

```tsx
import { useState } from "react";
import { Editable } from "react-editable-div";
import "react-editable-div/styles.css"; // optional placeholder styles

export function Bio() {
  const [html, setHtml] = useState("Hello <b>world</b>");
  return <Editable html={html} onChange={setHtml} placeholder="Write a bio…" />;
}
```

```bash
npm install react-editable-div
```

Peer dependency: `react >= 18`.

## Why this exists

`contenteditable` and React collide. If you render `dangerouslySetInnerHTML` on every keystroke, the browser resets the caret. The 2014 version of this package avoided that by skipping updates entirely — and then silently dropped parent `html` changes.

1.0 keeps the caret still while you type, and still applies `html` when the parent changes it from the outside.

| You want | Use |
| --- | --- |
| An editable div / heading / label | **react-editable-div** |
| A document editor, toolbar, collab, markdown | TipTap, Lexical, or Slate |

## Features

- Caret-safe controlled and uncontrolled modes
- IME composition (CJK input is not flushed mid-keystroke)
- `plaintextOnly` and `pasteAsPlainText`
- Placeholder via `data-placeholder` (import the optional CSS)
- Any `tagName` (`div`, `h1`, `article`, …)
- Forwarded ref to the DOM node (`focus()`, `innerHTML`)
- `"use client"` for Next.js App Router
- TypeScript types included

## API

`onChange(html, event)` — first argument is the current `innerHTML`.

| Prop | Type | Default | Notes |
| --- | --- | --- | --- |
| `html` | `string` | — | Controlled value |
| `defaultHtml` | `string` | `""` | Uncontrolled initial value |
| `onChange` | `(html, event) => void` | — | Fired on `input`, `blur`, and `compositionend` |
| `editable` | `boolean` | `true` | `false` makes it read-only |
| `disabled` | `boolean` | `false` | Same as `editable={false}` |
| `tagName` | `keyof HTMLElementTagNameMap` | `"div"` | Remounts the node if it changes |
| `placeholder` | `string` | — | Shown when the element is empty |
| `plaintextOnly` | `boolean` | `false` | `contenteditable="plaintext-only"` with a fallback |
| `pasteAsPlainText` | `boolean` | `false` | Inserts `text/plain` on paste |
| `sanitize` | `(html) => string` | — | Transforms the string passed to `onChange` |
| `ref` | `Ref<HTMLElement>` | — | The editable element |

All other native HTML attributes (`className`, `style`, `spellCheck`, `onKeyDown`, …) are forwarded.

The element defaults to `role="textbox"` and `aria-multiline="true"`. When it is not editable, `aria-readonly="true"` is set.

### Sanitize and XSS

This package does not sanitize HTML. If you persist or re-render `html` as markup, run it through [DOMPurify](https://github.com/cure53/DOMPurify) (or similar) on the way out. A `sanitize` prop that rewrites markup on every keystroke will jump the caret in controlled mode if the parent echoes the cleaned string back — sanitize on save, not on each input.

### Placeholder CSS

```ts
import "react-editable-div/styles.css";
```

Or copy:

```css
[data-placeholder]:empty::before,
[data-placeholder][data-empty]::before {
  content: attr(data-placeholder);
  color: color-mix(in srgb, currentColor 42%, transparent);
  pointer-events: none;
}
```

Empty `contenteditable` nodes often contain a `<br>`, so `:empty` alone is not enough. The component toggles `data-empty` for that case.

## Demo

```bash
npm install
npm run demo
```

Opens a playground at `http://localhost:5173` — live HTML, editable toggle, plaintext mode, paste-as-text, and a “reset from parent” control to prove external updates.

## Migration from 0.0.4

```diff
- <Editable html={html} onChange={(e) => save(e.target.value)} />
+ <Editable html={html} onChange={(html) => save(html)} />

- this.refs.editable.getDOMNode().innerHTML
+ ref.current.innerHTML
```

- React 18+ is required
- `onChange` is `(html, event) => void`, not a mutated synthetic event
- `disabled` is an alias of `editable={false}`
- `html` is optional
- CommonJS: `const { Editable } = require('react-editable-div')` (the module is also the component, matching 0.0.4)

## License

ISC
