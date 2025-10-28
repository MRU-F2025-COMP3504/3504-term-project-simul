import Banner from "~/components/banner/simul-banner";
import CodeEditor from "~/components/code-editor";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col p-8 pb-20 font-sans">
      <Banner />
      <CodeEditor />
    </div>
  );
}
