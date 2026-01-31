import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterAll, afterEach, beforeAll, vi } from "vitest";
import { server } from "./mocks/server";

// Start MSW server before all tests
beforeAll(() => {
  server.listen({ onUnhandledRequest: "warn" });
});

// Reset handlers after each test
afterEach(() => {
  cleanup();
  server.resetHandlers();
});

// Stop MSW server after all tests
afterAll(() => {
  server.close();
});

// Mock environment variables
vi.stubEnv("PUBLIC_SUPABASE_URL", "http://localhost:54321");
vi.stubEnv("PUBLIC_SUPABASE_ANON_KEY", "mock-anon-key");

// Global test utilities can be added here
