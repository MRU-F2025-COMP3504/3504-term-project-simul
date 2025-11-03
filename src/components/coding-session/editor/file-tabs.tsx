import type { File } from "~/types/coding-session";

export type FileTabsProps = {
  files: Map<string, File>;
  activeFile: string;
  onSelectFile: (fileName: string) => void;
};

export function FileTabs({ files, activeFile, onSelectFile }: FileTabsProps) {
  return (
    <div className={`
      bg-background flex gap-0 overflow-x-auto border-b pt-2 pr-2 pb-0 pl-2
    `}
    >
      {Array.from(files.keys()).map(fileName => (
        <button
          key={fileName}
          type="button"
          onClick={() => onSelectFile(fileName)}
          className={`
            cursor-pointer rounded-t border px-4 py-2 text-sm whitespace-nowrap
            transition-all
            ${activeFile === fileName
          ? "border-muted bg-muted border-b-transparent"
          : `
            bg-background
            hover:bg-muted
          `}
          `}
        >
          {fileName}
        </button>
      ))}
    </div>
  );
}
