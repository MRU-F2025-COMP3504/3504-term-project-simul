{
  mkShell,
  alejandra,
  bash,
  nodejs_23,
  pnpm,
  docker-compose,
}:
mkShell rec {
  name = "simul";

  packages = [
    bash
    nodejs_23
    pnpm

    docker-compose

    # required for CI for format checking
    alejandra
  ];
}
