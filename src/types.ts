export interface StressTestConfig {
  url: string;
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  headers?: Record<string, string>;
  body?: string | object;
  concurrentUsers: number;
  requestsPerUser: number;
  rampUpTime?: number; // seconds to gradually add users
  delayBetweenRequests?: number; // ms between each request per user
  timeout?: number; // request timeout in ms
}

export interface RequestResult {
  success: boolean;
  statusCode: number | null;
  responseTime: number; // in ms
  error?: string;
  timestamp: Date;
}

export interface StressTestMetrics {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  averageResponseTime: number;
  minResponseTime: number;
  maxResponseTime: number;
  requestsPerSecond: number;
  percentile95: number;
  percentile99: number;
  statusCodes: Record<number, number>;
  errorMessages: Record<string, number>;
  startTime: Date;
  endTime: Date;
  duration: number; // in seconds
}

export interface ProgressCallback {
  (completed: number, total: number, currentRps: number): void;
}

export type TestStatus = 'idle' | 'running' | 'completed' | 'cancelled';
