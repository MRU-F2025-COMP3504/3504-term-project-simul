import type { FileEntry } from "~/types/coding-session";

export type FileTabsProps = {
  files: Map<string, FileEntry>;
  activeFile: string;
  onSelectFile: (fileName: string) => void;
};

export function FileTabs({ files, activeFile, onSelectFile }: FileTabsProps) {
  return (
    <div className={`
      flex gap-0 overflow-x-auto border-b bg-neutral-50 pt-2 pr-2 pb-0 pl-2
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
          ? "border-neutral-200 border-b-transparent bg-white"
          : `
            border-neutral-300 bg-neutral-100
            hover:bg-neutral-200
          `}
          `}
        >
          {fileName}
        </button>
      ))}
    </div>
  );
}
