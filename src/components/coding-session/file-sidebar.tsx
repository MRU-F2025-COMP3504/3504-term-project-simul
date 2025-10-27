import type { FileEntry } from "~/types/coding-session";

import { Button } from "~/components/ui/button";

export type FileSidebarProps = {
  files: Map<string, FileEntry>;
  activeFile: string;
  onCreateFile: (fileName: string) => void;
  onSelectFile: (fileName: string) => void;
};

export function FileSidebar({ files, activeFile, onCreateFile, onSelectFile }: FileSidebarProps) {
  const handleCreateNewFile = () => {
    const newFileName = `file${files.size + 1}.js`;
    onCreateFile(newFileName);
    onSelectFile(newFileName);
  };

  return (
    <div className={`
      flex w-[250px] flex-col overflow-hidden border-r bg-neutral-50
    `}
    >
      {/* File explorer header */}
      <div className={`
        flex items-center justify-between border-b p-4 text-sm font-bold
        text-neutral-700 uppercase
      `}
      >
        <span>Files</span>
        <Button
          onClick={handleCreateNewFile}
          className="px-2 py-1 text-xs"
        >
          +
        </Button>
      </div>

      {/* File tree */}
      <div className="flex-1 overflow-auto py-2">
        {Array.from(files.keys()).map(fileName => (
          <div
            key={fileName}
            onClick={() => onSelectFile(fileName)}
            className={`
              cursor-pointer border-l-4 px-4 py-3 text-sm transition-all
              select-none
              ${activeFile === fileName
            ? "border-l-blue-600 bg-blue-50 text-blue-600"
            : `
              border-l-transparent
              hover:bg-neutral-100
            `}
            `}
          >
            📄
            {" "}
            {fileName}
          </div>
        ))}
      </div>
    </div>
  );
}
