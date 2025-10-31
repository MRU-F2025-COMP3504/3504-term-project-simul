import { Plus } from "lucide-react";

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
      bg-background flex w-[250px] flex-col overflow-hidden border-r
    `}
    >
      {/* File explorer header */}
      <div className={`
        text-primary text-md flex items-center justify-between border-b p-4
        font-bold
      `}
      >
        <span>Files</span>
        <Button
          onClick={handleCreateNewFile}
          variant="ghost"
        >
          <Plus className="h-4 w-4" />
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
            ? `border-l-muted-foreground bg-muted`
            : `
              hover:bg-muted
              border-l-transparent
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
