import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Mock Next.js
vi.mock('next/server', () => ({
  NextRequest: class MockNextRequest {
    constructor(public url: string, public init?: RequestInit) {}
    async json() {
      return JSON.parse(this.init?.body as string || '{}');
    }
  },
  NextResponse: {
    json: (data: any, init?: ResponseInit) => new Response(JSON.stringify(data), init),
  },
}));

// Mock environment variables
vi.stubEnv('NODE_ENV', 'test');

// Mock console methods to reduce noise in tests
global.console = {
  ...console,
  log: vi.fn(),
  debug: vi.fn(),
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
};
