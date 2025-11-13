export default function Logo() {
  return (
    <div
      className="flex items-center gap-2"
      role="img"
      aria-label="Simul Logo"
    >
      <div className="bg-primary flex h-8 w-8 items-center justify-center">
        <span className="text-primary-foreground font-mono text-lg font-bold">
          S
        </span>
      </div>
      <span className="text-xl font-bold tracking-tight">Simul</span>
    </div>
  );
}
