import type { StressTestConfig, RequestResult, StressTestMetrics, ProgressCallback, TestStatus } from './types.js';
import { MetricsCollector } from './metrics.js';

export class StressTester {
  private config: StressTestConfig;
  private metrics: MetricsCollector;
  private status: TestStatus = 'idle';
  private abortController: AbortController | null = null;
  private progressCallback: ProgressCallback | null = null;

  constructor(config: StressTestConfig) {
    this.config = {
      method: 'GET',
      timeout: 30000,
      delayBetweenRequests: 0,
      rampUpTime: 0,
      ...config,
    };
    this.metrics = new MetricsCollector();
  }

  onProgress(callback: ProgressCallback): void {
    this.progressCallback = callback;
  }

  getStatus(): TestStatus {
    return this.status;
  }

  cancel(): void {
    if (this.abortController) {
      this.abortController.abort();
      this.status = 'cancelled';
    }
  }

  private isCancelled(): boolean {
    return this.status === 'cancelled';
  }

  async run(): Promise<StressTestMetrics> {
    this.status = 'running';
    this.metrics.reset();
    this.metrics.start();
    this.abortController = new AbortController();

    const userPromises: Promise<void>[] = [];

    const rampUpDelay = this.config.rampUpTime
      ? (this.config.rampUpTime * 1000) / this.config.concurrentUsers
      : 0;

    for (let user = 0; user < this.config.concurrentUsers; user++) {
      if (this.isCancelled()) break;

      const userPromise = this.runUser();
      userPromises.push(userPromise);

      if (rampUpDelay > 0 && user < this.config.concurrentUsers - 1) {
        await this.sleep(rampUpDelay);
      }
    }

    await Promise.all(userPromises);

    this.metrics.stop();
    if (!this.isCancelled()) {
      this.status = 'completed';
    }

    return this.metrics.calculateMetrics();
  }

  private async runUser(): Promise<void> {
    for (let i = 0; i < this.config.requestsPerUser; i++) {
      if (this.isCancelled()) break;

      const result = await this.makeRequest();
      this.metrics.addResult(result);

      const totalRequests = this.config.concurrentUsers * this.config.requestsPerUser;
      if (this.progressCallback) {
        this.progressCallback(
          this.metrics.getCompletedCount(),
          totalRequests,
          this.metrics.getCurrentRps()
        );
      }

      if (this.config.delayBetweenRequests && i < this.config.requestsPerUser - 1) {
        await this.sleep(this.config.delayBetweenRequests);
      }
    }
  }

  private async makeRequest(): Promise<RequestResult> {
    const startTime = Date.now();

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);

      const fetchOptions: RequestInit = {
        method: this.config.method,
        headers: this.config.headers,
        signal: controller.signal,
      };

      if (this.config.body && ['POST', 'PUT', 'PATCH'].includes(this.config.method || 'GET')) {
        fetchOptions.body = typeof this.config.body === 'string'
          ? this.config.body
          : JSON.stringify(this.config.body);
      }

      const response = await fetch(this.config.url, fetchOptions);
      clearTimeout(timeoutId);

      const responseTime = Date.now() - startTime;

      return {
        success: response.ok,
        statusCode: response.status,
        responseTime,
        timestamp: new Date(),
        error: response.ok ? undefined : `HTTP ${response.status}`,
      };
    } catch (error) {
      const responseTime = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      return {
        success: false,
        statusCode: null,
        responseTime,
        timestamp: new Date(),
        error: errorMessage,
      };
    }
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

export function formatMetrics(metrics: StressTestMetrics): string {
  const successRate = metrics.totalRequests > 0
    ? ((metrics.successfulRequests / metrics.totalRequests) * 100).toFixed(2)
    : '0.00';

  let output = `
================================================================================
                           STRESS TEST RESULTS
================================================================================

Test Duration:        ${metrics.duration.toFixed(2)}s
Total Requests:       ${metrics.totalRequests}
Successful:           ${metrics.successfulRequests} (${successRate}%)
Failed:               ${metrics.failedRequests}

RESPONSE TIMES
--------------
Average:              ${metrics.averageResponseTime.toFixed(2)}ms
Min:                  ${metrics.minResponseTime.toFixed(2)}ms
Max:                  ${metrics.maxResponseTime.toFixed(2)}ms
95th Percentile:      ${metrics.percentile95.toFixed(2)}ms
99th Percentile:      ${metrics.percentile99.toFixed(2)}ms

THROUGHPUT
----------
Requests/sec:         ${metrics.requestsPerSecond.toFixed(2)}

STATUS CODES
------------`;

  for (const [code, count] of Object.entries(metrics.statusCodes)) {
    output += `\n${code}:                   ${count}`;
  }

  if (Object.keys(metrics.errorMessages).length > 0) {
    output += `\n
ERRORS
------`;
    for (const [error, count] of Object.entries(metrics.errorMessages)) {
      output += `\n${error}: ${count}`;
    }
  }

  output += '\n================================================================================\n';

  return output;
}
