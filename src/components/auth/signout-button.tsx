"use client";

import { useAction } from "next-safe-action/hooks";

import { signOutAction } from "~/actions/auth-actions";
import { Button } from "~/components/ui/button";

/**
 * A button component that triggers the sign-out action when clicked.
 *
 * Utilizes the `useAction` hook to execute the `signOutAction` and manages the button's disabled state
 * while the action is executing.
 *
 * @returns {JSX.Element} The rendered sign-out button.
 */
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
