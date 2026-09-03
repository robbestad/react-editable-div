import {
  createElement,
  forwardRef,
  memo,
  useCallback,
  useLayoutEffect,
  useRef,
  type ClipboardEvent,
  type CompositionEvent,
  type FocusEvent,
  type HTMLAttributes,
  type InputEventHandler,
  type Ref,
  type SyntheticEvent,
} from "react";

export type EditableProps = Omit<
  HTMLAttributes<HTMLElement>,
  | "onChange"
  | "dangerouslySetInnerHTML"
  | "contentEditable"
  | "children"
  | "placeholder"
> & {
  /** Controlled HTML. Omit together with `defaultHtml` for an empty editor. */
  html?: string;
  /** Uncontrolled initial HTML. Ignored when `html` is set. */
  defaultHtml?: string;
  onChange?: (html: string, event: SyntheticEvent<HTMLElement>) => void;
  /** When false, the element is read-only. Default true. */
  editable?: boolean;
  /** Alias for `editable={false}`. */
  disabled?: boolean;
  /** Element type. Changing this remounts the node. Default `"div"`. */
  tagName?: keyof HTMLElementTagNameMap;
  placeholder?: string;
  /** Prefer `contenteditable="plaintext-only"`; falls back to `"true"`. */
  plaintextOnly?: boolean;
  /** Insert clipboard `text/plain` instead of rich HTML. */
  pasteAsPlainText?: boolean;
  /**
   * Transform HTML before `onChange`. Do not rewrite the DOM on the typing
   * path — a sanitizer that changes markup every keystroke will jump the caret
   * if the parent echoes the cleaned string back as `html`.
   */
  sanitize?: (html: string) => string;
};

type Cfg = {
  onChange?: EditableProps["onChange"];
  sanitize?: EditableProps["sanitize"];
  onInput?: InputEventHandler<HTMLElement>;
  onBlur?: EditableProps["onBlur"];
  onPaste?: EditableProps["onPaste"];
  onCompositionStart?: EditableProps["onCompositionStart"];
  onCompositionEnd?: EditableProps["onCompositionEnd"];
  pasteAsPlainText: boolean;
  plaintextOnly: boolean;
};

function isEnabled(editable: boolean | undefined, disabled: boolean | undefined): boolean {
  if (disabled === true) return false;
  if (editable === false) return false;
  return true;
}

function normalizeHtml(html: string): string {
  return html.replace(/\u00A0|\u202F/g, " ").replace(/&nbsp;/gi, " ").replace(/<br\s*\/?>/gi, "<br>");
}

function htmlIsEmpty(html: string): boolean {
  const compact = html.replace(/\s|&nbsp;|\u00A0/gi, "").toLowerCase();
  return (
    compact === "" ||
    compact === "<br>" ||
    compact === "<br/>" ||
    compact === "<div><br></div>" ||
    compact === "<div></div>" ||
    compact === "<p><br></p>" ||
    compact === "<p></p>"
  );
}

function markEmpty(el: HTMLElement, html: string): void {
  if (htmlIsEmpty(html)) el.setAttribute("data-empty", "");
  else el.removeAttribute("data-empty");
}

function applyContentEditable(el: HTMLElement, enabled: boolean, plaintextOnly: boolean): void {
  if (!enabled) {
    el.contentEditable = "false";
    return;
  }
  if (plaintextOnly) {
    try {
      el.contentEditable = "plaintext-only";
    } catch {
      el.contentEditable = "true";
    }
    if (!el.isContentEditable) el.contentEditable = "true";
    return;
  }
  el.contentEditable = "true";
}

function insertPlainText(text: string): void {
  const selection = window.getSelection();
  if (!selection || selection.rangeCount === 0) {
    document.execCommand("insertText", false, text);
    return;
  }

  const range = selection.getRangeAt(0);
  range.deleteContents();

  const parts = text.split(/\r?\n/);
  const nodes: Node[] = [];
  const frag = document.createDocumentFragment();
  for (let i = 0; i < parts.length; i++) {
    if (i > 0) {
      const br = document.createElement("br");
      frag.appendChild(br);
      nodes.push(br);
    }
    const node = document.createTextNode(parts[i] ?? "");
    frag.appendChild(node);
    nodes.push(node);
  }

  range.insertNode(frag);
  const last = nodes[nodes.length - 1];
  if (last) {
    const tail = document.createRange();
    tail.setStartAfter(last);
    tail.collapse(true);
    selection.removeAllRanges();
    selection.addRange(tail);
  }
}

