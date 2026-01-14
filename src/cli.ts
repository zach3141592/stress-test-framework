#!/usr/bin/env node

import { program } from 'commander';
import { StressTester, formatMetrics } from './stress-tester.js';
import type { StressTestConfig } from './types.js';

function parseHeaders(value: string, previous: Record<string, string>): Record<string, string> {
  const [key, val] = value.split(':').map(s => s.trim());
  if (key && val) {
    previous[key] = val;
  }
  return previous;
}

program
  .name('stress-test')
  .description('A stress testing framework for testing website reliability')
  .version('1.0.0')
  .requiredOption('-u, --url <url>', 'Target URL to test')
  .option('-c, --concurrent <number>', 'Number of concurrent users', '10')
  .option('-n, --requests <number>', 'Number of requests per user', '10')
  .option('-m, --method <method>', 'HTTP method (GET, POST, PUT, DELETE, PATCH)', 'GET')
  .option('-H, --header <header>', 'Add header (format: "Key: Value")', parseHeaders, {})
  .option('-d, --data <data>', 'Request body data (for POST/PUT/PATCH)')
  .option('-t, --timeout <ms>', 'Request timeout in milliseconds', '30000')
  .option('-r, --ramp-up <seconds>', 'Ramp up time in seconds', '0')
  .option('--delay <ms>', 'Delay between requests per user in ms', '0')
  .option('-q, --quiet', 'Suppress progress output')
  .action(async (options) => {
    const config: StressTestConfig = {
      url: options.url,
      method: options.method.toUpperCase() as StressTestConfig['method'],
      headers: options.header,
      body: options.data,
      concurrentUsers: parseInt(options.concurrent, 10),
      requestsPerUser: parseInt(options.requests, 10),
      timeout: parseInt(options.timeout, 10),
      rampUpTime: parseFloat(options.rampUp),
      delayBetweenRequests: parseInt(options.delay, 10),
    };

    console.log(`
================================================================================
                           STRESS TEST CONFIGURATION
================================================================================
URL:                  ${config.url}
Method:               ${config.method}
Concurrent Users:     ${config.concurrentUsers}
Requests per User:    ${config.requestsPerUser}
Total Requests:       ${config.concurrentUsers * config.requestsPerUser}
Timeout:              ${config.timeout}ms
Ramp Up Time:         ${config.rampUpTime}s
Request Delay:        ${config.delayBetweenRequests}ms
================================================================================
`);

    const tester = new StressTester(config);

    if (!options.quiet) {
      let lastProgress = 0;
      tester.onProgress((completed, total, rps) => {
        const progress = Math.floor((completed / total) * 100);
        if (progress !== lastProgress) {
          lastProgress = progress;
          process.stdout.write(`\rProgress: ${progress}% (${completed}/${total}) | RPS: ${rps.toFixed(2)}`);
        }
      });
    }

    // Handle Ctrl+C
    process.on('SIGINT', () => {
      console.log('\n\nCancelling test...');
      tester.cancel();
    });

    console.log('Starting stress test...\n');

    try {
      const metrics = await tester.run();

      if (!options.quiet) {
        console.log('\n');
      }

      console.log(formatMetrics(metrics));

      // Exit with error code if more than 10% of requests failed
      const failureRate = metrics.failedRequests / metrics.totalRequests;
      if (failureRate > 0.1) {
        process.exit(1);
      }
    } catch (error) {
      console.error('Test failed:', error);
      process.exit(1);
    }
  });

program.parse();
