import { render, screen } from "@testing-library/react";
import React from "react";
import { describe, expect, it, vi } from "vitest";

import CodeEditor from "~/components/code-editor";

/*
NOTES:
- using toBe and toBeDefined instead if toBeInTheDocument()
- "mock" to isolate the heavy Monaco Editor and next-themes dependency
*/

// Mock next-themes
vi.mock("next-themes", () => ({
  // Replaces real dependencies with fake ones *useTheme
  // eslint-disable-next-line react-hooks-extra/no-unnecessary-use-prefix
  useTheme: () => ({
    theme: "light",
    setTheme: vi.fn(), // mock function
  }),
}));

// Mock @monaco-editor/react - FIXED: export Editor as named export
vi.mock("@monaco-editor/react", () => ({
  Editor: ({ value, theme, defaultValue }: any) =>
    React.createElement(
      "div",
      {
        "data-testid": "monaco-editor",
        "data-value": value || defaultValue,
        "data-theme": theme,
      },
      "Monaco Editor Mock",
    ),
}));

describe("the CodeEditor component", () => {
  // it() same as test()
  it("should render the monaco editor", () => {
    // render() to mount component to test environment
    render(React.createElement(CodeEditor, null));

    // Finds elements in the rendered output
    const editor = screen.getByTestId("monaco-editor");
    expect(editor).toBeDefined();
  });

  it("should use default placeholder text", () => {
    render(React.createElement(CodeEditor, null));

    const editor = screen.getByTestId("monaco-editor");
    expect(editor.getAttribute("data-value")).toBe("// Write your code here");
  });

  it("should apply light theme by default", () => {
    render(React.createElement(CodeEditor, null));

    const editor = screen.getByTestId("monaco-editor");
    expect(editor.getAttribute("data-theme")).toBe("vs-light");
  });
});
