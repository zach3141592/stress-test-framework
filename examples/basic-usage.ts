/**
 * Example: Basic programmatic usage of the stress test framework
 *
 * Run with: npx ts-node examples/basic-usage.ts
 * Or after building: node examples/basic-usage.js
 */

import { StressTester, formatMetrics } from '../src/index.js';

async function main() {
  // Basic GET request test
  const tester = new StressTester({
    url: 'https://httpbin.org/get',
    method: 'GET',
    concurrentUsers: 5,
    requestsPerUser: 10,
    timeout: 10000,
  });

  // Track progress
  tester.onProgress((completed, total, rps) => {
    const percent = Math.round((completed / total) * 100);
    process.stdout.write(`\rProgress: ${percent}% | RPS: ${rps.toFixed(2)}`);
  });

  console.log('Starting basic stress test...\n');

  const metrics = await tester.run();

  console.log('\n');
  console.log(formatMetrics(metrics));
}

main().catch(console.error);
