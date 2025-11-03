{
  mkShell,
  alejandra,
  bash,
  nodejs_23,
  pnpm,
  docker-compose,
  playwright-driver,
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

    playwright-driver.browsers
  ];

  shellHook = ''
    export PLAYWRIGHT_BROWSERS_PATH=${playwright-driver.browsers}
    export PLAYWRIGHT_SKIP_VALIDATE_HOST_REQUIREMENTS=true
  '';
}
