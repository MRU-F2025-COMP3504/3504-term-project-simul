"use client";

// We change the name of the import to avoid conflicts with the next-themes ThemeProvider
import { ThemeProvider as NextThemesProvider } from "next-themes";
import * as React from "react";

/*
  This is a wrapper for the NextThemesProvider component.
  It is used to provide the theme to the entire application.
  We create a wrapper to make it easier to use the theme provider in the entire application.
*/
export function ThemeProvider({
  children,
  ...props
}: React.ComponentProps<typeof NextThemesProvider>) {
  return <NextThemesProvider {...props}>{children}</NextThemesProvider>;
}
