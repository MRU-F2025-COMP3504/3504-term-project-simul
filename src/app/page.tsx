"use client";

import { toast } from "sonner";

import SignInButton from "~/components/auth/signin-button";
import { ThemeToggle } from "~/components/theme-toggle";
import { Button } from "~/components/ui/button";

export default function Home() {
  const handleDelete = () => {
    console.warn("Item deleted");
    // Actual delete logic here
  };

  const handleUndo = () => {
    console.warn("Undo delete");
    // Undo logic here
  };

  return (
    <div className="flex min-h-screen flex-col gap-4 p-8 pb-20 font-sans">
      <ThemeToggle />
      <SignInButton />

      {/* Toast Test Buttons */}
      <div className="flex flex-wrap gap-2">
        <Button onClick={() => toast.success("Success toast!")}>
          Test Success
        </Button>
        <Button onClick={() => toast.error("Error toast!")}>
          Test Error
        </Button>
        <Button onClick={() => toast.info("Info toast!")}>
          Test Info
        </Button>
        <Button onClick={() => toast.warning("Warning toast!")}>
          Test Warning
        </Button>
        <Button
          onClick={() => {
            toast.promise(
              new Promise(resolve => setTimeout(resolve, 2000)),
              {
                loading: "Loading...",
                success: "Loaded!",
                error: "Failed!",
              },
            );
          }}
        >
          Test Loading Success
        </Button>
        <Button
          onClick={() => {
            toast.promise(
              new Promise((_, reject) => setTimeout(() => reject(new Error("Failed")), 2000)),
              {
                loading: "Loading...",
                success: "Loaded!",
                error: "Failed to load!",
              },
            );
          }}
        >
          Test Loading Fail
        </Button>
        <Button
          onClick={() => {
            handleDelete();
            toast("Item deleted", {
              description: "Your item has been permanently deleted",
              action: {
                label: "Undo Delete (console message)",
                onClick: handleUndo,
              },
            });
          }}
        >
          Test Delete with Undo
        </Button>
        <Button
          onClick={() => {
            toast.warning("Course saved!", {
              description: "Introduction to JavaScript",
              action: {
                label: "Print to Console",
                onClick: () => console.warn("Navigate to course"),
              },
            });
          }}
        >
          Test with Action for console.warn
        </Button>
      </div>
    </div>
  );
}