function EditableInner(
  {
    html,
    defaultHtml = "",
    onChange,
    editable,
    disabled,
    tagName = "div",
    placeholder,
    plaintextOnly = false,
    pasteAsPlainText = false,
    sanitize,
    className,
    style,
    onInput,
    onBlur,
    onPaste,
    onCompositionStart,
    onCompositionEnd,
    role,
    ...rest
  }: EditableProps,
  forwardedRef: Ref<HTMLElement>,
) {
  const enabled = isEnabled(editable, disabled);
  const controlled = html !== undefined;
  const initialHtml = useRef(html ?? defaultHtml);
  const lastDomHtml = useRef(html ?? defaultHtml);
  const lastEmitted = useRef(html ?? defaultHtml);
  const elRef = useRef<HTMLElement | null>(null);
  const instanceRef = useRef<HTMLElement | null>(null);
  const composing = useRef(false);
  // React 19 diffs this prop by object identity and writes innerHTML when it
  // changes. Keep one object so parent re-renders do not reset the caret.
  const markup = useRef({ __html: initialHtml.current });

  const cfg = useRef<Cfg>({
    onChange,
    sanitize,
    onInput,
    onBlur,
    onPaste,
    onCompositionStart,
    onCompositionEnd,
    pasteAsPlainText,
    plaintextOnly,
  });
  cfg.current = {
    onChange,
    sanitize,
    onInput,
    onBlur,
    onPaste,
    onCompositionStart,
    onCompositionEnd,
    pasteAsPlainText,
    plaintextOnly,
  };

  const assignRef = useCallback(
    (node: HTMLElement | null) => {
      elRef.current = node;
      if (typeof forwardedRef === "function") forwardedRef(node);
      else if (forwardedRef) forwardedRef.current = node;
    },
    [forwardedRef],
  );

  useLayoutEffect(() => {
    const el = elRef.current;
    if (!el) return;

    applyContentEditable(el, enabled, plaintextOnly);

    const remounted = instanceRef.current !== el;
    instanceRef.current = el;

    const next = controlled ? (html ?? "") : lastDomHtml.current;
    markEmpty(el, el.innerHTML || next);

    if (remounted) {
      if (el.innerHTML !== next) el.innerHTML = next;
      lastDomHtml.current = el.innerHTML;
      return;
    }

    if (!controlled) return;

    // Parent echoed what we just emitted — do not touch the DOM (caret).
    if (next === lastEmitted.current) return;

    if (normalizeHtml(next) === normalizeHtml(el.innerHTML)) {
      lastEmitted.current = next;
      lastDomHtml.current = el.innerHTML;
      return;
    }

    el.innerHTML = next;
    lastDomHtml.current = next;
    lastEmitted.current = next;
    markEmpty(el, next);
  }, [html, controlled, enabled, plaintextOnly, tagName]);

  const emitChange = useCallback((event: SyntheticEvent<HTMLElement>) => {
    const el = elRef.current;
    if (!el) return;
    const raw = el.innerHTML;
    const next = cfg.current.sanitize ? cfg.current.sanitize(raw) : raw;
    markEmpty(el, raw);
    if (raw === lastDomHtml.current && next === lastEmitted.current) return;
    lastDomHtml.current = raw;
    lastEmitted.current = next;
    cfg.current.onChange?.(next, event);
  }, []);

  const handleInput = useCallback<InputEventHandler<HTMLElement>>(
    (event) => {
      cfg.current.onInput?.(event);
      if (event.defaultPrevented || composing.current) return;
      emitChange(event);
    },
    [emitChange],
  );

  const handleBlur = useCallback(
    (event: FocusEvent<HTMLElement>) => {
      cfg.current.onBlur?.(event);
      if (event.defaultPrevented) return;
      emitChange(event);
    },
    [emitChange],
  );

  const handleCompositionStart = useCallback((event: CompositionEvent<HTMLElement>) => {
    composing.current = true;
    cfg.current.onCompositionStart?.(event);
  }, []);

  const handleCompositionEnd = useCallback(
    (event: CompositionEvent<HTMLElement>) => {
      composing.current = false;
      cfg.current.onCompositionEnd?.(event);
      if (event.defaultPrevented) return;
      emitChange(event);
    },
    [emitChange],
  );

  const handlePaste = useCallback(
    (event: ClipboardEvent<HTMLElement>) => {
      cfg.current.onPaste?.(event);
      if (event.defaultPrevented) return;
      if (!cfg.current.pasteAsPlainText && !cfg.current.plaintextOnly) return;
      event.preventDefault();
      insertPlainText(event.clipboardData.getData("text/plain"));
      emitChange(event);
    },
    [emitChange],
  );

  return createElement(tagName, {
    ...rest,
    ref: assignRef,
    className,
    style,
    role: role ?? "textbox",
    "aria-multiline": rest["aria-multiline"] ?? true,
    "aria-readonly": enabled ? undefined : true,
    "aria-placeholder": placeholder,
    "data-placeholder": placeholder,
    contentEditable: enabled ? (plaintextOnly ? "plaintext-only" : true) : false,
    suppressContentEditableWarning: true,
    dangerouslySetInnerHTML: markup.current,
    onInput: handleInput,
    onBlur: handleBlur,
    onPaste: handlePaste,
    onCompositionStart: handleCompositionStart,
    onCompositionEnd: handleCompositionEnd,
  });
}

export const Editable = memo(forwardRef(EditableInner));
Editable.displayName = "Editable";

export default Editable;
