"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "~/components/ui/button";
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
      bg-background flex min-h-screen items-center justify-center
    `}
    >
      <Card className="w-full max-w-md border-0 shadow-2xl">
        <CardHeader className="pb-6 text-center">
          <CardTitle className="text-primary text-2xl font-bold">
            Welcome to Simul!
          </CardTitle>
          <CardDescription className="text-muted-foreground text-lg">
            Choose your role to get started with coding practice and lessons.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-4">
            <Button
              variant={selectedRole === "student" ? "default" : "outline"}
              size="lg"
              className={`
                flex h-20 flex-col items-center justify-center text-lg
                font-semibold
              `}
              onClick={() => handleRoleSelect("student")}
              disabled={isLoading}
            >
              Student
              <span className="text-sm font-normal opacity-75">View courses & practice coding</span>
            </Button>

            <Button
              variant={selectedRole === "instructor" ? "default" : "outline"}
              size="lg"
              className={`
                flex h-20 flex-col items-center justify-center text-lg
                font-semibold
              `}
              onClick={() => handleRoleSelect("instructor")}
              disabled={isLoading}
            >
              Instructor
              <span className="text-sm font-normal opacity-75">Create & manage courses</span>
            </Button>
          </div>

          {isLoading && (
            <div className={`
              text-muted-foreground animate-pulse text-center text-sm
            `}
            >
              Setting up your account...
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
