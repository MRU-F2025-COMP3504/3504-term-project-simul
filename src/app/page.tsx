import SignInButton from "~/components/auth/signin-button";
import CodeEditor from "~/components/code-editor";
import { ThemeToggle } from "~/components/theme-toggle";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col p-8 pb-20 font-sans">
      <ThemeToggle />
      <SignInButton />
      <CodeEditor />
    </div>
  );
}
