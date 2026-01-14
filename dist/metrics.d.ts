import type { RequestResult, StressTestMetrics } from './types.js';
export declare class MetricsCollector {
    private results;
    private startTime;
    private endTime;
    start(): void;
    stop(): void;
    addResult(result: RequestResult): void;
    getCompletedCount(): number;
    getCurrentRps(): number;
    calculateMetrics(): StressTestMetrics;
    private calculateAverage;
    private calculatePercentile;
    reset(): void;
}
