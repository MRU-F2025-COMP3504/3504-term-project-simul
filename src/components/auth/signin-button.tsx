"use client";

import { GithubIcon } from "lucide-react";
import { useAction } from "next-safe-action/hooks";

import { signInWithGithubAction } from "~/actions/auth-actions";
import { Button } from "~/components/ui/button";

export type SignInButtonProps = {
  callbackURL?: string;
};

/**
 * Renders a button that initiates the GitHub sign-in process.
 *
 * @param {SignInButtonProps} props - The props for the SignInButton component.
 * @param {string} [props.callbackURL] - The URL to redirect to after successful sign-in.
 * @returns {JSX.Element} The rendered sign-in button component.
 *
 * @example
 * <SignInButton callbackURL="/profile" />
 */
export default function SignInButton({
  callbackURL = "/dashboard",
}: SignInButtonProps) {
  const { execute, isExecuting } = useAction(signInWithGithubAction);

  return (
    <Button
      disabled={isExecuting}
      onClick={() => execute({
        callbackURL,
      })}
    >
      <GithubIcon className="mr-2" />
      Sign In with Github
    </Button>
  );
}
