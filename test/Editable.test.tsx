import { cleanup, fireEvent, render } from "@testing-library/react";
import { createRef, useState, type ReactElement } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { Editable } from "../src/index";

afterEach(cleanup);

function Controlled({
  initial = "A",
  onChange,
}: {
  initial?: string;
  onChange?: (html: string) => void;
}): ReactElement {
  const [html, setHtml] = useState(initial);
  return (
    <Editable
      html={html}
      onChange={(next) => {
        onChange?.(next);
        setHtml(next);
      }}
      data-testid="ed"
    />
  );
}

describe("Editable", () => {
  it("renders html into a contenteditable div", () => {
    const { container } = render(<Editable html="<b>Hello</b>" />);
    const el = container.firstChild as HTMLElement;
    expect(el.tagName).toBe("DIV");
    expect(el.innerHTML).toBe("<b>Hello</b>");
    expect(el.getAttribute("contenteditable")).toBe("true");
    expect(el.getAttribute("role")).toBe("textbox");
  });

  it("calls onChange with the html string and the event", () => {
    const onChange = vi.fn();
    const { container } = render(<Editable html="Hi" onChange={onChange} />);
    const el = container.firstChild as HTMLElement;
    el.innerHTML = "Hey";
    fireEvent.input(el);
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange.mock.calls[0]?.[0]).toBe("Hey");
    expect(onChange.mock.calls[0]?.[1]).toMatchObject({ type: "input" });
  });

  it("does not rewrite the DOM when html echoes onChange", () => {
    const { getByTestId } = render(<Controlled />);
    const el = getByTestId("ed");
    el.innerHTML = "AB";
    const afterType = el.innerHTML;
    fireEvent.input(el);
    expect(el.innerHTML).toBe(afterType);
  });

  it("applies external html updates", () => {
    const { container, rerender } = render(<Editable html="<i>a</i>" />);
    const el = container.firstChild as HTMLElement;
    rerender(<Editable html="<i>b</i>" />);
    expect(el.innerHTML).toBe("<i>b</i>");
  });

  it("does not reset typed content in uncontrolled mode", () => {
    const { container, rerender } = render(<Editable defaultHtml="start" />);
    const el = container.firstChild as HTMLElement;
    el.innerHTML = "typed";
    fireEvent.input(el);
    rerender(<Editable defaultHtml="start" />);
    expect(el.innerHTML).toBe("typed");
  });

  it("respects editable={false} and disabled", () => {
    const { container, rerender } = render(<Editable html="x" editable={false} />);
    const el = container.firstChild as HTMLElement;
    expect(el.getAttribute("contenteditable")).toBe("false");
    expect(el.getAttribute("aria-readonly")).toBe("true");

    rerender(<Editable html="x" disabled />);
    expect(el.getAttribute("contenteditable")).toBe("false");
  });

  it("forwards a ref to the DOM node", () => {
    const ref = createRef<HTMLElement>();
    render(<Editable html="z" ref={ref} />);
    expect(ref.current?.innerHTML).toBe("z");
    expect(ref.current?.getAttribute("role")).toBe("textbox");
  });

  it("renders a custom tagName", () => {
    const { container } = render(<Editable html="Title" tagName="h1" />);
    expect((container.firstChild as HTMLElement).tagName).toBe("H1");
  });

  it("sets placeholder data attributes", () => {
    const { container } = render(<Editable html="" placeholder="Write…" />);
    const el = container.firstChild as HTMLElement;
    expect(el.getAttribute("data-placeholder")).toBe("Write…");
    expect(el.hasAttribute("data-empty")).toBe(true);
    expect(el.getAttribute("aria-placeholder")).toBe("Write…");
  });

  it("clears data-empty after typing", () => {
    const { container } = render(<Editable html="" placeholder="Write…" />);
    const el = container.firstChild as HTMLElement;
    el.innerHTML = "typed";
    fireEvent.input(el);
    expect(el.hasAttribute("data-empty")).toBe(false);
  });

  it("runs sanitize on change without requiring a DOM rewrite", () => {
    const onChange = vi.fn();
    const { container } = render(
      <Editable
        html="<p>hi</p>"
        sanitize={(value) => value.replace("hi", "hey")}
        onChange={onChange}
      />,
    );
    const el = container.firstChild as HTMLElement;
    el.innerHTML = "<p>hi!</p>";
    fireEvent.input(el);
    expect(onChange.mock.calls[0]?.[0]).toBe("<p>hey!</p>");
    expect(el.innerHTML).toBe("<p>hi!</p>");
  });

  it("does not emit onChange when the html is unchanged", () => {
    const onChange = vi.fn();
    const { container } = render(<Editable html="same" onChange={onChange} />);
    const el = container.firstChild as HTMLElement;
    fireEvent.input(el);
    expect(onChange).not.toHaveBeenCalled();
  });

  it("skips onChange during composition and flushes on compositionend", () => {
    const onChange = vi.fn();
    const { container } = render(<Editable html="" onChange={onChange} />);
    const el = container.firstChild as HTMLElement;
    fireEvent.compositionStart(el);
    el.innerHTML = "あ";
    fireEvent.input(el);
    expect(onChange).not.toHaveBeenCalled();
    fireEvent.compositionEnd(el);
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange.mock.calls[0]?.[0]).toBe("あ");
  });

  it("pastes plain text when pasteAsPlainText is set", () => {
    const onChange = vi.fn();
    const { container } = render(
      <Editable html="x" pasteAsPlainText onChange={onChange} />,
    );
    const el = container.firstChild as HTMLElement;
    el.focus();
    const selection = window.getSelection();
    const range = document.createRange();
    range.selectNodeContents(el);
    range.collapse(false);
    selection?.removeAllRanges();
    selection?.addRange(range);

    fireEvent.paste(el, {
      clipboardData: {
        getData: (type: string) => (type === "text/plain" ? "plain\nline" : ""),
      },
    });
    expect(onChange).toHaveBeenCalled();
    expect(String(onChange.mock.calls[0]?.[0])).toContain("plain");
  });
});
