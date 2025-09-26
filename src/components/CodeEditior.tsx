"use client";

import { useRef, useState } from "react";
import {Editor} from "@monaco-editor/react";

const CodeEditor = () => {
    const editorRef = useRef<any>(null);
    const [code, setCode] = useState<string>("");

    const onMount = (editor: any) => {
        editorRef.current = editor;
        editor.focus(); 
    };

    return (
        <Editor
            height="30vh"
            defaultLanguage="javascript"
            defaultValue="// Write your code here"
            onMount={onMount}
            onChange={(value) => setCode(value || "")}
            theme="vs-dark"
        />
    );
}

export default CodeEditor;