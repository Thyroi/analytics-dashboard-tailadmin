import "@testing-library/jest-dom";
import React from "react";
import { loadEnv } from "vite";
import { beforeEach, vi } from "vitest";
import createFetchMock from "vitest-fetch-mock";

// Make React available globally for JSX transform
global.React = React;

// Load environment variables
const env = loadEnv("", process.cwd(), "");
Object.assign(process.env, env);

// Setup fetch mock
const fetchMocker = createFetchMock(vi);
fetchMocker.enableMocks();

// Mock IntersectionObserver
global.IntersectionObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// Mock ResizeObserver
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// Mock window.matchMedia
Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: vi.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock console methods in tests to avoid noise
global.console = {
  ...console,
  log: vi.fn(),
  debug: vi.fn(),
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
};

// Mock Auth0
vi.mock("@auth0/nextjs-auth0", () => ({
  useUser: vi.fn(() => ({
    user: null,
    error: null,
    isLoading: false,
  })),
  withApiAuthRequired: vi.fn((handler) => handler),
  getSession: vi.fn(),
  withPageAuthRequired: vi.fn((component) => component),
}));

// Mock Next.js router
vi.mock("next/navigation", () => ({
  useRouter: vi.fn(() => ({
    push: vi.fn(),
    replace: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    refresh: vi.fn(),
    prefetch: vi.fn(),
  })),
  usePathname: vi.fn(() => "/"),
  useSearchParams: vi.fn(() => new URLSearchParams()),
}));

// Mock next/image
vi.mock("next/image", () => ({
  default: vi.fn().mockImplementation(({ src, alt }) => {
    return `<img src="${src}" alt="${alt}" />`;
  }),
}));

// Mock ApexCharts
vi.mock("react-apexcharts", () => ({
  default: vi
    .fn()
    .mockImplementation(
      () => `<div data-testid="mock-chart">Chart Component</div>`
    ),
}));

// Clear all mocks before each test
beforeEach(() => {
  vi.clearAllMocks();
  fetchMocker.resetMocks();
});
