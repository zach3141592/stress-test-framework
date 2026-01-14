/**
 * Example: POST request stress test with custom headers and body
 *
 * Run with: npx ts-node examples/post-request.ts
 */

import { StressTester, formatMetrics } from '../src/index.js';

async function main() {
  const tester = new StressTester({
    url: 'https://httpbin.org/post',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer your-token-here',
    },
    body: {
      username: 'testuser',
      action: 'stress-test',
      timestamp: Date.now(),
    },
    concurrentUsers: 10,
    requestsPerUser: 20,
    rampUpTime: 2, // Gradually add users over 2 seconds
    delayBetweenRequests: 100, // 100ms between requests per user
    timeout: 15000,
  });

  tester.onProgress((completed, total, rps) => {
    const percent = Math.round((completed / total) * 100);
    process.stdout.write(`\rProgress: ${percent}% (${completed}/${total}) | RPS: ${rps.toFixed(2)}`);
  });

  console.log('Starting POST stress test with ramp-up...\n');

  const metrics = await tester.run();

  console.log('\n');
  console.log(formatMetrics(metrics));

  // You can also access raw metrics programmatically
  console.log('Success rate:', ((metrics.successfulRequests / metrics.totalRequests) * 100).toFixed(2) + '%');
}

main().catch(console.error);
