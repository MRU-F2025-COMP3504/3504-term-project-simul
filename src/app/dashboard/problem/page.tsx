import CodeEditor from "~/components/code-editor";

export default function ProblemPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <h1 className="p-4 text-2xl font-bold">Problem</h1>

      <div className="flex flex-1">
        <div className="w-1/2">
          <CodeEditor />
        </div>

        <div className="w-1/2 p-4">
          <p>
            This is where the problem description / test cases would go.
          </p>
        </div>
      </div>
    </div>
  );
}
