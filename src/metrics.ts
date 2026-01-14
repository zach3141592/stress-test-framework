import type { RequestResult, StressTestMetrics } from './types.js';

export class MetricsCollector {
  private results: RequestResult[] = [];
  private startTime: Date | null = null;
  private endTime: Date | null = null;

  start(): void {
    this.startTime = new Date();
    this.results = [];
  }

  stop(): void {
    this.endTime = new Date();
  }

  addResult(result: RequestResult): void {
    this.results.push(result);
  }

  getCompletedCount(): number {
    return this.results.length;
  }

  getCurrentRps(): number {
    if (!this.startTime || this.results.length === 0) return 0;
    const elapsed = (Date.now() - this.startTime.getTime()) / 1000;
    if (elapsed === 0) return 0;
    return this.results.length / elapsed;
  }

  calculateMetrics(): StressTestMetrics {
    const start = this.startTime || new Date();
    const end = this.endTime || new Date();
    const duration = (end.getTime() - start.getTime()) / 1000;

    const successfulResults = this.results.filter(r => r.success);
    const failedResults = this.results.filter(r => !r.success);

    const responseTimes = this.results
      .filter(r => r.responseTime > 0)
      .map(r => r.responseTime)
      .sort((a, b) => a - b);

    const statusCodes: Record<number, number> = {};
    this.results.forEach(r => {
      if (r.statusCode !== null) {
        statusCodes[r.statusCode] = (statusCodes[r.statusCode] || 0) + 1;
      }
    });

    const errorMessages: Record<string, number> = {};
    failedResults.forEach(r => {
      if (r.error) {
        errorMessages[r.error] = (errorMessages[r.error] || 0) + 1;
      }
    });

    return {
      totalRequests: this.results.length,
      successfulRequests: successfulResults.length,
      failedRequests: failedResults.length,
      averageResponseTime: this.calculateAverage(responseTimes),
      minResponseTime: responseTimes[0] || 0,
      maxResponseTime: responseTimes[responseTimes.length - 1] || 0,
      requestsPerSecond: duration > 0 ? this.results.length / duration : 0,
      percentile95: this.calculatePercentile(responseTimes, 95),
      percentile99: this.calculatePercentile(responseTimes, 99),
      statusCodes,
      errorMessages,
      startTime: start,
      endTime: end,
      duration,
    };
  }

  private calculateAverage(values: number[]): number {
    if (values.length === 0) return 0;
    return values.reduce((sum, val) => sum + val, 0) / values.length;
  }

  private calculatePercentile(sortedValues: number[], percentile: number): number {
    if (sortedValues.length === 0) return 0;
    const index = Math.ceil((percentile / 100) * sortedValues.length) - 1;
    return sortedValues[Math.max(0, index)] || 0;
  }

  reset(): void {
    this.results = [];
    this.startTime = null;
    this.endTime = null;
  }
}
