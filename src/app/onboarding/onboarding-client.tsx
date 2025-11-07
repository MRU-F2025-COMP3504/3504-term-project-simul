"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";

type Props = {
  onSelectRoleAction: (role: "student" | "instructor") => Promise<void>;
};

export default function OnboardingClient({ onSelectRoleAction }: Props) {
  const [selectedRole, setSelectedRole] = useState<"student" | "instructor" | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleRoleSelect = async (role: "student" | "instructor") => {
    setSelectedRole(role);
    setIsLoading(true);

    try {
      await onSelectRoleAction(role);
      router.push("/dashboard");
    }
    catch (error) {
      console.error("Failed to set role:", error);
      setIsLoading(false);
      setSelectedRole(null);
      toast.error("Failed to set role. Please try again.");
    }
  };

  return (
    <div className={`
      bg-background flex min-h-screen items-center justify-center px-4
    `}
    >
      <div className="mx-auto w-full max-w-2xl text-center">
        <div className={`
          bg-muted text-muted-foreground mb-6 inline-flex items-center
          rounded-full border px-3 py-1 text-sm font-medium
        `}
        >
          <span className="bg-primary mr-2 h-2 w-2 rounded-full" aria-hidden="true"></span>
          Getting Started
        </div>

        <h1 className={`
          mb-6 text-4xl font-bold tracking-tight
          sm:text-5xl
          md:text-6xl
        `}
        >
          Welcome to
          <span className={`
            from-primary to-primary/60 block bg-gradient-to-r bg-clip-text
            text-transparent
          `}
          >
            Simul
          </span>
        </h1>

        <p className={`
          text-muted-foreground mx-auto mb-10 max-w-xl text-lg
          sm:text-xl
        `}
        >
          Choose your role to get started.
        </p>

        <div className={`
          grid gap-6
          sm:grid-cols-2
        `}
        >
          <Card className={`
            group cursor-pointer border-2 transition-all
            hover:shadow-lg
            ${selectedRole === "student" ? "border-primary shadow-lg" : ""}
          `}
          >
            <button
              type="button"
              onClick={() => handleRoleSelect("student")}
              disabled={isLoading}
              className="w-full cursor-pointer text-left"
            >
              <CardHeader className="mb-2">
                <CardTitle className={`
                  group-hover:text-primary
                  text-2xl transition-colors
                `}
                >
                  Student
                </CardTitle>
                <CardDescription className="text-primary">
                  View courses & practice coding
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-sm">
                  Watch instructor playbacks, take control of the editor, and practice with
                  hands-on exercises.
                </p>
              </CardContent>
            </button>
          </Card>

          <Card className={`
            group cursor-pointer border-2 transition-all
            hover:shadow-lg
            ${selectedRole === "instructor" ? "border-primary shadow-lg" : ""}
          `}
          >
            <button
              type="button"
              onClick={() => handleRoleSelect("instructor")}
              disabled={isLoading}
              className="w-full cursor-pointer text-left"
            >
              <CardHeader className="mb-2">
                <CardTitle className={`
                  group-hover:text-primary
                  text-2xl transition-colors
                `}
                >
                  Instructor
                </CardTitle>
                <CardDescription className="text-primary">
                  Create & manage courses
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-sm">
                  Create interactive coding session recordings and manage lessons for your
                  students.
                </p>
              </CardContent>
            </button>
          </Card>
        </div>

        {/* we use invisible here to avoid layout shift */}
        <div className={`
          text-muted-foreground mt-8 animate-pulse text-center text-base
          ${isLoading ? "" : "invisible"}
        `}
        >
          Setting up your account...
        </div>
      </div>
    </div>
  );
}
