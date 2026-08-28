import { pathToFileURL } from 'node:url';

import { checkTools, requiredToolFailures } from './tool-resolution';

export function printEnvironmentReport(json = false): number {
  const tools = checkTools();
  const failures = requiredToolFailures(tools);

  if (json) {
    console.log(JSON.stringify({ status: failures.length === 0 ? 'PASS' : 'FAIL', tools }, null, 2));
    return failures.length === 0 ? 0 : 1;
  }

  console.log('\n=== 11.11 Production Toolchain Doctor ===\n');
  for (const tool of tools) {
    const status = tool.requirement === 'deferred'
      ? 'DEFERRED'
      : tool.healthy
        ? 'PASS'
        : tool.requirement === 'optional'
          ? 'OPTIONAL'
          : 'FAIL';
    const detail = [tool.version, tool.path].filter(Boolean).join(' | ');
    console.log(`[${status}] ${tool.id}${detail ? ` — ${detail}` : ''}`);
    console.log(`  ${tool.note}`);
  }

  console.log(`\nRequired failures: ${failures.length}`);
  console.log(failures.length === 0 ? 'RESULT: PASS' : 'RESULT: FAIL');
  return failures.length === 0 ? 0 : 1;
}

const invokedPath = process.argv[1] ? pathToFileURL(process.argv[1]).href : '';
if (import.meta.url === invokedPath) {
  process.exitCode = printEnvironmentReport(process.argv.includes('--json'));
}
