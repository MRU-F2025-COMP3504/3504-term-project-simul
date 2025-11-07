import Logo from "./branding/logo";

export default function Footer() {
  return (
    <footer className="border-t py-8">
      <div className="container mx-auto px-4">
        <div className={`
          flex flex-col items-center justify-between gap-4
          sm:flex-row
        `}
        >
          <div className="flex items-center gap-2">
            <div className="bg-primary flex h-6 w-6 items-center justify-center">
              <Logo />
            </div>
            <span className="font-semibold">Simul</span>
          </div>
          <p className="text-muted-foreground text-sm">
            ©
            {" "}
            {new Date().getFullYear()}
            {" "}
            Simul. Built for COMP 3504.
          </p>
        </div>
      </div>
    </footer>
  );
}
