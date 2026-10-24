import { useDockerContextHost } from './docker-host';

describe('useDockerContextHost', () => {
  it('keeps an explicit DOCKER_HOST', () => {
    const env = { DOCKER_HOST: 'tcp://remote:2375' };
    useDockerContextHost(env, () => 'unix:///elsewhere.sock');
    expect(env).toEqual({ DOCKER_HOST: 'tcp://remote:2375' });
  });

  it('uses a VM socket from the docker context and overrides Ryuk', () => {
    const env: Record<string, string | undefined> = {};
    useDockerContextHost(env, () => 'unix:///Users/me/.rd/docker.sock');
    expect(env).toEqual({
      DOCKER_HOST: 'unix:///Users/me/.rd/docker.sock',
      TESTCONTAINERS_DOCKER_SOCKET_OVERRIDE: '/var/run/docker.sock',
    });
  });

  it('needs no override for the standard socket', () => {
    const env: Record<string, string | undefined> = {};
    useDockerContextHost(env, () => 'unix:///var/run/docker.sock');
    expect(env).toEqual({ DOCKER_HOST: 'unix:///var/run/docker.sock' });
  });

  it('does nothing without a docker CLI', () => {
    const env: Record<string, string | undefined> = {};
    useDockerContextHost(env, () => {
      throw new Error('docker: command not found');
    });
    expect(env).toEqual({});
  });
});
