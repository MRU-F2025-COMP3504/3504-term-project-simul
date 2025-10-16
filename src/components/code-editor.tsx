import type { Transaction } from "@codemirror/state";

import { javascript } from "@codemirror/lang-javascript";
import { EditorState } from "@codemirror/state";
import { useCodeMirror } from "@uiw/react-codemirror";
import { useEffect, useRef } from "react";

import { Button } from "~/components/ui/button";

const history: Transaction[] = [];
function recordChanges(tr: Transaction) {
  history.push(tr);
}
export default function CodeEditor(_props: { handleClear: () => void; handleClick: () => void }) {
  const editor = useRef<HTMLDivElement>(null);

  const { view, setContainer } = useCodeMirror({
    container: editor.current,
    extensions: [
      javascript(),
      EditorState.changeFilter.of((tr: Transaction) => {
        recordChanges(tr);
        return true;
      }),
    ],
    basicSetup: {
      lineNumbers: false,
    },
  });

  function handleClick() {
    if (history.length > 0) {
      view?.dispatch(history);
    }
  }
  function handleClear() {
    history.length = 0;
    view?.setState(EditorState.create({ extensions: [javascript()] }));
  }
  useEffect(() => {
    if (editor.current) {
      setContainer(editor.current);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editor.current]);
  return (
    <>
      <Button onClick={handleClear}> Clear </Button>
      <Button onClick={handleClick}>Run</Button>
      <div ref={editor} />
    </>
  );
}
