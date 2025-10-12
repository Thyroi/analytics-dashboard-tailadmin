import React from "react";
import { vi } from "vitest";

// Mock Auth0 client
export const mockAuth0 = {
  useUser: vi.fn(() => ({
    user: {
      sub: "test-user-id",
      email: "test@example.com",
      name: "Test User",
      picture: "https://example.com/avatar.jpg",
      nickname: "testuser",
      email_verified: true,
    },
    error: null,
    isLoading: false,
  })),

  withApiAuthRequired: vi.fn((handler) => handler),

  getSession: vi.fn(() =>
    Promise.resolve({
      user: {
        sub: "test-user-id",
        email: "test@example.com",
        name: "Test User",
      },
    })
  ),

  withPageAuthRequired: vi.fn((component) => component),
};

// Mock UserProvider for testing
export const MockUserProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  return React.createElement(
    "div",
    { "data-testid": "mock-user-provider" },
    children
  );
};

// Apply mocks
vi.mock("@auth0/nextjs-auth0", () => mockAuth0);
vi.mock("@auth0/nextjs-auth0/client", () => ({
  UserProvider: MockUserProvider,
  useUser: mockAuth0.useUser,
}));
