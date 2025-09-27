{
  mkShell,
  alejandra,
  bash,
  nodejs_23,
  pnpm,
}:
mkShell rec {
  name = "simul";

  packages = [
    bash
    nodejs_23
    pnpm

    # required for CI for format checking
    alejandra
  ];
}
