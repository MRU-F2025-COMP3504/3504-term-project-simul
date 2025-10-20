import { javascript } from "@codemirror/lang-javascript";
import { useCodeMirror } from "@uiw/react-codemirror";
import { useEffect, useRef } from "react";

export function CodeEditor() {
  const editor = useRef<HTMLDivElement>(null);

  const { setContainer } = useCodeMirror({
    container: editor.current,
    extensions: [
      javascript(),
    ],
    basicSetup: {
      lineNumbers: true,
      highlightActiveLine: true,
      highlightActiveLineGutter: true,

    },
  });

  useEffect(() => {
    if (editor.current) {
      setContainer(editor.current);
    }
  }, [setContainer]);
  return (
    <>
      <div ref={editor} />
    </>
  );
}
