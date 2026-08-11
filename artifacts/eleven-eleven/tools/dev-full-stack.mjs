import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import { dirname, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');

const services = [
  {
    name: 'web',
    entry: resolve(projectRoot, 'node_modules', 'vite', 'bin', 'vite.js'),
    args: [
      '--config',
      'vite.config.ts',
      '--host',
      '0.0.0.0',
      '--strictPort',
    ],
    port: 3000,
  },
  {
    name: 'player-api',
    entry: resolve(
      projectRoot,
      'node_modules',
      'wrangler',
      'bin',
      'wrangler.js',
    ),
    args: [
      'pages',
      'dev',
      'public',
      '--port',
      '8788',
      '--log-level',
      'warn',
      '--show-interactive-dev-session=false',
    ],
    port: 8788,
  },
];

function validationReport() {
  const serviceReport = services.map((service) => ({
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

if (process.argv.includes('--check')) {
  const report = validationReport();
  console.log(JSON.stringify(report));
  if (!report.valid) process.exitCode = 1;
} else {
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
        if (child.exitCode === null && child.signalCode === null) {
          child.kill('SIGKILL');
        }
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

  for (const service of services) {
    const child = spawn(
      process.execPath,
      [service.entry, ...service.args],
      {
        cwd: projectRoot,
        env: process.env,
        stdio: 'inherit',
        windowsHide: true,
      },
    );
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

  process.once('SIGINT', () => stopAll(0));
  process.once('SIGTERM', () => stopAll(0));
}
