import Link from "next/link";

import SignoutButton from "~/components/auth/signout-button";
import { Button } from "~/components/ui/button";

export default async function Dashboard() {
  return (
    <div className="space-x-4 p-4 text-2xl">
      <Button asChild>
        <Link href="/dashboard/instructor">Record Mock Data</Link>
      </Button>
      <Button asChild>
        <Link href="/dashboard/problem">Playback Mock Data</Link>
      </Button>

      <SignoutButton />
    </div>
  );
}
