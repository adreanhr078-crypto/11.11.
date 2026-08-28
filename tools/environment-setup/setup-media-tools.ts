/**
 * Non-installing environment snapshot. This command never launches installers,
 * changes PATH, or writes tracked machine-specific state.
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

import { checkTools, requiredToolFailures } from './tool-resolution';

const reportPath = resolve('artifacts/eleven-eleven/.tmp/environment/media-toolchain-report.json');
const tools = checkTools();
const failures = requiredToolFailures(tools);

mkdirSync(dirname(reportPath), { recursive: true });
writeFileSync(reportPath, `${JSON.stringify({ generatedAt: new Date().toISOString(), tools }, null, 2)}\n`);

console.log(`Wrote local report: ${reportPath}`);
console.log('No software was installed and no system settings were changed.');
console.log(failures.length === 0 ? 'RESULT: PASS' : `RESULT: FAIL (${failures.length} required tool(s))`);
process.exitCode = failures.length === 0 ? 0 : 1;
