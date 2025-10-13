import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  renderHook as originalRenderHook,
  render,
  type RenderHookOptions,
  type RenderOptions,
} from "@testing-library/react";
import * as React from "react";

// Mock user data for testing
export const mockUser = {
  sub: "test-user-id",
  email: "test@example.com",
  name: "Test User",
  picture: "https://example.com/avatar.jpg",
  nickname: "testuser",
  email_verified: true,
};

// Mock UserProvider for testing
const MockUserProvider = ({ children }: { children: React.ReactNode }) => {
  return React.createElement(
    "div",
    { "data-testid": "mock-user-provider" },
    children
  );
};

// Test wrapper that provides all necessary providers
interface AllTheProvidersProps {
  children: React.ReactNode;
}

const AllTheProviders = ({ children }: AllTheProvidersProps) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
      },
    },
  });

  return React.createElement(
    QueryClientProvider,
    { client: queryClient },
    React.createElement(MockUserProvider, null, children)
  );
};

// Custom render function that includes providers
const customRender = (
  ui: React.ReactElement,
  options?: Omit<RenderOptions, "wrapper">
) => render(ui, { wrapper: AllTheProviders, ...options });

// Custom renderHook function that includes providers
const customRenderHook = <Result, Props = undefined>(
  hook: (initialProps: Props) => Result,
  options?: RenderHookOptions<Props>
) => originalRenderHook(hook, { wrapper: AllTheProviders, ...options });

// Re-export everything from testing library
export * from "@testing-library/react";
export { default as userEvent } from "@testing-library/user-event";

// Override render and renderHook methods
export { customRender as render, customRenderHook as renderHook };
