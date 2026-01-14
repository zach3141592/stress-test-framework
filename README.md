# Stress Test Framework

A stress testing framework to test website reliability and performance.

## Installation

```bash
npm install
npm run build
```

## CLI Usage

```bash
# Basic usage
node dist/cli.js --url https://your-website.com

# With options
node dist/cli.js \
  --url https://your-website.com/api/endpoint \
  --concurrent 50 \
  --requests 100 \
  --method POST \
  --header "Content-Type: application/json" \
  --header "Authorization: Bearer token" \
  --data '{"key": "value"}' \
  --timeout 10000 \
  --ramp-up 5

# Install globally (optional)
npm link
stress-test --url https://your-website.com
```

## CLI Options

| Option | Description | Default |
|--------|-------------|---------|
| `-u, --url <url>` | Target URL to test (required) | - |
| `-c, --concurrent <n>` | Number of concurrent users/bots | 10 |
| `-n, --requests <n>` | Requests per user | 10 |
| `-m, --method <method>` | HTTP method (GET/POST/PUT/DELETE/PATCH) | GET |
| `-H, --header <header>` | Add header (can be used multiple times) | - |
| `-d, --data <data>` | Request body for POST/PUT/PATCH | - |
| `-t, --timeout <ms>` | Request timeout in milliseconds | 30000 |
| `-r, --ramp-up <seconds>` | Gradually add users over time | 0 |
| `--delay <ms>` | Delay between requests per user | 0 |
| `-q, --quiet` | Suppress progress output | false |

## Specifying the Target URL

The `--url` or `-u` option tells the script where to send requests:

```bash
# Test a homepage
node dist/cli.js -u https://example.com -c 10 -n 20

# Test an API endpoint
node dist/cli.js -u https://example.com/api/users -c 50 -n 100

# Test with POST data
node dist/cli.js -u https://example.com/api/login \
  -m POST \
  -H "Content-Type: application/json" \
  -d '{"username":"test","password":"test"}'
```

The URL contains everything needed for the request:
- **Protocol**: `https://` - use HTTPS
- **Host**: `example.com` - server to connect to
- **Path**: `/api/users` - endpoint on that server

## Controlling the Number of Bots

Use `-c` (concurrent users) and `-n` (requests per user) to control load:

```bash
# 100 concurrent bots, each making 50 requests (5000 total)
node dist/cli.js -u https://your-site.com -c 100 -n 50

# Gradual ramp-up: add 100 bots over 10 seconds
node dist/cli.js -u https://your-site.com -c 100 -n 50 --ramp-up 10

# Add delay between each bot's requests (pace them out)
node dist/cli.js -u https://your-site.com -c 100 -n 50 --delay 500
```

### Load Scenarios

```bash
# Light load: 10 bots, 10 requests each (100 total)
node dist/cli.js -u https://your-site.com -c 10 -n 10

# Medium load: 50 bots, 100 requests each (5000 total)
node dist/cli.js -u https://your-site.com -c 50 -n 100

# Heavy load: 200 bots, 500 requests each (100000 total), ramped over 30s
node dist/cli.js -u https://your-site.com -c 200 -n 500 -r 30
```

**Total requests = concurrent users x requests per user**

## How It Works

The framework uses Node.js's built-in `fetch()` API to make HTTP requests:

```
fetch('https://example.com/api/users')
       └─────────────┬─────────────┘
                     │
                     ▼
    ┌─────────────────────────────────┐
    │  1. DNS lookup: example.com     │
    │  2. TCP connection to server    │
    │  3. Send HTTP request           │
    │  4. Receive response            │
    └─────────────────────────────────┘
```

Each "bot" runs concurrently and makes its configured number of requests to the target URL. The framework tracks response times, status codes, and errors for all requests.

## Programmatic Usage

```typescript
import { StressTester, formatMetrics } from 'stress-test-framework';

const tester = new StressTester({
  url: 'https://your-website.com/api',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: { key: 'value' },
  concurrentUsers: 50,       // 50 bots
  requestsPerUser: 100,      // each makes 100 requests
  rampUpTime: 5,             // add bots over 5 seconds
  delayBetweenRequests: 100, // 100ms between requests per bot
  timeout: 10000,
});

// Track progress
tester.onProgress((completed, total, rps) => {
  console.log(`Progress: ${completed}/${total} | RPS: ${rps.toFixed(2)}`);
});

// Run the test
const metrics = await tester.run();

// Print formatted results
console.log(formatMetrics(metrics));

// Access raw metrics
console.log('Success rate:', (metrics.successfulRequests / metrics.totalRequests) * 100);
```

## Metrics

The framework collects and reports:

- **Total/Successful/Failed Requests**
- **Response Times**: Average, Min, Max, 95th & 99th percentiles
- **Throughput**: Requests per second
- **Status Codes**: Distribution of HTTP status codes
- **Errors**: Grouped error messages with counts

## Requirements

- Node.js 18+
