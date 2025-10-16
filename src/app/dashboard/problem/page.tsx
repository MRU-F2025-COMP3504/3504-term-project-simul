import CodePlaybackDemo from "~/components/code-playback-demo";

export default function ProblemPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <h1 className="p-4 text-2xl font-bold">Code Playback Demo</h1>

      <div className="flex flex-1">
        <CodePlaybackDemo />
      </div>
    </div>
  );
}
