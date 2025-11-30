/**
 * Mock for @getflywheel/local
 * Provides mock types and interfaces
 */

// Mock Site interface matching Local's structure
export interface Site {
  id: string;
  name: string;
  path: string;
  domain: string;
  host?: string;
  httpPort?: number;
  mysql?: {
    database: string;
    user: string;
    password: string;
    port?: number;
  };
  environment?: string;
  services?: {
    nginx?: { ports?: { HTTP?: number[] } };
    apache?: { ports?: { HTTP?: number[] } };
  };
}

// Mock site factory for tests
export const createMockSite = (overrides: Partial<Site> = {}): Site => ({
  id: 'test-site-id',
  name: 'Test Site',
  path: '/Users/test/Local Sites/test-site',
  domain: 'test-site.local',
  host: 'localhost',
  httpPort: 10000,
  mysql: {
    database: 'local',
    user: 'root',
    password: 'root',
    port: 10001
  },
  environment: 'development',
  services: {
    nginx: { ports: { HTTP: [10000] } }
  },
  ...overrides
});

export default {
  Site: {} as Site,
  createMockSite
};
