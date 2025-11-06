import type { ReactNode } from "react";

import { InstructorSessionProvider } from "./instructor-session-context";

export default function InstructorLayout({ children }: { children: ReactNode }) {
  return <InstructorSessionProvider>{children}</InstructorSessionProvider>;
}
