import { ThemeToggle } from "~/components/theme-toggle";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col p-8 pb-20 font-sans">
      <ThemeToggle />
    </div>
  );
}
