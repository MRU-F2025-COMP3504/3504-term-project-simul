"use client";

import { useState } from "react";

import CodeEditor from "~/components/code-editor";
import { ThemeToggle } from "~/components/theme-toggle";
import { Button } from "~/components/ui/button";

import { sendTestMessage } from "../actions/test-action";

export default function Home() {
  const [message, setMessage] = useState("");

  return (
    <div className="flex min-h-screen flex-col p-8 pb-20 font-sans">
      <ThemeToggle />
      <TestActionButton
        message={message}
        setMessage={setMessage}
      />
      <CodeEditor />
    </div>
  );
}

type TestActionButtonProps = {
  message: string;
  setMessage: (message: string) => void;
};

function TestActionButton({
  message,
  setMessage,
}: TestActionButtonProps) {
  return (
    <Button
      variant="outline"
      onClick={async () => {
        const res = await sendTestMessage({
          message: "Hello, world!",
        });

        setMessage(res.data?.serverResponse ?? "Failed to send message");
      }}
      type="button"
    >
      Send Test Message
      {" "}
      {message && `- ${message}`}
    </Button>
  );
}
