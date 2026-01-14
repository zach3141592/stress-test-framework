import type { StressTestConfig, StressTestMetrics, ProgressCallback, TestStatus } from './types.js';
export declare class StressTester {
    private config;
    private metrics;
    private status;
    private abortController;
    private progressCallback;
    constructor(config: StressTestConfig);
    onProgress(callback: ProgressCallback): void;
    getStatus(): TestStatus;
    cancel(): void;
    private isCancelled;
    run(): Promise<StressTestMetrics>;
    private runUser;
    private makeRequest;
    private sleep;
}
export declare function formatMetrics(metrics: StressTestMetrics): string;
