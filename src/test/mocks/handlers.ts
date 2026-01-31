import { http, HttpResponse } from "msw";

/**
 * MSW Request Handlers
 * Define mock API responses here
 */
export const handlers = [
  // Example: Mock Supabase auth endpoint
  http.post("/auth/v1/token", () => {
    return HttpResponse.json({
      access_token: "mock-access-token",
      token_type: "bearer",
      expires_in: 3600,
      refresh_token: "mock-refresh-token",
      user: {
        id: "mock-user-id",
        email: "test@example.com",
      },
    });
  }),

  // Example: Mock API endpoint
  http.get("/api/flashcards", () => {
    return HttpResponse.json({
      data: [
        { id: "1", front: "Question 1", back: "Answer 1" },
        { id: "2", front: "Question 2", back: "Answer 2" },
      ],
    });
  }),

  // Example: Mock error response
  http.get("/api/error", () => {
    return HttpResponse.json(
      {
        error: "Internal Server Error",
      },
      { status: 500 }
    );
  }),
];
