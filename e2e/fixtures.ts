import { test as base } from "@playwright/test";

export interface TestUser {
  username: string;
  userId: string;
  password: string;
}

export interface TestFixtures {
  testUser: TestUser;
}

/**
 * Extended test fixtures with authenticated user credentials
 */
export const test = base.extend<TestFixtures>({
  // eslint-disable-next-line no-empty-pattern
  testUser: async ({}, use) => {
    const username = process.env.E2E_USERNAME;
    const userId = process.env.E2E_USERNAME_ID;
    const password = process.env.E2E_PASSWORD;

    if (!username || !userId || !password) {
      throw new Error("E2E_USERNAME, E2E_USERNAME_ID, and E2E_PASSWORD must be set in .env.test");
    }

    // eslint-disable-next-line react-hooks/rules-of-hooks
    await use({
      username,
      userId,
      password,
    });
  },
});

export { expect } from "@playwright/test";
