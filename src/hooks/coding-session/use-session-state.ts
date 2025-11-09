import { useState } from "react";

export function useSessionState() {
  const [files, setFiles] = useState<Map<string, File>>(() => new Map());
  const [activeFile, setActiveFile] = useState<string>("");

  return {
    files,
    setFiles,
    activeFile,
    setActiveFile,
  };
}
