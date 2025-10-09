"use client";

import { useAction } from "next-safe-action/hooks";

import { signInWithGithubAction } from "~/actions/auth-actions";
import CodeEditor from "~/components/code-editor";
import { ThemeToggle } from "~/components/theme-toggle";
import { Button } from "~/components/ui/button";

export default function Home() {
  const { execute, isExecuting } = useAction(signInWithGithubAction);

  return (
    <div className="flex min-h-screen flex-col p-8 pb-20 font-sans">
      <ThemeToggle />
      <Button
        disabled={isExecuting}
        onClick={() => execute({
          callbackURL: "/dashboard",
        })}
      >
        Sign In with Github
      </Button>
      <CodeEditor />
    </div>
  );
}
