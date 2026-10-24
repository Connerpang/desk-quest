import { execFileSync } from 'node:child_process';

/**
 * Points Testcontainers at the active Docker context. Docker Desktop uses
 * /var/run/docker.sock, but VM-based engines such as Rancher Desktop and
 * Colima expose a socket elsewhere that only the docker CLI knows about.
 */
export function useDockerContextHost(
  env: Record<string, string | undefined> = process.env,
  readContextHost: () => string = () =>
    execFileSync(
      'docker',
      ['context', 'inspect', '--format', '{{.Endpoints.docker.Host}}'],
      { encoding: 'utf8' },
    ).trim(),
): void {
  if (env['DOCKER_HOST']) return;
  let host: string;
  try {
    host = readContextHost();
  } catch {
    return; // No docker CLI: let Testcontainers use its own defaults.
  }
  if (!host) return;
  env['DOCKER_HOST'] = host;
  // The Ryuk cleanup container mounts the socket from inside the VM, where
  // the engine always listens on the standard path.
  if (host !== 'unix:///var/run/docker.sock') {
    env['TESTCONTAINERS_DOCKER_SOCKET_OVERRIDE'] ??= '/var/run/docker.sock';
  }
}
