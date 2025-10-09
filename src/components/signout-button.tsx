"use client";

import { useAction } from "next-safe-action/hooks";

import { signOutAction } from "~/actions/auth-actions";
import { Button } from "~/components/ui/button";

export default function SignoutButton() {
  const { execute, isExecuting } = useAction(signOutAction);

  return (
    <Button
      onClick={() => execute()}
      disabled={isExecuting}
    >
      Sign Out
    </Button>
  );
}
