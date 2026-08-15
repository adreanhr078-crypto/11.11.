import { spawn } from 'node:child_process';
import { randomBytes } from 'node:crypto';
import { existsSync } from 'node:fs';
import { connect } from 'node:net';
import { networkInterfaces } from 'node:os';
import { dirname, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const viteEntry = resolve(projectRoot, 'node_modules', 'vite', 'bin', 'vite.js');
const wranglerEntry = resolve(projectRoot, 'node_modules', 'wrangler', 'bin', 'wrangler.js');
const API_PORT = 8788;
const REALTIME_PORT = 8790;

function developmentSecret() {
  const configured = process.env.REALTIME_TICKET_SECRET?.trim() ?? '';
  return configured.length >= 32 ? configured : randomBytes(32).toString('hex');
}

function isPrivateLanAddress(address) {
  const octets = address.split('.').map(Number);
  if (octets.length !== 4 || octets.some((octet) => !Number.isInteger(octet) || octet < 0 || octet > 255)) {
    return false;
  }
  return octets[0] === 10
    || (octets[0] === 172 && octets[1] >= 16 && octets[1] <= 31)
    || (octets[0] === 192 && octets[1] === 168);
}

/**
 * Development runs bind all three services to the machine, so a phone on the
 * same private network needs the precise LAN origin allowed by Pages and the
 * realtime Worker. We enumerate only RFC1918 IPv4 addresses; public and VPN
 * origins are never added automatically.
 */
function localDevelopmentOrigins(webPort) {
  const lanHosts = Object.values(networkInterfaces())
    .flatMap((entries) => entries ?? [])
    .filter((entry) => entry.family === 'IPv4' && !entry.internal)
    .map((entry) => entry.address)
    .filter(isPrivateLanAddress);
  const hosts = new Set(['localhost', '127.0.0.1', ...lanHosts]);
  return [...hosts].map((host) => `http://${host}:${webPort}`);
}

function servicesFor(webPort, secret) {
  const allowedOrigins = localDevelopmentOrigins(webPort).join(',');
  return [
    {
      name: 'web',
      entry: viteEntry,
      args: [
        '--config',
        'vite.config.ts',
        '--host',
        '0.0.0.0',
        '--port',
        String(webPort),
        '--strictPort',
      ],
      port: webPort,
      probeUrl: `http://127.0.0.1:${webPort}/`,
      group: 'web',
    },
    {
      name: 'player-api',
      entry: wranglerEntry,
      args: [
        'pages',
        'dev',
        'public',
        '--port',
        String(API_PORT),
        '--binding',
        `PLAYER_ALLOWED_ORIGINS=${allowedOrigins}`,
        '--binding',
        `PLAYER_REALTIME_URL=http://127.0.0.1:${REALTIME_PORT}`,
        '--binding',
        `REALTIME_TICKET_SECRET=${secret}`,
        '--log-level',
        'warn',
        '--show-interactive-dev-session=false',
      ],
      port: API_PORT,
      probeUrl: `http://127.0.0.1:${API_PORT}/api/player/profile`,
      group: 'backend',
    },
    {
      name: 'realtime',
      entry: wranglerEntry,
      args: [
        'dev',
        '--config',
        'workers/realtime/wrangler.jsonc',
        '--port',
        String(REALTIME_PORT),
        '--var',
        `REALTIME_TICKET_SECRET:${secret}`,
        '--var',
        `REALTIME_ALLOWED_ORIGINS:${allowedOrigins}`,
        '--log-level',
        'warn',
        '--show-interactive-dev-session=false',
      ],
      port: REALTIME_PORT,
      probeUrl: `http://127.0.0.1:${REALTIME_PORT}/health`,
      group: 'backend',
    },
  ];
}

function isPortListening(port) {
  return new Promise((resolveProbe) => {
    const socket = connect({ host: '127.0.0.1', port });
    const settle = (listening) => {
      socket.destroy();
      resolveProbe(listening);
    };
    socket.setTimeout(750, () => settle(false));
    socket.once('connect', () => settle(true));
    socket.once('error', () => settle(false));
  });
}

async function probeOwnedRuntime(service) {
  const listening = await isPortListening(service.port);
  if (!listening) return { ...service, listening: false, owned: false };

  try {
    const response = await fetch(service.probeUrl, {
      cache: 'no-store',
      signal: AbortSignal.timeout(1_500),
    });
    const body = await response.text();
    const owned = service.name === 'web'
      ? body.includes('<title>11.11') && body.includes('/src/main.tsx')
      : service.name === 'player-api'
        ? response.status === 401 && body.includes('"code":"unauthorized"')
        : response.ok && body.includes('eleven-eleven-realtime');
    return { ...service, listening: true, owned };
  } catch {
    return { ...service, listening: true, owned: false };
  }
}

function validationReport() {
  const serviceReport = [
    { name: 'web', port: 3000, entry: viteEntry },
    { name: 'player-api', port: API_PORT, entry: wranglerEntry },
    { name: 'realtime', port: REALTIME_PORT, entry: wranglerEntry },
  ].map((service) => ({
    name: service.name,
    port: service.port,
    entry: relative(projectRoot, service.entry).replaceAll('\\', '/'),
    available: existsSync(service.entry),
  }));
  return {
    valid: serviceReport.every((service) => service.available),
    services: serviceReport,
  };
}

async function resolveWebPort() {
  const defaultWeb = servicesFor(3000, 'validation-secret-with-at-least-32-characters')[0];
  const probe = await probeOwnedRuntime(defaultWeb);
  if (!probe.listening || probe.owned) return 3000;
  if (!await isPortListening(5173)) {
    console.warn('[dev] Port 3000 belongs to another application; using http://localhost:5173 instead.');
    return 5173;
  }
  throw new Error(
    'Ports 3000 and 5173 are occupied by other applications. Close one of them, then run npm run dev again.',
  );
}

if (process.argv.includes('--check')) {
  const report = validationReport();
  console.log(JSON.stringify(report));
  if (!report.valid) process.exitCode = 1;
} else {
  runtime: {
    const report = validationReport();
    if (!report.valid) {
      const missing = report.services
        .filter((service) => !service.available)
        .map((service) => service.entry)
        .join(', ');
      throw new Error(
        `Development runtime dependencies are missing: ${missing}. Run npm install.`,
      );
    }

    const webPort = await resolveWebPort();
    const services = servicesFor(webPort, developmentSecret());
    const runtimeProbes = await Promise.all(services.map(probeOwnedRuntime));
    const unknownPorts = runtimeProbes.filter((service) => service.listening && !service.owned);
    if (unknownPorts.length > 0) {
      const details = unknownPorts.map((service) => `${service.name} (${service.port})`).join(', ');
      throw new Error(
        `Development port already belongs to another application: ${details}. Close it, then run npm run dev again.`,
      );
    }

    const backend = runtimeProbes.filter((service) => service.group === 'backend');
    if (backend.some((service) => service.owned) && !backend.every((service) => service.owned)) {
      throw new Error(
        'Only part of the 11.11 backend is still running on ports 8788/8790. Close the stale backend process pair, then run npm run dev again.',
      );
    }

    const missingServices = runtimeProbes.filter((service) => !service.owned);
    if (missingServices.length === 0) {
      console.log(`[dev] 11.11 is already running at http://localhost:${webPort}.`);
      console.log('[dev] Reusing the existing web, player API, and realtime runtimes.');
      break runtime;
    }

    const reused = runtimeProbes.filter((service) => service.owned).map((service) => service.name);
    if (reused.length > 0) console.log(`[dev] Reusing: ${reused.join(', ')}.`);

    const children = [];
    let stopping = false;

    function stopAll(exitCode) {
      if (stopping) return;
      stopping = true;
      const running = children.filter((child) => (
        child.exitCode === null && child.signalCode === null
      ));
      if (running.length === 0) {
        process.exitCode = exitCode;
        return;
      }

      let remaining = running.length;
      const forceTimer = setTimeout(() => {
        for (const child of running) {
          if (child.exitCode === null && child.signalCode === null) child.kill('SIGKILL');
        }
        process.exit(exitCode);
      }, 2_000);

      for (const child of running) {
        child.once('exit', () => {
          remaining -= 1;
          if (remaining === 0) {
            clearTimeout(forceTimer);
            process.exit(exitCode);
          }
        });
        child.kill();
      }
    }

    for (const service of missingServices) {
      const child = spawn(process.execPath, [service.entry, ...service.args], {
        cwd: projectRoot,
        env: process.env,
        stdio: 'inherit',
        windowsHide: true,
      });
      children.push(child);
      child.once('error', (error) => {
        console.error(`[dev:${service.name}] failed to start: ${error.message}`);
        stopAll(1);
      });
      child.once('exit', (code, signal) => {
        if (stopping) return;
        console.error(
          `[dev:${service.name}] stopped unexpectedly (${signal ?? code ?? 'unknown'}).`,
        );
        stopAll(code && code > 0 ? code : 1);
      });
    }

    console.log(`[dev] Opening 11.11 at http://localhost:${webPort}.`);
    process.once('SIGINT', () => stopAll(0));
    process.once('SIGTERM', () => stopAll(0));
  }
}
